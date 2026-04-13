import { useEffect, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { CubeHandle, Move } from './Cube'

type FaceKey = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'
type AxisKey = 'x' | 'y' | 'z'

type TouchHit = {
  cubelet: THREE.Group
  face: FaceKey
  localPoint: THREE.Vector3
  layerCoords: Record<AxisKey, number>
}

type CandidateMove = {
  move: Move
  axis: AxisKey
  coord: number
}

type TouchControllerProps = {
  cubeRef: React.RefObject<CubeHandle | null>
  isRotating: boolean
  onOrbitEnabledChange: (enabled: boolean) => void
  onHighlightChange: (ids: string[]) => void
}

const DRAG_THRESHOLD = 5
const PROJECTION_ANGLE = Math.PI / 18
const MOVE_CONFIG: Record<Move, { axis: AxisKey; coord: number; angle: number }> = {
  U: { axis: 'y', coord: 1, angle: -Math.PI / 2 },
  "U'": { axis: 'y', coord: 1, angle: Math.PI / 2 },
  D: { axis: 'y', coord: -1, angle: Math.PI / 2 },
  "D'": { axis: 'y', coord: -1, angle: -Math.PI / 2 },
  R: { axis: 'x', coord: 1, angle: -Math.PI / 2 },
  "R'": { axis: 'x', coord: 1, angle: Math.PI / 2 },
  L: { axis: 'x', coord: -1, angle: Math.PI / 2 },
  "L'": { axis: 'x', coord: -1, angle: -Math.PI / 2 },
  F: { axis: 'z', coord: 1, angle: -Math.PI / 2 },
  "F'": { axis: 'z', coord: 1, angle: Math.PI / 2 },
  B: { axis: 'z', coord: -1, angle: Math.PI / 2 },
  "B'": { axis: 'z', coord: -1, angle: -Math.PI / 2 },
}

const snapFace = (normal: THREE.Vector3): FaceKey => {
  const absolute = {
    x: Math.abs(normal.x),
    y: Math.abs(normal.y),
    z: Math.abs(normal.z),
  }

  if (absolute.x >= absolute.y && absolute.x >= absolute.z) {
    return normal.x >= 0 ? 'R' : 'L'
  }

  if (absolute.y >= absolute.x && absolute.y >= absolute.z) {
    return normal.y >= 0 ? 'U' : 'D'
  }

  return normal.z >= 0 ? 'F' : 'B'
}

const faceAxis = (face: FaceKey): AxisKey => {
  if (face === 'L' || face === 'R') {
    return 'x'
  }
  if (face === 'U' || face === 'D') {
    return 'y'
  }
  return 'z'
}

const getScreenPoint = (
  point: THREE.Vector3,
  cubeRoot: THREE.Object3D,
  camera: THREE.Camera,
  bounds: DOMRect,
) => {
  const worldPoint = cubeRoot.localToWorld(point.clone())
  const projected = worldPoint.project(camera)

  return new THREE.Vector2(
    ((projected.x + 1) / 2) * bounds.width,
    ((-projected.y + 1) / 2) * bounds.height,
  )
}

const rotateLocalPoint = (point: THREE.Vector3, axis: AxisKey, angle: number) => {
  const nextPoint = point.clone()
  if (axis === 'x') {
    nextPoint.applyAxisAngle(new THREE.Vector3(1, 0, 0), angle)
  } else if (axis === 'y') {
    nextPoint.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
  } else {
    nextPoint.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle)
  }
  return nextPoint
}

const getCandidateMoves = (touchHit: TouchHit): CandidateMove[] => {
  const touchedAxis = faceAxis(touchHit.face)
  const candidateMoves: CandidateMove[] = []

  ;(['x', 'y', 'z'] as AxisKey[]).forEach((axis) => {
    if (axis === touchedAxis) {
      return
    }

    const coord = touchHit.layerCoords[axis]
    if (Math.abs(coord) !== 1) {
      return
    }

    Object.entries(MOVE_CONFIG).forEach(([move, config]) => {
      if (config.axis === axis && config.coord === coord) {
        candidateMoves.push({
          move: move as Move,
          axis,
          coord,
        })
      }
    })
  })

  return candidateMoves
}

