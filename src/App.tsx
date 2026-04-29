import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import Cube, { type CubeHandle, type Move } from './rubiks-cube/Cube'
import TouchController from './rubiks-cube/TouchController'
import './App.css'

const INVERSE_MOVES: Record<Move, Move> = {
  U: "U'",
  "U'": 'U',
  D: "D'",
  "D'": 'D',
  E: "E'",
  "E'": 'E',
  L: "L'",
  "L'": 'L',
  R: "R'",
  "R'": 'R',
  M: "M'",
  "M'": 'M',
  F: "F'",
  "F'": 'F',
  B: "B'",
  "B'": 'B',
  S: "S'",
  "S'": 'S',
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

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
`

function SkyGradient() {
  return (
    <mesh scale={90} renderOrder={-1000}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={SKY_VERTEX_SHADER}
        fragmentShader={SKY_FRAGMENT_SHADER}
      />
    </mesh>
  )
}

function App() {
  const cubeRef = useRef<CubeHandle | null>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const pendingUndoTurnsRef = useRef(0)
  const [cubeInstance, setCubeInstance] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [history, setHistory] = useState<Move[]>([])
  const [isRotating, setIsRotating] = useState(false)
  const [isSolved, setIsSolved] = useState(true)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [highlightedCubeletIds, setHighlightedCubeletIds] = useState<string[]>([])

  const lastMove = history.at(-1) ?? 'None'
  const timerTone =
    timerSeconds >= 90 ? 'timer-hot' : timerSeconds >= 45 ? 'timer-warm' : 'timer-cool'

  useEffect(() => {
    if (!hasStarted || isSolved) {
      return
    }

    const timerId = window.setInterval(() => {
      setTimerSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [hasStarted, isSolved])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = orbitEnabled && !isRotating
      controlsRef.current.enablePan = false
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [isRotating, orbitEnabled])

  const handleReset = () => {
    if (!window.confirm('Do you want to reset the cube?')) {
      return
    }

    setCubeInstance((value) => value + 1)
    setMoveCount(0)
    setHistory([])
    setIsRotating(false)
    setIsSolved(true)
    setHasStarted(false)
    setTimerSeconds(0)
    setHighlightedCubeletIds([])
    setOrbitEnabled(true)
  }

  const handleScramble = () => {
    if (!window.confirm('Do you want to scramble the cube?')) {
      return
    }

    setHasStarted(true)
    setTimerSeconds(0)
    setIsSolved(false)
    cubeRef.current?.scramble(24)
  }

  const handleUndo = () => {
    const previousMove = history.at(-1)
    if (!previousMove || isRotating) {
      return
    }

    pendingUndoTurnsRef.current = 1
    cubeRef.current?.enqueueMove(INVERSE_MOVES[previousMove])
  }

  return (
    <main className="app-shell">
      <header className="top-hud">
        <div className="hud-pill move-pill">
          <span className="timer-label">Moves</span>
          <strong>{moveCount}</strong>
        </div>
        <div className={`timer-pill ${timerTone}`}>
          <span className="timer-label">Time</span>
          <strong>{formatTime(timerSeconds)}</strong>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Touch-Interactive</p>
          <h1>3D Rubik&apos;s Cube</h1>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">State</span>
            <strong className={isSolved ? 'solved' : 'scrambled'}>
              {isSolved ? 'Solved' : 'In Progress'}
            </strong>
          </article>
          <article className="status-card">
            <span className="status-label">Last Move</span>
            <strong>{lastMove}</strong>
          </article>
          <article className="status-card">
            <span className="status-label">Orbit</span>
            <strong>{orbitEnabled && !isRotating ? 'Free' : 'Locked'}</strong>
          </article>
        </div>
      </section>

      <section className="playground">
        <div className="canvas-card">
          <Canvas dpr={[1, 2]} camera={{ position: [7.5, 7, 9], fov: 42 }}>
            <color attach="background" args={['#d9efff']} />
            <fog attach="fog" args={['#d9efff', 20, 36]} />
            <SkyGradient />
            <ambientLight intensity={1.2} />
            <directionalLight position={[8, 10, 6]} intensity={2.4} castShadow />
            <directionalLight position={[-6, -4, -8]} intensity={0.7} />
            <Cube
              key={cubeInstance}
              ref={cubeRef}
              highlightedCubeletIds={highlightedCubeletIds}
              onMoveComplete={(move) => {
                setHasStarted(true)

                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate(10)
                }

                if (pendingUndoTurnsRef.current > 0) {
                  pendingUndoTurnsRef.current -= 1
                  setMoveCount((count) => Math.max(0, count - 1))
                  setHistory((entries) => entries.slice(0, -1))
                  return
                }

                setMoveCount((count) => count + 1)
                setHistory((entries) => [...entries, move])
              }}
              onRotateStateChange={setIsRotating}
              onSolvedChange={setIsSolved}
            />
            <TouchController
              cubeRef={cubeRef}
              isRotating={isRotating}
              onHighlightChange={setHighlightedCubeletIds}
              onOrbitEnabledChange={setOrbitEnabled}
            />
            <Environment preset="city" />
            <OrbitControls
              ref={controlsRef}
              enabled={orbitEnabled && !isRotating}
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              minDistance={7}
              maxDistance={16}
              target={[0, 0, 0]}
            />
          </Canvas>
          <div className="canvas-caption">
            Touch a cubie to rotate a layer. Start on empty space to orbit the camera.
            Pinch or scroll to zoom.
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-block thumb-zone">
            <h2>Action Bar</h2>
            <div className="primary-actions">
              <button
                className="action-button primary"
                onClick={handleScramble}
                disabled={isRotating}
              >
                Scramble
              </button>
              <button
                className="action-button"
                onClick={handleUndo}
                disabled={isRotating || history.length === 0}
              >
                Undo
              </button>
              <button className="action-button" onClick={handleReset} disabled={isRotating}>
                Reset
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
