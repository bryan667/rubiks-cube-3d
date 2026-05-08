import { OrbitControls } from "three-stdlib";
import type * as THREE from "three";

export const CameraControls = (
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
): OrbitControls => {
    let controls = new OrbitControls( camera , renderer.domElement);
    controls.enabled = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.autoRotate = false;
    controls.minDistance = 7;
    controls.maxDistance = 16;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.keys = {
        LEFT: null as unknown as string, //left arrow
        UP: null as unknown as string, // up arrow
        RIGHT: null as unknown as string, // right arrow
        BOTTOM: null as unknown as string // down arrow
    };
    controls.addEventListener("change", () => {
        if (renderer) renderer.render(scene, camera);
    });
    controls.update();
    return controls;
}

export function dToR(degrees: number): number {
    return degrees*(Math.PI/180)
}

export function rToD(radians: number): number {
  return radians * (180/Math.PI);
}

export interface Point2D {
    x: number;
    y: number;
}

export function rotate_point(cx: number, cy: number, angle: number, p: Point2D): [number, number] {
    let s = Math.sin(dToR(angle));
    let c = Math.cos(dToR(angle));

    // translate point back to origin:
    p.x -= cx;
    p.y -= cy;

    // rotate point
    let xnew = p.x * c - p.y * s;
    let ynew = p.x * s + p.y * c;

    // translate point back:
    p.x = xnew + cx;
    p.y = ynew + cy;
    return [p.x,p.y];
}
