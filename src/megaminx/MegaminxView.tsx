/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-expressions */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Corner from './CornerDimensions'
import Edge from './EdgeDimensions'
import swapColors from './swapColors'
import facesToHide from './facesToHide'
import colorMatchUps from './colorMatchUps'
import facePos from './facePositions'
import calculateTurn from './calculateTurn'
import { CameraControls, dToR } from './utils'

const DEFAULT_FACE_COLORS = [
  '#0000ff',
  '#ff80ce',
  '#ffff00',
  '#ff0000',
  '#008000',
  '#c585f7',
  '#4fc3f7',
  '#c39b77',
  '#64dd17',
  '#ffa500',
  '#800080',
  '#ffffff',
]

const COLOR_NAMES = [
  'blue',
  'pink',
  'yellow',
  'red',
  'green',
  'lightpurple',
  'lightblue',
  'lightbrown',
  'lightgreen',
  'orange',
  'purple',
  'white',
]

const createScramble = () => {
  const moves: string[] = []

  while (moves.length < 25) {
    const lastIndex = moves.length - 1
    const secondToLastIndex = moves.length - 2
    const randomFace = Math.floor(Math.random() * 12) + 1
    const randomDir = Math.floor(Math.random() * 2)
    const move = `${randomFace}${randomDir ? '' : "'"}`
    const inverse = `${randomFace}${randomDir ? "'" : ''}`

    if (inverse === moves[lastIndex]) {
      continue
    }

    if (
      moves.length > 2 &&
      move === moves[lastIndex] &&
      move === moves[secondToLastIndex]
    ) {
      continue
    }

    moves.push(move)
  }

  return moves
}

const getCenterStickerOffset = (faceIndex: number) => {
  return faceIndex < 6 ? 0.01 : -0.01
}

const getPieceStickerOffset = (faceIndex: number) => {
  return faceIndex < 6 ? 0.005 : -0.005
}

