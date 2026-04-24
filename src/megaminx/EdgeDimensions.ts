import { dToR, rotate_point } from './utils'
import type { QuadPoints } from './types'

type FaceName = 'face1' | 'sides'
type EdgeName = 'edge1' | 'edge2' | 'edge3' | 'edge4' | 'edge5' | 'side1'

const csc = (value: number) => 1 / Math.sin(value)

const EdgeDimensions = (
  size: number,
  face: FaceName,
  edge: EdgeName,
  offset?: number,
): QuadPoints => {
  let adjustedSize = size
  let ratio = 2.25
  let xOffset1 = 0
  let xOffset2 = 0

  if (offset === 1 || offset === 2) {
    adjustedSize *= 1.05
    ratio *= 0.975
    xOffset1 = 0.05
    xOffset2 = -0.05
  }

  const halfPoint = (adjustedSize * ratio - 1) / 2
  const c = csc(dToR(36)) * halfPoint
  const x1 = c * Math.sin(dToR(54))
  const y1 = 1 + halfPoint
  const x2 = -x1 * Math.cos(dToR(288)) - y1 * Math.sin(dToR(288))
  const y2 = y1 * Math.cos(dToR(288)) + -x1 * Math.sin(dToR(288))

  const p1X = xOffset1
  const p1Y = adjustedSize
  const p2X = xOffset2 * Math.cos(dToR(288)) - adjustedSize * Math.sin(dToR(288))
  const p2Y = adjustedSize * Math.cos(dToR(288)) + xOffset2 * Math.sin(dToR(288))
  const new1 = rotate_point(x1, y1, -144, { x: p1X, y: p1Y })
  const new2 = rotate_point(x2, y2, 144, { x: p2X, y: p2Y })

  const face1Edges: Record<Exclude<EdgeName, 'side1'>, QuadPoints> = {
    edge1: {
      p1: [p1X, p1Y],
      p2: [x1, y1],
      p3: [x2, y2],
      p4: [p2X, p2Y],
    },
    edge2: {
      p1: [
        xOffset1 * Math.cos(dToR(288)) - adjustedSize * Math.sin(dToR(288)),
        adjustedSize * Math.cos(dToR(288)) + xOffset1 * Math.sin(dToR(288)),
      ],
      p2: [
        xOffset2 * Math.cos(dToR(216)) - adjustedSize * Math.sin(dToR(216)),
        adjustedSize * Math.cos(dToR(216)) + xOffset2 * Math.sin(dToR(216)),
      ],
      p3: [
        -x1 * Math.cos(dToR(216)) - y1 * Math.sin(dToR(216)),
        y1 * Math.cos(dToR(216)) + -x1 * Math.sin(dToR(216)),
      ],
      p4: [
        x1 * Math.cos(dToR(288)) - y1 * Math.sin(dToR(288)),
        y1 * Math.cos(dToR(288)) + x1 * Math.sin(dToR(288)),
      ],
    },
    edge3: {
      p1: [
        xOffset1 * Math.cos(dToR(216)) - adjustedSize * Math.sin(dToR(216)),
        adjustedSize * Math.cos(dToR(216)) + xOffset1 * Math.sin(dToR(216)),
      ],
      p2: [
        xOffset2 * Math.cos(dToR(144)) - adjustedSize * Math.sin(dToR(144)),
        adjustedSize * Math.cos(dToR(144)) + xOffset2 * Math.sin(dToR(144)),
      ],
      p3: [
        -x1 * Math.cos(dToR(144)) - y1 * Math.sin(dToR(144)),
        y1 * Math.cos(dToR(144)) + -x1 * Math.sin(dToR(144)),
      ],
      p4: [
        x1 * Math.cos(dToR(216)) - y1 * Math.sin(dToR(216)),
        y1 * Math.cos(dToR(216)) + x1 * Math.sin(dToR(216)),
      ],
    },
    edge4: {
      p1: [
        xOffset1 * Math.cos(dToR(144)) - adjustedSize * Math.sin(dToR(144)),
        adjustedSize * Math.cos(dToR(144)) + xOffset1 * Math.sin(dToR(144)),
      ],
      p2: [
        xOffset2 * Math.cos(dToR(72)) - adjustedSize * Math.sin(dToR(72)),
        adjustedSize * Math.cos(dToR(72)) + xOffset2 * Math.sin(dToR(72)),
      ],
      p3: [
        -x1 * Math.cos(dToR(72)) - y1 * Math.sin(dToR(72)),
        y1 * Math.cos(dToR(72)) + -x1 * Math.sin(dToR(72)),
      ],
      p4: [
        x1 * Math.cos(dToR(144)) - y1 * Math.sin(dToR(144)),
        y1 * Math.cos(dToR(144)) + x1 * Math.sin(dToR(144)),
      ],
    },
    edge5: {
      p1: [
        xOffset1 * Math.cos(dToR(72)) - adjustedSize * Math.sin(dToR(72)),
        adjustedSize * Math.cos(dToR(72)) + xOffset1 * Math.sin(dToR(72)),
      ],
      p2: [xOffset2, adjustedSize],
      p3: [-x1, y1],
      p4: [
        x1 * Math.cos(dToR(72)) - y1 * Math.sin(dToR(72)),
        y1 * Math.cos(dToR(72)) + x1 * Math.sin(dToR(72)),
      ],
    },
  }

  const sideEdge: QuadPoints = {
    p1: rotate_point(0, 0, 36, { x: new1[0], y: new1[1] }),
    p2: rotate_point(0, 0, 36, { x: x1, y: y1 }),
    p3: rotate_point(0, 0, 36, { x: x2, y: y2 }),
    p4: rotate_point(0, 0, 36, { x: new2[0], y: new2[1] }),
  }

  return face === 'face1' ? face1Edges[edge as keyof typeof face1Edges] : sideEdge
}

export default EdgeDimensions
