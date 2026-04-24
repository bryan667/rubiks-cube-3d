import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import type { Point2D } from './types'

export const CameraControls = (
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  scene: Scene,
) => {
  const controls = new OrbitControls(camera, renderer.domElement)

  controls.enabled = true
  controls.enableDamping = true
  controls.dampingFactor = 0.15
  controls.enableZoom = true
  controls.autoRotate = false
  controls.minDistance = 7
  controls.maxDistance = 27
  controls.enablePan = false

  controls.addEventListener('change', () => {
    renderer.render(scene, camera)
  })

  return controls
}

export function dToR(degrees: number) {
  return degrees * (Math.PI / 180)
}

export function rToD(radians: number) {
  return radians * (180 / Math.PI)
}

export function rotate_point(
  cx: number,
  cy: number,
  angle: number,
  point: Point2D,
): [number, number] {
  const s = Math.sin(dToR(angle))
  const c = Math.cos(dToR(angle))
  const shiftedX = point.x - cx
  const shiftedY = point.y - cy
  const xNew = shiftedX * c - shiftedY * s
  const yNew = shiftedX * s + shiftedY * c

  return [xNew + cx, yNew + cy]
}
