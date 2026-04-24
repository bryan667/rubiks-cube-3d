import { dToR } from './utils'
import type { FaceTransform } from './types'

const FACE_TILT = -63.75
const Z_OFFSET = 2.92
const RING_Y = 2 * 2.25 * Math.cos(dToR(36))

const facePositions: FaceTransform[] = [
  {
    translate: { z: Z_OFFSET },
    rotate: 0,
  },
  {
    translate: { y: RING_Y, z: Z_OFFSET },
    rotate: { z: dToR(108), x: dToR(FACE_TILT) },
  },
  {
    translate: { y: RING_Y, z: Z_OFFSET },
    rotate: { z: dToR(180), x: dToR(FACE_TILT) },
  },
  {
    translate: { y: RING_Y, z: Z_OFFSET },
    rotate: { z: dToR(252), x: dToR(FACE_TILT) },
  },
  {
    translate: { y: RING_Y, z: Z_OFFSET },
    rotate: { z: dToR(324), x: dToR(FACE_TILT) },
  },
  {
    translate: { y: RING_Y, z: Z_OFFSET },
    rotate: { z: dToR(396), x: dToR(FACE_TILT) },
  },
  {
    translate: { z: -Z_OFFSET },
    rotate: { z: dToR(180), y: dToR(180) },
  },
  {
    translate: { y: RING_Y, z: -Z_OFFSET },
    rotate: { z: dToR(72), x: dToR(FACE_TILT), y: dToR(180) },
  },
  {
    translate: { y: RING_Y, z: -Z_OFFSET },
    rotate: { z: dToR(144), x: dToR(FACE_TILT), y: dToR(180) },
  },
  {
    translate: { y: RING_Y, z: -Z_OFFSET },
    rotate: { z: dToR(216), x: dToR(FACE_TILT), y: dToR(180) },
  },
  {
    translate: { y: RING_Y, z: -Z_OFFSET },
    rotate: { z: dToR(288), x: dToR(FACE_TILT), y: dToR(180) },
  },
  {
    translate: { y: RING_Y, z: -Z_OFFSET },
    rotate: { z: dToR(360), x: dToR(FACE_TILT), y: dToR(180) },
  },
]

export default facePositions
