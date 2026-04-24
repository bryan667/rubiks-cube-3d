import { dToR, rotate_point } from './utils'
import type { QuadPoints } from './types'

type FaceName = 'face1' | 'sides'
type CornerName =
  | 'corner1'
  | 'corner2'
  | 'corner3'
  | 'corner4'
  | 'corner5'
  | 'side1a'
  | 'side1b'

const csc = (value: number) => 1 / Math.sin(value)

const rotateQuad = (angle: number, points: QuadPoints): QuadPoints => ({
  p1: rotate_point(0, 0, angle, { x: points.p1[0], y: points.p1[1] }),
  p2: rotate_point(0, 0, angle, { x: points.p2[0], y: points.p2[1] }),
  p3: rotate_point(0, 0, angle, { x: points.p3[0], y: points.p3[1] }),
  p4: rotate_point(0, 0, angle, { x: points.p4[0], y: points.p4[1] }),
})

const CornerDimensions = (
  size: number,
  face: FaceName,
  corner: CornerName,
  offset?: number,
): QuadPoints => {
  let adjustedSize = size
  let ratio = 2.25

  if (offset) {
    adjustedSize *= 1.075
    ratio *= 0.95
  }

  const halfPoint = (adjustedSize * ratio - adjustedSize) / 2
  const c = csc(dToR(36)) * halfPoint
  const x1 = c * Math.sin(dToR(54))
  const y1 = adjustedSize + halfPoint

  const p1: [number, number] = [0, adjustedSize * ratio]
  const p2: [number, number] = [x1, y1]
  const p3 = rotate_point(x1, y1, -144, { x: 0, y: adjustedSize })
  const p4 = rotate_point(0, adjustedSize * ratio, -144, { x: -x1, y: y1 })

  const p1b = rotate_point(0, 0, -72, { x: -x1, y: y1 })
  const p2b = rotate_point(0, 0, -72, { x: 0, y: adjustedSize * ratio })
  const hold1 = rotate_point(0, 0, -72, { x: x1, y: y1 })
  const hold2 = rotate_point(0, 0, -72, { x: 0, y: adjustedSize })
  const p3b = rotate_point(p2b[0], p2b[1], 144, { x: hold1[0], y: hold1[1] })
  const p4b = rotate_point(p1b[0], p1b[1], 144, { x: hold2[0], y: hold2[1] })

  const face1Corners: Record<Exclude<CornerName, 'side1a' | 'side1b'>, QuadPoints> = {
    corner1: {
      p1,
      p2,
      p3: [0, adjustedSize],
      p4: [-x1, y1],
    },
    corner2: rotateQuad(-72, {
      p1,
      p2,
      p3: [0, adjustedSize],
      p4: [-x1, y1],
    }),
    corner3: rotateQuad(-144, {
      p1,
      p2,
      p3: [0, adjustedSize],
      p4: [-x1, y1],
    }),
    corner4: rotateQuad(-216, {
      p1,
      p2,
      p3: [0, adjustedSize],
      p4: [-x1, y1],
    }),
    corner5: rotateQuad(-288, {
      p1,
      p2,
      p3: [0, adjustedSize],
      p4: [-x1, y1],
    }),
  }

  const sideCorners: Record<'side1a' | 'side1b', QuadPoints> = {
    side1a: rotateQuad(36, {
      p1,
      p2,
      p3,
      p4,
    }),
    side1b: rotateQuad(36, {
      p1: p1b,
      p2: p2b,
      p3: p3b,
      p4: p4b,
    }),
  }

  return face === 'face1' ? face1Corners[corner as keyof typeof face1Corners] : sideCorners[corner as keyof typeof sideCorners]
}

export default CornerDimensions
