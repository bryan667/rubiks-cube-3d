import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Cubelet from './Cubelet'

const EPSILON = 0.1
const TURN_SPEED = Math.PI * 2.8
const GAP = 1.04

const FACE_COLORS = {
  U: '#f8fafc',
  D: '#facc15',
  R: '#ef4444',
  L: '#f97316',
  F: '#22c55e',
  B: '#2563eb',
  INNER: '#111827',
} as const

const LOCAL_FACE_NORMALS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
] as const

type FaceKey = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

export type Move =
  | 'U'
  | "U'"
  | 'D'
  | "D'"
  | 'E'
  | "E'"
  | 'L'
  | "L'"
  | 'R'
  | "R'"
  | 'M'
  | "M'"
  | 'F'
  | "F'"
  | 'B'
  | "B'"
  | 'S'
  | "S'"

export type CubeHandle = {
  enqueueMove: (move: Move) => void
  scramble: (count?: number) => void
  getRootObject: () => THREE.Group | null
  getLayerCubeletIds: (move: Move) => string[]
}

type CubeletData = {
  id: string
  position: [number, number, number]
  colors: string[]
}

type RotationState = {
  move: Move
  axis: 'x' | 'y' | 'z'
  angle: number
  progress: number
  cubelets: THREE.Object3D[]
}

type CubeProps = {
  highlightedCubeletIds?: string[]
  onMoveComplete: (move: Move) => void
  onRotateStateChange: (isRotating: boolean) => void
  onSolvedChange: (isSolved: boolean) => void
}

const MOVE_CONFIG: Record<Move, { axis: 'x' | 'y' | 'z'; coord: number; angle: number }> = {
  U: { axis: 'y', coord: 1, angle: -Math.PI / 2 },
  "U'": { axis: 'y', coord: 1, angle: Math.PI / 2 },
  D: { axis: 'y', coord: -1, angle: Math.PI / 2 },
  "D'": { axis: 'y', coord: -1, angle: -Math.PI / 2 },
  E: { axis: 'y', coord: 0, angle: Math.PI / 2 },
  "E'": { axis: 'y', coord: 0, angle: -Math.PI / 2 },
  R: { axis: 'x', coord: 1, angle: -Math.PI / 2 },
  "R'": { axis: 'x', coord: 1, angle: Math.PI / 2 },
  L: { axis: 'x', coord: -1, angle: Math.PI / 2 },
  "L'": { axis: 'x', coord: -1, angle: -Math.PI / 2 },
  M: { axis: 'x', coord: 0, angle: Math.PI / 2 },
  "M'": { axis: 'x', coord: 0, angle: -Math.PI / 2 },
  F: { axis: 'z', coord: 1, angle: -Math.PI / 2 },
  "F'": { axis: 'z', coord: 1, angle: Math.PI / 2 },
  B: { axis: 'z', coord: -1, angle: Math.PI / 2 },
  "B'": { axis: 'z', coord: -1, angle: -Math.PI / 2 },
  S: { axis: 'z', coord: 0, angle: -Math.PI / 2 },
  "S'": { axis: 'z', coord: 0, angle: Math.PI / 2 },
}

const MOVE_OPTIONS = Object.keys(MOVE_CONFIG) as Move[]

const snapToCube = (object: THREE.Object3D) => {
  object.position.set(
    Math.round(object.position.x / GAP) * GAP,
    Math.round(object.position.y / GAP) * GAP,
    Math.round(object.position.z / GAP) * GAP,
  )

  const euler = new THREE.Euler().setFromQuaternion(object.quaternion, 'XYZ')
  euler.set(
    snapAngle(euler.x),
    snapAngle(euler.y),
    snapAngle(euler.z),
    'XYZ',
  )
  object.quaternion.setFromEuler(euler)
}

const snapAngle = (value: number) => {
  const quarterTurn = Math.PI / 2
  return Math.round(value / quarterTurn) * quarterTurn
}

const createCubelets = (): CubeletData[] => {
  const cubelets: CubeletData[] = []

  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) {
          continue
        }

        cubelets.push({
          id: `${x}:${y}:${z}`,
          position: [x * GAP, y * GAP, z * GAP],
          colors: [
            x === 1 ? FACE_COLORS.R : FACE_COLORS.INNER,
            x === -1 ? FACE_COLORS.L : FACE_COLORS.INNER,
            y === 1 ? FACE_COLORS.U : FACE_COLORS.INNER,
            y === -1 ? FACE_COLORS.D : FACE_COLORS.INNER,
            z === 1 ? FACE_COLORS.F : FACE_COLORS.INNER,
            z === -1 ? FACE_COLORS.B : FACE_COLORS.INNER,
          ],
        })
      }
    }
  }

  return cubelets
}

