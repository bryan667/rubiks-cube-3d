import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CameraControls, dToR } from "./utils";
import Corner from "./CornerDimensions";
import Edge from "./EdgeDimensions";
import swapColors from "./swapColors";
import type { DecaObject, DecaFace, DecaPiece } from "./swapColors";
import facesToHide from "./facesToHide";
import colorMatchUps from "./colorMatchUps";
import facePos from "./facePositions";
import calculateTurn from "./calculateTurn";
import "./MegaMinx.css";
import scramble from "../Main/scramble";
import rightArrow from "./arrow.png";
import leftArrow from "./leftArrow.png";

// Extend THREE.Mesh with custom properties used throughout
interface ExtendedMesh extends THREE.Mesh {
  material: THREE.MeshBasicMaterial;
  name: string;
  piece?: number;
  side?: string;
}

declare module "three" {
  interface Mesh {
    piece?: number;
    side?: string;
  }
}

type TranslateRotate = { x?: number; y?: number; z?: number } | undefined;

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKY_FRAGMENT_SHADER = `
  varying vec3 vWorldPosition;

  void main() {
    float height = normalize(vWorldPosition).y * 0.5 + 0.5;
    vec3 horizon = vec3(0.86, 0.95, 1.0);
    vec3 midSky = vec3(0.52, 0.77, 0.98);
    vec3 zenith = vec3(0.14, 0.42, 0.82);
    vec3 warmGlow = vec3(1.0, 0.89, 0.73);

    vec3 base = mix(horizon, midSky, smoothstep(0.12, 0.58, height));
    base = mix(base, zenith, smoothstep(0.58, 1.0, height));

    float sunBand = smoothstep(0.0, 0.35, 1.0 - abs(height - 0.3) * 2.6);
    vec3 color = mix(base, warmGlow, sunBand * 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const DEFAULT_FACE_COLORS: string[] = [
  "#FFFFFF", // 0  white      — top cap
  "#CC0000", // 1  red        — top ring (opp. orange)
  "#00008F", // 2  darkblue   — top ring (opp. lightblue)
  "#F7F700", // 3  yellow     — top ring (opp. beige)
  "#6E006E", // 4  purple     — top ring (opp. pink)
  "#007A00", // 5  darkgreen  — top ring (opp. lightgreen)
  "#808080", // 6  gray       — bottom cap
  "#F5F5DC", // 7  beige      — bottom ring (opp. yellow)
  "#FFC0CB", // 8  pink       — bottom ring (opp. purple)
  "#90EE90", // 9  lightgreen — bottom ring (opp. darkgreen)
  "#FF8C00", // 10 orange     — bottom ring (opp. red)
  "#00BFFF", // 11 lightblue  — bottom ring (opp. darkblue)
];

const COLOR_NAMES: string[] = [
  "white",
  "red",
  "darkblue",
  "yellow",
  "purple",
  "darkgreen",
  "gray",
  "beige",
  "pink",
  "lightgreen",
  "orange",
  "lightblue",
];

// Maps speed setting (0-7) to actual speed values; available for external speed control integration
export const SPEED_VALUE_MAP: Record<number, number> = {
  0: 0.25,
  1: 0.5,
  2: 1,
  3: 3,
  4: 6,
  5: 12,
  6: 24,
  7: 72,
};

if (!(Math as any).csc) {
  (Math as any).csc = function csc(x: number): number {
    return 1 / Math.sin(x);
  };
}

interface ControllerState {
  faceToRotate: string;
  moveQueue: string[];
  moveLog: string[];
  moveLogIndex: number;
  speedChanged: boolean;
  speedHolder: number;
  speed: number;
  counter: number;
  updateMouse: boolean;
  currentFunc: string;
  undoRedo: boolean;
  moveSetter: ((val: number) => void) | undefined;
  moveType: string | undefined;
  moveCurrent: number | undefined;
  modeSetter: ((val: string) => void) | undefined;
  manualTurn: string;
  startPoint: THREE.Vector2 | null;
  newPoint: THREE.Vector2 | null;
  selectedSide: string | null;
  selectedPiece: number | null;
}

const createControllerState = (): ControllerState => ({
  faceToRotate: "face0",
  moveQueue: [],
  moveLog: [],
  moveLogIndex: 0,
  speedChanged: false,
  speedHolder: 12,
  speed: 12,
  counter: 0,
  updateMouse: false,
  currentFunc: "none",
  undoRedo: false,
  moveSetter: undefined,
  moveType: undefined,
  moveCurrent: undefined,
  modeSetter: undefined,
  manualTurn: "none",
  startPoint: null,
  newPoint: null,
  selectedSide: null,
  selectedPiece: null,
});

export interface MegaMinxActions {
  scramble: () => void;
  undo: () => void;
}

interface MegaMinxProps {
  reset: () => void;
  onRegisterActions: (actions: MegaMinxActions) => void;
}

const MegaMinx = ({ reset: _reset, onRegisterActions }: MegaMinxProps) => {
  const [faceColors] = useState<string[]>(DEFAULT_FACE_COLORS);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<ControllerState>(createControllerState());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  const decaObjectRef = useRef<DecaObject>({});
  const rightHintsRef = useRef<Record<string, THREE.Mesh[]>>({});
  const leftHintsRef = useRef<Record<string, THREE.Mesh[]>>({});

  const setCurrentFunction = (func: string): void => {
    stateRef.current.currentFunc = func;
  };

  const reverseMove = (move: string): string =>
    move.includes("'") ? move.replace("'", "") : `${move}'`;

  const setMoveLogIndex = (direction: number): void => {
    const controller = stateRef.current;

    if (direction >= 0 && controller.moveLogIndex <= controller.moveLog.length - 1) {
      controller.undoRedo = true;
      controller.moveQueue.push(controller.moveLog[controller.moveLogIndex]);
      controller.moveLogIndex += 1;
      return;
    }

    if (direction < 0 && controller.moveLogIndex > 0) {
      controller.undoRedo = true;
      controller.moveLogIndex -= 1;
      controller.moveQueue.push(reverseMove(controller.moveLog[controller.moveLogIndex]));
    }
  };

  const setMoveQueue = (
    moves: string[],
    force?: boolean,
    setCurrentMove?: (val: number) => void,
    currentMove?: number,
    type?: string,
    mode?: (val: string) => void
  ): void => {
    const controller = stateRef.current;

    if (force) {
      controller.moveQueue = moves;
      return;
    }

    controller.moveSetter = setCurrentMove;
    controller.moveType = controller.moveType || type;
    controller.moveCurrent = currentMove;
    controller.modeSetter = mode;
    controller.moveQueue = controller.moveQueue.length ? controller.moveQueue : moves;
  };

  const hexToColor = useMemo(() => {
    const mappedColors: Record<string, string> = {};

    faceColors.forEach((color, index) => {
      mappedColors[color.replace("#", "").toLowerCase()] = COLOR_NAMES[index];
    });

    return mappedColors;
  }, [faceColors]);

  // hexToColor is available for external use / future solver features
  void hexToColor;

  useEffect(() => {
    if (!onRegisterActions) return;
    onRegisterActions({
      scramble: () => {
        setMoveQueue(scramble());
        setCurrentFunction("scramble");
      },
      undo: () => setMoveLogIndex(-1),
    });
  }, []);

  useEffect(() => {
    const controller = createControllerState();
    stateRef.current = controller;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const controls = CameraControls(camera, renderer, scene);
    const decaObject: DecaObject = {};
    const rightHints: Record<string, THREE.Mesh[]> = {};
    const leftHints: Record<string, THREE.Mesh[]> = {};
    const textureLoader = new THREE.TextureLoader();
    const right = textureLoader.load(rightArrow);
    const left = textureLoader.load(leftArrow);
    let animationFrameId: number;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    raycasterRef.current = raycaster;
    mouseRef.current = mouse;
    decaObjectRef.current = decaObject;
    rightHintsRef.current = rightHints;
    leftHintsRef.current = leftHints;

    scene.fog = new THREE.Fog("#d9efff", 20, 36);
    renderer.setClearColor(new THREE.Color("#d9efff"), 1);
    renderer.domElement.className = "canvas";

    const skyGradient = new THREE.Mesh(
      new THREE.SphereGeometry(90, 48, 48),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: SKY_VERTEX_SHADER,
        fragmentShader: SKY_FRAGMENT_SHADER,
      })
    );

    skyGradient.renderOrder = -1000;
    scene.add(skyGradient);

    camera.position.set(7.5, 7, 9);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    right.anisotropy = renderer.capabilities.getMaxAnisotropy();
    left.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const pentagonMesh = (
      n: number,
      translate: TranslateRotate,
      rotate: TranslateRotate,
      color: string,
      index: number
    ): void => {
      const lineWidth = 0.97;
      const size = n || 1;
      const faceColor = color || "grey";
      const pentagon = new THREE.Shape();
      const innerPentagon = new THREE.Shape();
      const c1 = Math.cos((2 * Math.PI) / 5);
      const c2 = Math.cos(Math.PI / 5);
      const s1 = Math.sin((2 * Math.PI) / 5);
      const s2 = Math.sin((4 * Math.PI) / 5);

      pentagon.moveTo(0, 1 * size);
      pentagon.lineTo(s1 * size, c1 * size);
      pentagon.lineTo(s2 * size, -c2 * size);
      pentagon.lineTo(-s2 * size, -c2 * size);
      pentagon.lineTo(-s1 * size, c1 * size);

      innerPentagon.moveTo(0, 1 * size * lineWidth);
      innerPentagon.lineTo(s1 * size * lineWidth, c1 * size * lineWidth);
      innerPentagon.lineTo(s2 * size * lineWidth, -c2 * size * lineWidth);
      innerPentagon.lineTo(-s2 * size * lineWidth, -c2 * size * lineWidth);
      innerPentagon.lineTo(-s1 * size * lineWidth, c1 * size * lineWidth);

      const outline = new THREE.Mesh(
        new THREE.ShapeGeometry(pentagon),
        new THREE.MeshBasicMaterial({
          color: "black",
          side: THREE.DoubleSide,
          depthWrite: true,
        })
      );

      const fill = new THREE.Mesh(
        new THREE.ShapeGeometry(innerPentagon),
        new THREE.MeshBasicMaterial({
          color: faceColor,
          side: THREE.FrontSide,
          depthWrite: true,
        })
      ) as ExtendedMesh;

      fill.name = "center";
      fill.side = COLOR_NAMES[index];

      const offsetZ = 0.205;
      const offsetY = -0.81;

      const ty = translate?.y || 0;

      outline.translateZ(translate?.z || 0);
      outline.rotateZ(rotate?.z || 0);
      outline.rotateY(rotate?.y || 0);
      outline.translateY(ty);
      outline.translateX(translate?.x || 0);
      outline.rotateX(rotate?.x || 0);
      outline.translateZ(-ty / 2 + (ty ? offsetZ : 0));
      outline.translateY(ty / 2 + (ty ? offsetY : 0));

      fill.translateZ(index < 6 ? (translate?.z || 0) + 0.01 : (translate?.z || 0) - 0.01);
      fill.rotateZ(rotate?.z || 0);
      fill.rotateY(rotate?.y || 0);
      fill.translateY(ty);
      fill.translateX(translate?.x || 0);
      fill.rotateX(rotate?.x || 0);
      fill.translateZ(-ty / 2 + (ty ? offsetZ : 0));
      fill.translateY(ty / 2 + (ty ? offsetY : 0));

      scene.add(outline, fill);
      (decaObject[`face${index + 1}`] as DecaFace).front.push(outline as DecaPiece, fill as DecaPiece);
    };

    const squareMesh = (
      _n: number,
      position: { p1: [number, number]; p2: [number, number]; p3: [number, number]; p4: [number, number] },
      position2: { p1: [number, number]; p2: [number, number]; p3: [number, number]; p4: [number, number] },
      translate: TranslateRotate,
      rotate: TranslateRotate,
      color: string,
      index: number,
      piece: number
    ): void => {
      const square = new THREE.Shape();
      const square2 = new THREE.Shape();

      square.moveTo(...position.p1);
      square.lineTo(...position.p2);
      square.lineTo(...position.p3);
      square.lineTo(...position.p4);

      square2.moveTo(...position2.p1);
      square2.lineTo(...position2.p2);
      square2.lineTo(...position2.p3);
      square2.lineTo(...position2.p4);

      const outline = new THREE.Mesh(
        new THREE.ShapeGeometry(square),
        new THREE.MeshBasicMaterial({
          color: "black",
          side: THREE.DoubleSide,
          depthWrite: true,
        })
      );

      const fill = new THREE.Mesh(
        new THREE.ShapeGeometry(square2),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.FrontSide,
          depthWrite: true,
        })
      ) as ExtendedMesh;

      if (piece > 0 && piece < 6) {
        fill.name = "corner";
      }

      if (piece > 5 && piece < 11) {
        fill.name = "edge";
      }

      fill.piece = piece;
      fill.side = COLOR_NAMES[index];
      fill.scale.set(0.95, 0.95, 1);

      outline.translateZ(translate?.z || 0);
      fill.translateZ(index < 6 ? (translate?.z || 0) + 0.005 : (translate?.z || 0) - 0.005);

      const offsetZ = 0.205;
      const offsetY = -0.81;

      const ty = translate?.y || 0;

      outline.rotateZ(rotate?.z || 0);
      outline.rotateY(rotate?.y || 0);
      outline.translateY(ty);
      outline.translateX(translate?.x || 0);
      outline.rotateX(rotate?.x || 0);
      outline.translateZ(-ty / 2 + (ty ? offsetZ : 0));
      outline.translateY(ty / 2 + (ty ? offsetY : 0));

      fill.rotateZ(rotate?.z || 0);
      fill.rotateY(rotate?.y || 0);
      fill.translateY(ty);
      fill.translateX(translate?.x || 0);
      fill.rotateX(rotate?.x || 0);
      fill.translateZ(-ty / 2 + (ty ? offsetZ : 0));
      fill.translateY(ty / 2 + (ty ? offsetY : 0));

      if (piece > 10) {
        outline.rotateZ(dToR(-36 - 72 * (piece - 11)));
        outline.rotateX(dToR(-63.2));
        fill.rotateZ(dToR(-36 - 72 * (piece - 11)));
        fill.rotateX(dToR(-63.2));
        outline.translateZ(1.625);
        outline.translateY(-1);
        fill.translateZ(1.631);
        fill.translateY(-0.895);
      }

      scene.add(outline, fill);

      if (piece < 11) {
        (decaObject[`face${index + 1}`] as DecaFace).front.push(outline as DecaPiece, fill as DecaPiece);
      } else {
        (decaObject[`face${index + 1}`] as DecaFace).sides.push(outline as DecaPiece, fill as DecaPiece);
      }

      if (piece > 10) {
        outline.visible = false;
        fill.visible = false;
      }
    };

    const hintArrowMesh = (
      rotate: TranslateRotate,
      index: number,
      piece: number,
      direction: "right" | "left"
    ): void => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1),
        new THREE.MeshBasicMaterial({
          side: THREE.FrontSide,
          map: direction === "right" ? right : left,
          transparent: true,
          opacity: 0.8,
        })
      );

      plane.rotateZ(rotate?.z || 0);
      plane.rotateY(rotate?.y || 0);
      plane.rotateX(rotate?.x || 0);
      plane.rotateZ(dToR(-36 - 72 * (piece - 11)));
      plane.rotateX(dToR(-63.2));
      plane.translateZ(3);
      plane.translateY(-1.3);
      plane.visible = false;

      scene.add(plane);

      const rightKey = `${index + 1}`;
      const leftKey = `${index + 1}'`;

      if (!rightHints[rightKey]) {
        rightHints[rightKey] = [];
      }

      if (!leftHints[leftKey]) {
        leftHints[leftKey] = [];
      }

      if (direction === "right") {
        rightHints[rightKey][piece - 11] = plane;
      } else {
        leftHints[leftKey][piece - 11] = plane;
      }
    };

    const decaFace = (
      n: number,
      translate: TranslateRotate,
      rotate: TranslateRotate,
      color: string,
      index: number
    ): void => {
      pentagonMesh(n, translate, rotate, color, index);

      squareMesh(n, Corner(n, "face1", "corner1"), Corner(n, "face1", "corner1", 1), translate, rotate, color, index, 1);
      squareMesh(n, Corner(n, "face1", "corner2"), Corner(n, "face1", "corner2", 1), translate, rotate, color, index, 2);
      squareMesh(n, Corner(n, "face1", "corner3"), Corner(n, "face1", "corner3", 1), translate, rotate, color, index, 3);
      squareMesh(n, Corner(n, "face1", "corner4"), Corner(n, "face1", "corner4", 1), translate, rotate, color, index, 4);
      squareMesh(n, Corner(n, "face1", "corner5"), Corner(n, "face1", "corner5", 1), translate, rotate, color, index, 5);

      squareMesh(n, Edge(n, "face1", "edge1"), Edge(n, "face1", "edge1", 1), translate, rotate, color, index, 6);
      squareMesh(n, Edge(n, "face1", "edge2"), Edge(n, "face1", "edge2", 1), translate, rotate, color, index, 7);
      squareMesh(n, Edge(n, "face1", "edge3"), Edge(n, "face1", "edge3", 1), translate, rotate, color, index, 8);
      squareMesh(n, Edge(n, "face1", "edge4"), Edge(n, "face1", "edge4", 1), translate, rotate, color, index, 9);
      squareMesh(n, Edge(n, "face1", "edge5"), Edge(n, "face1", "edge5", 1), translate, rotate, color, index, 10);

      squareMesh(n, Edge(n, "sides", "side1"), Edge(n, "sides", "side1", 2), translate, rotate, color, index, 11);
      squareMesh(n, Edge(n, "sides", "side1"), Edge(n, "sides", "side1", 2), translate, rotate, color, index, 12);
      squareMesh(n, Edge(n, "sides", "side1"), Edge(n, "sides", "side1", 2), translate, rotate, color, index, 13);
      squareMesh(n, Edge(n, "sides", "side1"), Edge(n, "sides", "side1", 2), translate, rotate, color, index, 14);
      squareMesh(n, Edge(n, "sides", "side1"), Edge(n, "sides", "side1", 2), translate, rotate, color, index, 15);

      hintArrowMesh(rotate, index, 11, "right");
      hintArrowMesh(rotate, index, 12, "right");
      hintArrowMesh(rotate, index, 13, "right");
      hintArrowMesh(rotate, index, 14, "right");
      hintArrowMesh(rotate, index, 15, "right");

      hintArrowMesh(rotate, index, 11, "left");
      hintArrowMesh(rotate, index, 12, "left");
      hintArrowMesh(rotate, index, 13, "left");
      hintArrowMesh(rotate, index, 14, "left");
      hintArrowMesh(rotate, index, 15, "left");

      squareMesh(n, Corner(n, "sides", "side1a"), Corner(n, "sides", "side1a", 1), translate, rotate, color, index, 16);
      squareMesh(n, Corner(n, "sides", "side1a"), Corner(n, "sides", "side1a", 1), translate, rotate, color, index, 17);
      squareMesh(n, Corner(n, "sides", "side1a"), Corner(n, "sides", "side1a", 1), translate, rotate, color, index, 18);
      squareMesh(n, Corner(n, "sides", "side1a"), Corner(n, "sides", "side1a", 1), translate, rotate, color, index, 19);
      squareMesh(n, Corner(n, "sides", "side1a"), Corner(n, "sides", "side1a", 1), translate, rotate, color, index, 20);

      squareMesh(n, Corner(n, "sides", "side1b"), Corner(n, "sides", "side1b", 1), translate, rotate, color, index, 21);
      squareMesh(n, Corner(n, "sides", "side1b"), Corner(n, "sides", "side1b", 1), translate, rotate, color, index, 22);
      squareMesh(n, Corner(n, "sides", "side1b"), Corner(n, "sides", "side1b", 1), translate, rotate, color, index, 23);
      squareMesh(n, Corner(n, "sides", "side1b"), Corner(n, "sides", "side1b", 1), translate, rotate, color, index, 24);
      squareMesh(n, Corner(n, "sides", "side1b"), Corner(n, "sides", "side1b", 1), translate, rotate, color, index, 25);
    };

    facePos.forEach((_, index) => {
      decaObject[`face${index + 1}`] = { front: [], sides: [] };
    });

    facePos.forEach((set, index) => {
      const translate = set.translate as TranslateRotate;
      const rotate = set.rotate === 0 ? undefined : set.rotate as TranslateRotate;
      decaFace(1, translate, rotate, faceColors[index], index);
    });

    const handleResize = (): void => {
      const el = renderer.domElement;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.lookAt(scene.position);
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      controller.startPoint = null;
      controller.selectedSide = null;
      controller.selectedPiece = null;
      controller.updateMouse = false;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children);
      const filteredIntersects = intersects.filter(
        (entry) => entry.object.name === "corner" || entry.object.name === "edge"
      );

      if (filteredIntersects[0]) {
        controls.enabled = false;
        if (
          !controller.moveQueue.length &&
          ["none", "solver", "patterns"].includes(controller.currentFunc)
        ) {
          controller.updateMouse = true;
          controller.selectedPiece = (filteredIntersects[0].object as ExtendedMesh).piece ?? null;

          if (controller.selectedPiece !== null && controller.selectedPiece > 0 && controller.selectedPiece < 11) {
            controller.startPoint = filteredIntersects[0].uv ?? null;
            controller.selectedSide = (filteredIntersects[0].object as ExtendedMesh).side ?? null;
          }
        }
        return;
      }

      controls.enabled = true;
    };

    const handlePointerUp = (): void => {
      controls.enabled = true;
      controller.updateMouse = false;
    };

    const applyTurn = (turn: string): void => {
      controller.updateMouse = false;
      controller.startPoint = null;
      controller.newPoint = null;
      controller.selectedSide = null;
      controller.selectedPiece = null;

      if (controller.currentFunc === "solver") {
        controller.manualTurn = turn;
      } else {
        controller.moveQueue.push(turn);
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (controller.currentFunc === "colorpicker") {
        return;
      }

      if (event.pointerType === "touch") {
        controls.enabled = true;
      }

      if (!controller.updateMouse) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children);
      const filteredIntersects = intersects.filter(
        (entry) => entry.object.name === "corner" || entry.object.name === "edge"
      );

      if (filteredIntersects[0]) {
        controller.newPoint = filteredIntersects[0].uv ?? null;
        const turn = calculateTurn(
          controller.startPoint,
          controller.newPoint,
          controller.selectedSide,
          controller.selectedPiece
        );

        if (turn) {
          applyTurn(turn);
        }

        return;
      }

    };

    const rotateFace = (face: string): void => {
      let tempSpeed = controller.speed;

      if (controller.counter === 0 && controller.faceToRotate === "face0") {
        if (controller.speedChanged) {
          controller.speedChanged = false;
          controller.speed = controller.speedHolder;
          tempSpeed = controller.speed;
        }

        if (controller.moveQueue[0]) {
          const move = controller.moveQueue.shift()!;
          controller.faceToRotate = `face${move}`;

          if (!controller.undoRedo) {
            controller.moveLog = controller.moveLog.slice(0, controller.moveLogIndex);
            controller.moveLogIndex += 1;
            controller.moveLog.push(move);
          } else {
            controller.undoRedo = false;
          }

          if (controller.faceToRotate.includes("'")) {
            controller.faceToRotate = controller.faceToRotate.replace("'", "");
            controller.speed = Math.abs(controller.speed);
          } else {
            controller.speed = -Math.abs(controller.speed);
          }
        } else if (controller.currentFunc === "scramble") {
          controller.currentFunc = "none";
        } else if (controller.currentFunc === "solver") {
          if (controller.modeSetter) {
            controller.modeSetter("");
          }

          controller.modeSetter = undefined;
          controller.moveType = undefined;
          controller.moveSetter = undefined;
          controller.moveCurrent = undefined;
        }

        return;
      }

      if (Math.abs(controller.counter) >= 72) {
        if (controller.currentFunc === "solver" && !controller.moveType && controller.moveCurrent !== undefined) {
          const moveKey = controller.moveCurrent.toString();
          if (moveKey.includes("'")) {
            leftHints[moveKey]?.forEach((arrow) => {
              arrow.visible = true;
            });
          } else {
            rightHints[moveKey]?.forEach((arrow) => {
              arrow.visible = true;
            });
          }
        }

        if (controller.moveCurrent !== undefined) {
          if (controller.moveType === "play") {
            controller.moveCurrent += 1;
            controller.moveSetter?.(controller.moveCurrent);
          } else if (controller.moveType === "back") {
            controller.moveCurrent -= 1;
            controller.moveSetter?.(controller.moveCurrent);
          }
        }

        decaObject[face].sides.forEach((piece, index) => {
          piece.visible = false;

          if (index % 2) {
            piece.translateZ(-1.631);
            piece.translateY(0.895);
          } else {
            piece.translateZ(-1.625);
            piece.translateY(1);
          }

          piece.rotateX(dToR(63.2));
          piece.rotateZ(
            controller.counter < 0 ? dToR(Math.abs(controller.counter)) : dToR(-Math.abs(controller.counter))
          );
          piece.rotateX(dToR(-63.2));

          if (index % 2) {
            piece.translateZ(1.631);
            piece.translateY(-0.895);
          } else {
            piece.translateZ(1.625);
            piece.translateY(-1);
          }
        });

        decaObject[face].front.forEach((piece) => {
          piece.rotateZ(
            controller.counter < 0 ? dToR(Math.abs(controller.counter)) : dToR(-Math.abs(controller.counter))
          );
        });

        facesToHide[face].forEach((piece) => {
          decaObject[`face${piece.face}`].front[piece.pos].visible = true;
        });

        swapColors(face, decaObject, controller.speed);

        controller.counter = 0;
        controller.faceToRotate = "face0";
        return;
      }

      if (Math.abs(controller.speed) + Math.abs(controller.counter) > 72) {
        tempSpeed = (72 - Math.abs(controller.counter)) * (controller.counter / Math.abs(controller.counter));
      }

      facesToHide[face].forEach((piece) => {
        decaObject[`face${piece.face}`].front[piece.pos].visible = false;
      });

      decaObject[face].front.forEach((piece) => {
        piece.rotateZ(dToR(tempSpeed));
      });

      decaObject[face].sides.forEach((piece, index) => {
        piece.visible = true;

        if (index % 2 && index < 30) {
          const { side, pos } = colorMatchUps[face][`${index}`];
          piece.material.color.set(decaObject[`face${side}`].front[pos].material.color);
        }

        if (index === 111) {
          piece.material.color.set("grey");
        }

        if (index % 2) {
          piece.translateZ(-1.631);
          piece.translateY(0.895);
        } else {
          piece.translateZ(-1.625);
          piece.translateY(1);
        }

        piece.rotateX(dToR(63.2));
        piece.rotateZ(dToR(tempSpeed));
        piece.rotateX(dToR(-63.2));

        if (index % 2) {
          piece.translateZ(1.631);
          piece.translateY(-0.895);
        } else {
          piece.translateZ(1.625);
          piece.translateY(-1);
        }
      });

      controller.counter += controller.speed;
    };

    const animate = (): void => {
      rotateFace(controller.faceToRotate);
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    canvasHostRef.current?.appendChild(renderer.domElement);
    handleResize();
    window.addEventListener("resize", handleResize, false);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, false);
    window.addEventListener("pointermove", handlePointerMove, false);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize, false);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerUp, false);
      window.removeEventListener("pointermove", handlePointerMove, false);
      (controls as any).dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      raycasterRef.current = null;
      mouseRef.current = null;
      decaObjectRef.current = {};
      rightHintsRef.current = {};
      leftHintsRef.current = {};
    };
  }, [faceColors]);

  return (
    <div className="megaminx-wrapper">
      <div ref={canvasHostRef} className="megaminx-canvas-host" />
    </div>
  );
};

export default MegaMinx;