function MegaminxView() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [resetNonce, setResetNonce] = useState(0)
  const [moveCount, setMoveCount] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) {
      return
    }

    const faceColors = [...DEFAULT_FACE_COLORS]
    const moveQueue: string[] = []
    const moveLog: string[] = []
    let moveLogIndex = 0
    let faceToRotate = 'face0'
    let speed = 12
    let counter = 0
    let updatePointer = false
    let startPoint: { x: number; y: number } | null = null
    let newPoint: { x: number; y: number } | null = null
    let selectedSide: string | null = null
    let selectedPiece: number | null = null

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      1000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const controls = CameraControls(camera, renderer, scene)
    const decaObject: Record<string, { front: THREE.Object3D[]; sides: THREE.Object3D[] }> = {}

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(new THREE.Color('#000000'), 0)
    renderer.domElement.className = 'megaminx-canvas'
    renderer.setSize(mount.clientWidth, mount.clientHeight)

    camera.position.set(0, 0, 15)
    mount.appendChild(renderer.domElement)

    facePos.forEach((_, index) => {
      decaObject[`face${index + 1}`] = { front: [], sides: [] }
    })

    const pentagonMesh = (translate: any, rotate: any, color: string, index: number) => {
      const pentagon = new THREE.Shape()
      const pentagonInner = new THREE.Shape()
      const c1 = Math.cos((2 * Math.PI) / 5)
      const c2 = Math.cos(Math.PI / 5)
      const s1 = Math.sin((2 * Math.PI) / 5)
      const s2 = Math.sin((4 * Math.PI) / 5)

      pentagon.moveTo(0, 1)
      pentagon.lineTo(s1, c1)
      pentagon.lineTo(s2, -c2)
      pentagon.lineTo(-s2, -c2)
      pentagon.lineTo(-s1, c1)

      pentagonInner.moveTo(0, 0.97)
      pentagonInner.lineTo(s1 * 0.97, c1 * 0.97)
      pentagonInner.lineTo(s2 * 0.97, -c2 * 0.97)
      pentagonInner.lineTo(-s2 * 0.97, -c2 * 0.97)
      pentagonInner.lineTo(-s1 * 0.97, c1 * 0.97)

      const outerMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(pentagon),
        new THREE.MeshBasicMaterial({ color: 'black', side: THREE.DoubleSide }),
      )
      const innerMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(pentagonInner),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      )

      innerMesh.name = 'center'
      innerMesh.userData.side = COLOR_NAMES[index]

      const offsetZ = 0.205
      const offsetY = -0.81

      outerMesh.translateZ(translate?.z ?? 0)
      outerMesh.rotateZ(rotate?.z ?? 0)
      outerMesh.rotateY(rotate?.y ?? 0)
      outerMesh.translateY(translate?.y ?? 0)
      outerMesh.translateX(translate?.x ?? 0)
      outerMesh.rotateX(rotate?.x ?? 0)
      outerMesh.translateZ(-(translate?.y ?? 0) / 2 + offsetZ)
      outerMesh.translateY((translate?.y ?? 0) / 2 + offsetY)

      innerMesh.translateZ(
        (translate?.z ?? 0) + getCenterStickerOffset(index),
      )
      innerMesh.rotateZ(rotate?.z ?? 0)
      innerMesh.rotateY(rotate?.y ?? 0)
      innerMesh.translateY(translate?.y ?? 0)
      innerMesh.translateX(translate?.x ?? 0)
      innerMesh.rotateX(rotate?.x ?? 0)
      innerMesh.translateZ(-(translate?.y ?? 0) / 2 + offsetZ)
      innerMesh.translateY((translate?.y ?? 0) / 2 + offsetY)

      scene.add(outerMesh, innerMesh)
      decaObject[`face${index + 1}`].front.push(outerMesh, innerMesh)
    }

    const squareMesh = (
      position: any,
      positionInner: any,
      translate: any,
      rotate: any,
      color: string,
      faceIndex: number,
      piece: number,
    ) => {
      const square = new THREE.Shape()
      const squareInner = new THREE.Shape()

      square.moveTo(...position.p1)
      square.lineTo(...position.p2)
      square.lineTo(...position.p3)
      square.lineTo(...position.p4)

      squareInner.moveTo(...positionInner.p1)
      squareInner.lineTo(...positionInner.p2)
      squareInner.lineTo(...positionInner.p3)
      squareInner.lineTo(...positionInner.p4)

      const borderMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(square),
        new THREE.MeshBasicMaterial({ color: 'black', side: THREE.DoubleSide }),
      )
      const pieceMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(squareInner),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      )

      if (piece > 0 && piece < 6) pieceMesh.name = 'corner'
      if (piece > 5 && piece < 11) pieceMesh.name = 'edge'
      pieceMesh.userData.piece = piece
      pieceMesh.userData.side = COLOR_NAMES[faceIndex]
      pieceMesh.scale.set(0.95, 0.95, 0.95)

      const offsetZ = 0.205
      const offsetY = -0.81

      ;[borderMesh, pieceMesh].forEach((mesh, meshIndex) => {
        const directionOffset = getPieceStickerOffset(faceIndex)
        mesh.translateZ((translate?.z ?? 0) + (meshIndex === 1 ? directionOffset : 0))
        mesh.rotateZ(rotate?.z ?? 0)
        mesh.rotateY(rotate?.y ?? 0)
        mesh.translateY(translate?.y ?? 0)
        mesh.translateX(translate?.x ?? 0)
        mesh.rotateX(rotate?.x ?? 0)
        mesh.translateZ(-(translate?.y ?? 0) / 2 + offsetZ)
        mesh.translateY((translate?.y ?? 0) / 2 + offsetY)

        if (piece > 10) {
          mesh.rotateZ(dToR(-36 + -(72 * (piece - 11))))
          mesh.rotateX(dToR(-63.2))
          mesh.translateZ(1.625 + (meshIndex === 1 ? 0.006 : 0))
          mesh.translateY(meshIndex === 1 ? -0.895 : -1)
          mesh.visible = false
        }
      })

      scene.add(borderMesh, pieceMesh)
      piece < 11
        ? decaObject[`face${faceIndex + 1}`].front.push(borderMesh, pieceMesh)
        : decaObject[`face${faceIndex + 1}`].sides.push(borderMesh, pieceMesh)
    }

    const decaFace = (set: any, index: number) => {
      pentagonMesh(set.translate, set.rotate, faceColors[index], index)

      squareMesh(Corner(1, 'face1', 'corner1'), Corner(1, 'face1', 'corner1', 1), set.translate, set.rotate, faceColors[index], index, 1)
      squareMesh(Corner(1, 'face1', 'corner2'), Corner(1, 'face1', 'corner2', 1), set.translate, set.rotate, faceColors[index], index, 2)
      squareMesh(Corner(1, 'face1', 'corner3'), Corner(1, 'face1', 'corner3', 1), set.translate, set.rotate, faceColors[index], index, 3)
      squareMesh(Corner(1, 'face1', 'corner4'), Corner(1, 'face1', 'corner4', 1), set.translate, set.rotate, faceColors[index], index, 4)
      squareMesh(Corner(1, 'face1', 'corner5'), Corner(1, 'face1', 'corner5', 1), set.translate, set.rotate, faceColors[index], index, 5)

      squareMesh(Edge(1, 'face1', 'edge1'), Edge(1, 'face1', 'edge1', 1), set.translate, set.rotate, faceColors[index], index, 6)
      squareMesh(Edge(1, 'face1', 'edge2'), Edge(1, 'face1', 'edge2', 1), set.translate, set.rotate, faceColors[index], index, 7)
      squareMesh(Edge(1, 'face1', 'edge3'), Edge(1, 'face1', 'edge3', 1), set.translate, set.rotate, faceColors[index], index, 8)
      squareMesh(Edge(1, 'face1', 'edge4'), Edge(1, 'face1', 'edge4', 1), set.translate, set.rotate, faceColors[index], index, 9)
      squareMesh(Edge(1, 'face1', 'edge5'), Edge(1, 'face1', 'edge5', 1), set.translate, set.rotate, faceColors[index], index, 10)

      for (let piece = 11; piece <= 15; piece += 1) {
        squareMesh(Edge(1, 'sides', 'side1'), Edge(1, 'sides', 'side1', 2), set.translate, set.rotate, faceColors[index], index, piece)
      }
      for (let piece = 16; piece <= 20; piece += 1) {
        squareMesh(Corner(1, 'sides', 'side1a'), Corner(1, 'sides', 'side1a', 1), set.translate, set.rotate, faceColors[index], index, piece)
      }
      for (let piece = 21; piece <= 25; piece += 1) {
        squareMesh(Corner(1, 'sides', 'side1b'), Corner(1, 'sides', 'side1b', 1), set.translate, set.rotate, faceColors[index], index, piece)
      }
    }

    facePos.forEach((set: any, index: number) => decaFace(set, index))

    const getPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      const pointer = getPointer(event)
      mouse.x = pointer.x
      mouse.y = pointer.y
      startPoint = null
      selectedSide = null
      selectedPiece = null

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)
      const filtered = intersects.filter(
        (entry) => entry.object.name === 'corner' || entry.object.name === 'edge',
      )

      if (intersects[0]) {
        controls.enabled = false
      }

      if (filtered[0] && !moveQueue.length) {
        updatePointer = true
        selectedPiece = filtered[0].object.userData.piece

        if (selectedPiece > 0 && selectedPiece < 11) {
          startPoint = filtered[0].uv ?? null
          selectedSide = filtered[0].object.userData.side ?? null
        }
      } else if (!filtered[0] && intersects[0]) {
        updatePointer = true
        selectedPiece = intersects[0].object.userData.piece ?? null
      }
    }

    const onPointerUp = () => {
      controls.enabled = true
      updatePointer = false
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!updatePointer) {
        return
      }

      const pointer = getPointer(event)
      mouse.x = pointer.x
      mouse.y = pointer.y
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)
      const filtered = intersects.filter(
        (entry) => entry.object.name === 'corner' || entry.object.name === 'edge',
      )

      if (filtered[0]) {
        newPoint = filtered[0].uv ?? null
        const turn = calculateTurn(
          startPoint,
          newPoint,
          selectedSide,
          selectedPiece,
        )

        if (turn) {
          updatePointer = false
          startPoint = null
          newPoint = null
          selectedSide = null
          selectedPiece = null
          moveQueue.push(turn)
        }
      } else if (!filtered[0] && intersects[0] && startPoint) {
        const turn = calculateTurn(
          startPoint,
          newPoint,
          selectedSide,
          selectedPiece,
          true,
        )

        if (turn) {
          updatePointer = false
          startPoint = null
          newPoint = null
          selectedSide = null
          selectedPiece = null
          moveQueue.push(turn)
        }
      }
    }

    const rotateFace = (face: string) => {
      if (counter === 0 && faceToRotate === 'face0') {
        if (moveQueue[0]) {
          const move = moveQueue.shift()!
          faceToRotate = `face${move}`
          moveLog.splice(moveLogIndex)
          moveLog.push(move)
          moveLogIndex = moveLog.length
          setMoveCount((count) => count + 1)

          if (faceToRotate.includes("'")) {
            faceToRotate = faceToRotate.replace("'", '')
            speed = Math.abs(speed)
          } else {
            speed = -Math.abs(speed)
          }
        }
        return
      }

      if (Math.abs(counter) >= 72) {
        decaObject[face].sides.forEach((piece, index) => {
          piece.visible = false
          if (index % 2) {
            piece.translateZ(-1.631)
            piece.translateY(0.895)
          } else {
            piece.translateZ(-1.625)
            piece.translateY(1)
          }

          piece.rotateX(dToR(63.2))
          piece.rotateZ(dToR(counter < 0 ? Math.abs(counter) : -Math.abs(counter)))
          piece.rotateX(dToR(-63.2))

          if (index % 2) {
            piece.translateZ(1.631)
            piece.translateY(-0.895)
          } else {
            piece.translateZ(1.625)
            piece.translateY(-1)
          }
        })

        decaObject[face].front.forEach((piece) => {
          piece.rotateZ(dToR(counter < 0 ? Math.abs(counter) : -Math.abs(counter)))
        })

        facesToHide[face].forEach((piece: any) => {
          decaObject[`face${piece.face}`].front[piece.pos].visible = true
        })

        swapColors(face, decaObject, speed)
        counter = 0
        faceToRotate = 'face0'
        return
      }

      let tempSpeed = speed
      if (Math.abs(speed) + Math.abs(counter) > 72) {
        tempSpeed = (72 - Math.abs(counter)) * Math.sign(counter || speed)
      }

      facesToHide[face].forEach((piece: any) => {
        decaObject[`face${piece.face}`].front[piece.pos].visible = false
      })

      decaObject[face].front.forEach((piece) => {
        piece.rotateZ(dToR(tempSpeed))
      })

      decaObject[face].sides.forEach((piece, index) => {
        piece.visible = true

        if (index % 2 && index < 30) {
          const match = colorMatchUps[face][`${index}`]
          piece.material.color.set(
            decaObject[`face${match.side}`].front[match.pos].material.color,
          )
        }

        if (index % 2) {
          piece.translateZ(-1.631)
          piece.translateY(0.895)
        } else {
          piece.translateZ(-1.625)
          piece.translateY(1)
        }

        piece.rotateX(dToR(63.2))
        piece.rotateZ(dToR(tempSpeed))
        piece.rotateX(dToR(-63.2))

        if (index % 2) {
          piece.translateZ(1.631)
          piece.translateY(-0.895)
        } else {
          piece.translateZ(1.625)
          piece.translateY(-1)
        }
      })

      counter += speed
    }

    const animate = () => {
      rotateFace(faceToRotate)
      controls.update()
      renderer.render(scene, camera)
      animationFrameRef.current = window.requestAnimationFrame(animate)
    }

    const onResize = () => {
      if (!mount) {
        return
      }

      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      renderer.render(scene, camera)
    }

    const handleScramble = () => {
      moveQueue.push(...createScramble())
    }

    const scrambleButton = document.createElement('button')
    scrambleButton.className = 'megaminx-hidden-trigger'
    scrambleButton.onclick = handleScramble
    mount.appendChild(scrambleButton)

    window.addEventListener('resize', onResize)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      controls.dispose()
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [resetNonce])

  return (
    <section className="playground">
      <div className="canvas-card megaminx-card">
        <div ref={mountRef} className="megaminx-stage" />
        <div className="canvas-caption">
          Drag the background to orbit. Drag a Megaminx piece to rotate the touched face.
        </div>
      </div>

      <aside className="control-panel">
        <div className="panel-block thumb-zone">
          <h2>Megaminx</h2>
          <div className="status-grid compact-status">
            <article className="status-card">
              <span className="status-label">Moves</span>
              <strong>{moveCount}</strong>
            </article>
          </div>
        </div>

        <div className="panel-block">
          <h2>Action Bar</h2>
          <div className="primary-actions">
            <button
              className="action-button primary"
              onClick={() => {
                const trigger = mountRef.current?.querySelector(
                  '.megaminx-hidden-trigger',
                ) as HTMLButtonElement | null
                trigger?.click()
              }}
            >
              Scramble
            </button>
            <button
              className="action-button"
              onClick={() => {
                if (!window.confirm('Do you want to reset the Megaminx?')) {
                  return
                }
                setMoveCount(0)
                setResetNonce((value) => value + 1)
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default MegaminxView