const isSolved = (objects: THREE.Object3D[]) => {
  const faces: Record<FaceKey, Set<string>> = {
    U: new Set<string>(),
    D: new Set<string>(),
    L: new Set<string>(),
    R: new Set<string>(),
    F: new Set<string>(),
    B: new Set<string>(),
  }

  for (const object of objects) {
    if (!object) {
      continue
    }

    const mesh = object.children[0] as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.Material | THREE.Material[]
    >
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const worldPosition = new THREE.Vector3()
    object.getWorldPosition(worldPosition)
    const worldQuaternion = new THREE.Quaternion()
    object.getWorldQuaternion(worldQuaternion)

    LOCAL_FACE_NORMALS.forEach((normal, index) => {
      const rotatedNormal = normal.clone().applyQuaternion(worldQuaternion)
      const material = materials[index] as THREE.MeshStandardMaterial
      const color = `#${material.color.getHexString()}`

      if (worldPosition.y > GAP * 0.9 && rotatedNormal.y > 0.9) {
        faces.U.add(color)
      } else if (worldPosition.y < -GAP * 0.9 && rotatedNormal.y < -0.9) {
        faces.D.add(color)
      } else if (worldPosition.x > GAP * 0.9 && rotatedNormal.x > 0.9) {
        faces.R.add(color)
      } else if (worldPosition.x < -GAP * 0.9 && rotatedNormal.x < -0.9) {
        faces.L.add(color)
      } else if (worldPosition.z > GAP * 0.9 && rotatedNormal.z > 0.9) {
        faces.F.add(color)
      } else if (worldPosition.z < -GAP * 0.9 && rotatedNormal.z < -0.9) {
        faces.B.add(color)
      }
    })
  }

  return Object.values(faces).every((colors) => colors.size === 1)
}

const Cube = forwardRef<CubeHandle, CubeProps>(function Cube(
  { highlightedCubeletIds = [], onMoveComplete, onRotateStateChange, onSolvedChange },
  ref,
) {
  const cubelets = useMemo(() => createCubelets(), [])
  const rootRef = useRef<THREE.Group>(null)
  const pivotRef = useRef<THREE.Group>(null)
  const cubeletRefs = useRef<Array<THREE.Group | null>>([])
  const moveQueueRef = useRef<Move[]>([])
  const activeRotationRef = useRef<RotationState | null>(null)
  const [rotatingCubeletIds, setRotatingCubeletIds] = useState<string[]>([])

  useImperativeHandle(ref, () => ({
    enqueueMove(move) {
      moveQueueRef.current.push(move)
    },
    scramble(count = 24) {
      const scrambleMoves: Move[] = []

      for (let index = 0; index < count; index += 1) {
        const previous = scrambleMoves.at(-1)
        const candidates = MOVE_OPTIONS.filter((move) => move !== previous)
        const nextMove =
          candidates[Math.floor(Math.random() * candidates.length)] ?? 'U'
        scrambleMoves.push(nextMove)
      }

      moveQueueRef.current.push(...scrambleMoves)
    },
    getRootObject() {
      return rootRef.current
    },
    getLayerCubeletIds(move) {
      const config = MOVE_CONFIG[move]
      return cubelets
        .filter((cubelet) => {
          const axisIndex = config.axis === 'x' ? 0 : config.axis === 'y' ? 1 : 2
          return Math.abs(cubelet.position[axisIndex] / GAP - config.coord) < EPSILON
        })
        .map((cubelet) => cubelet.id)
    },
  }))

  useEffect(() => {
    onSolvedChange(true)
  }, [onSolvedChange])

  useFrame((_, delta) => {
    const root = rootRef.current
    const pivot = pivotRef.current
    if (!root || !pivot) {
      return
    }

    let activeRotation = activeRotationRef.current

    if (!activeRotation && moveQueueRef.current.length > 0) {
      const move = moveQueueRef.current.shift()
      if (!move) {
        return
      }

      const config = MOVE_CONFIG[move]
      const rotatingCubelets = cubeletRefs.current.filter((cubelet) => {
        if (!cubelet) {
          return false
        }

        const position = cubelet.position
        return Math.abs(position[config.axis] / GAP - config.coord) < EPSILON
      }) as THREE.Object3D[]

      pivot.rotation.set(0, 0, 0)
      pivot.updateMatrixWorld(true)
      rotatingCubelets.forEach((cubelet) => pivot.attach(cubelet))

      activeRotation = {
        move,
        axis: config.axis,
        angle: config.angle,
        progress: 0,
        cubelets: rotatingCubelets,
      }

      activeRotationRef.current = activeRotation
      setRotatingCubeletIds(
        rotatingCubelets.map((cubelet) => String(cubelet.userData.cubeletId)),
      )
      onRotateStateChange(true)
      onSolvedChange(false)
    }

    if (!activeRotation) {
      return
    }

    const step = Math.min(TURN_SPEED * delta, Math.abs(activeRotation.angle) - activeRotation.progress)
    activeRotation.progress += step
    pivot.rotation[activeRotation.axis] += Math.sign(activeRotation.angle) * step
    pivot.updateMatrixWorld(true)

    const completed = activeRotation.progress >= Math.abs(activeRotation.angle) - 0.0001
    if (!completed) {
      return
    }

    activeRotation.cubelets.forEach((cubelet) => {
      root.attach(cubelet)
      snapToCube(cubelet)
    })

    pivot.rotation.set(0, 0, 0)
    pivot.updateMatrixWorld(true)

    activeRotationRef.current = null
    setRotatingCubeletIds([])
    onMoveComplete(activeRotation.move)
    onRotateStateChange(false)
    onSolvedChange(isSolved(cubeletRefs.current.filter(Boolean) as THREE.Object3D[]))
  })

  return (
    <group ref={rootRef}>
      <group ref={pivotRef} />
      {cubelets.map((cubelet, index) => (
        <Cubelet
          key={cubelet.id}
          ref={(node) => {
            cubeletRefs.current[index] = node
            if (node) {
              node.userData.cubeletId = cubelet.id
            }
          }}
          position={cubelet.position}
          colors={cubelet.colors}
          highlighted={
            highlightedCubeletIds.includes(cubelet.id) ||
            rotatingCubeletIds.includes(cubelet.id)
          }
        />
      ))}
    </group>
  )
})

export default Cube