const chooseMove = (
  touchHit: TouchHit,
  drag: THREE.Vector2,
  cubeRoot: THREE.Object3D,
  camera: THREE.Camera,
  bounds: DOMRect,
) => {
  const start = getScreenPoint(touchHit.localPoint, cubeRoot, camera, bounds)
  const candidates = getCandidateMoves(touchHit)

  let bestMove: Move | null = null
  let bestScore = Number.POSITIVE_INFINITY

  candidates.forEach(({ move }) => {
    const config = MOVE_CONFIG[move]
    const projectedPoint = getScreenPoint(
      rotateLocalPoint(touchHit.localPoint, config.axis, Math.sign(config.angle) * PROJECTION_ANGLE),
      cubeRoot,
      camera,
      bounds,
    )

    const predicted = projectedPoint.sub(start)
    if (predicted.lengthSq() < 0.01) {
      return
    }

    const difference = drag.clone().sub(predicted)
    const score = difference.length() + Math.abs(drag.length() - predicted.length()) * 0.25
    if (score < bestScore) {
      bestScore = score
      bestMove = move
    }
  })

  return bestMove
}

function TouchController({
  cubeRef,
  isRotating,
  onOrbitEnabledChange,
  onHighlightChange,
}: TouchControllerProps) {
  const { camera, gl, raycaster } = useThree()
  const touchHitRef = useRef<TouchHit | null>(null)
  const selectedMoveRef = useRef<Move | null>(null)

  useEffect(() => {
    if (isRotating) {
      onHighlightChange([])
      onOrbitEnabledChange(false)
      return
    }

    onOrbitEnabledChange(true)
  }, [isRotating, onHighlightChange, onOrbitEnabledChange])

  useDrag(
    ({ first, last, movement: [mx, my], xy: [x, y] }) => {
      if (isRotating) {
        return
      }

      const cubeRoot = cubeRef.current?.getRootObject()
      if (!cubeRoot) {
        return
      }

      const bounds = gl.domElement.getBoundingClientRect()

      if (first) {
        const pointer = new THREE.Vector2(
          ((x - bounds.left) / bounds.width) * 2 - 1,
          -((y - bounds.top) / bounds.height) * 2 + 1,
        )

        raycaster.setFromCamera(pointer, camera)
        const intersections = raycaster.intersectObject(cubeRoot, true)
        const hit = intersections.find(
          (intersection) => intersection.object.parent?.userData.cubeletId,
        )

        if (!hit) {
          touchHitRef.current = null
          selectedMoveRef.current = null
          onHighlightChange([])
          onOrbitEnabledChange(true)
          return
        }

        const cubelet = hit.object.parent as THREE.Group
        const cubeRootInverse = cubeRoot.getWorldQuaternion(new THREE.Quaternion()).invert()
        const localNormal = hit.face?.normal
          ?.clone()
          .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
          .normalize()
          .applyQuaternion(cubeRootInverse)
        const localPoint = cubeRoot.worldToLocal(hit.point.clone())

        touchHitRef.current = {
          cubelet,
          face: snapFace(localNormal ?? new THREE.Vector3(0, 0, 1)),
          localPoint,
          layerCoords: {
            x: Math.round(cubelet.position.x / 1.04),
            y: Math.round(cubelet.position.y / 1.04),
            z: Math.round(cubelet.position.z / 1.04),
          },
        }
        selectedMoveRef.current = null
        onOrbitEnabledChange(false)
      }

      const touchHit = touchHitRef.current
      if (!touchHit) {
        return
      }

      const drag = new THREE.Vector2(mx, my)
      const hasCrossedThreshold =
        Math.abs(mx) >= DRAG_THRESHOLD || Math.abs(my) >= DRAG_THRESHOLD

      if (hasCrossedThreshold) {
        const move = chooseMove(touchHit, drag, cubeRoot, camera, bounds)
        if (move && move !== selectedMoveRef.current) {
          selectedMoveRef.current = move
          onHighlightChange(cubeRef.current?.getLayerCubeletIds(move) ?? [])
        }
      }

      if (!last) {
        return
      }

      const move = selectedMoveRef.current
      if (move) {
        cubeRef.current?.enqueueMove(move)
      }

      touchHitRef.current = null
      selectedMoveRef.current = null
      onHighlightChange([])
      onOrbitEnabledChange(true)
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
      pointer: { touch: true },
    },
  )

  return null
}

export default TouchController
