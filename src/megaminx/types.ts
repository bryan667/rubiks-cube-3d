import type { Mesh } from 'three'

export type FaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type FaceKey = `face${FaceId}`
export type ColorName =
  | 'blue'
  | 'pink'
  | 'yellow'
  | 'red'
  | 'green'
  | 'lightpurple'
  | 'lightblue'
  | 'lightbrown'
  | 'lightgreen'
  | 'orange'
  | 'purple'
  | 'white'

export type TurnMove =
  | `${FaceId}`
  | `${FaceId}'`

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x?: number
  y?: number
  z?: number
}

export interface FaceRotation {
  x?: number
  y?: number
  z?: number
}

export interface FaceTransform {
  translate: Point3D
  rotate: FaceRotation | 0
}

export interface QuadPoints {
  p1: [number, number]
  p2: [number, number]
  p3: [number, number]
  p4: [number, number]
}

export interface FacePieceRef {
  face: FaceId
  pos: number
}

export interface MatchRef {
  side: FaceId
  pos: number
}

export interface DecaFace {
  front: Mesh[]
  sides: Mesh[]
}

export type DecaObject = Record<FaceKey, DecaFace>
