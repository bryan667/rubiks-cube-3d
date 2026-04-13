import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import Cube, { type CubeHandle, type Move } from './Cube'
import './App.css'

const MOVE_KEYS: Record<string, Move> = {
  u: 'U',
  d: 'D',
  l: 'L',
  r: 'R',
  f: 'F',
  b: 'B',
}

const FACE_MOVES: Move[] = ['U', 'D', 'L', 'R', 'F', 'B']

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function App() {
  const cubeRef = useRef<CubeHandle | null>(null)
  const pendingUndoTurnsRef = useRef(0)
  const [cubeInstance, setCubeInstance] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [history, setHistory] = useState<Move[]>([])
  const [isRotating, setIsRotating] = useState(false)
  const [isSolved, setIsSolved] = useState(true)
  const [isZenMode, setIsZenMode] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [hintMessage, setHintMessage] = useState(
    'Tap a move or drag the cube to get comfortable with the current angle.',
  )

  const lastMove = history.at(-1) ?? 'None'
  const timerTone =
    timerSeconds >= 90 ? 'timer-hot' : timerSeconds >= 45 ? 'timer-warm' : 'timer-cool'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }

      const move = MOVE_KEYS[event.key.toLowerCase()]
      if (!move) {
        return
      }

      event.preventDefault()
      setHasStarted(true)
      cubeRef.current?.enqueueMove(move)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!hasStarted || isSolved) {
      return
    }

    const timerId = window.setInterval(() => {
      setTimerSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [hasStarted, isSolved])

  const handleReset = () => {
    setCubeInstance((value) => value + 1)
    setMoveCount(0)
    setHistory([])
    setIsRotating(false)
    setIsSolved(true)
    setHasStarted(false)
    setTimerSeconds(0)
    setHintMessage('Tap a move or drag the cube to get comfortable with the current angle.')
  }

  const handleScramble = () => {
    setHasStarted(true)
    setTimerSeconds(0)
    setIsSolved(false)
    setHintMessage('Scrambled. Start by solving one face and protecting it while you build the next layer.')
    cubeRef.current?.scramble(24)
  }

  const handleUndo = () => {
    const previousMove = history.at(-1)
    if (!previousMove || isRotating) {
      return
    }

    pendingUndoTurnsRef.current = 3
    cubeRef.current?.enqueueMove(previousMove)
    cubeRef.current?.enqueueMove(previousMove)
    cubeRef.current?.enqueueMove(previousMove)
  }

  const handleHint = () => {
    const previousMove = history.at(-1)
    if (previousMove) {
      setHintMessage(
        `Hint: inspect the layer affected by ${previousMove} and look for a single edge you can restore without breaking your strongest face.`,
      )
      return
    }

    setHintMessage(
      'Hint: pick one face center and match its edge colors first. Corners are easier once the cross is stable.',
    )
  }

  return (
    <main className={`app-shell${isZenMode ? ' zen-mode' : ''}`}>
      <header className="top-hud">
        <div className={`timer-pill ${timerTone}`}>
          <span className="timer-label">Time</span>
          <strong>{formatTime(timerSeconds)}</strong>
        </div>
        <button
          className="zen-toggle"
          onClick={() => setIsZenMode((value) => !value)}
          type="button"
        >
          {isZenMode ? 'Exit Zen' : 'Zen Mode'}
        </button>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Mobile-First Pass</p>
          <h1>3D Rubik&apos;s Cube</h1>
          <p className="lede">
            Portrait-friendly layout, quiet top HUD, and bottom controls sized for
            thumbs so the cube stays comfortable on a phone.
          </p>
        </div>

        <div className="status-grid">
          <article className="status-card">
            <span className="status-label">State</span>
            <strong className={isSolved ? 'solved' : 'scrambled'}>
              {isSolved ? 'Solved' : 'In Progress'}
            </strong>
          </article>
          <article className="status-card">
            <span className="status-label">Moves</span>
            <strong>{moveCount}</strong>
          </article>
          <article className="status-card">
            <span className="status-label">Last Move</span>
            <strong>{lastMove}</strong>
          </article>
        </div>
      </section>

      <section className="playground">
        <div className="canvas-card">
          <Canvas dpr={[1, 2]} camera={{ position: [7.5, 7, 9], fov: 42 }}>
            <color attach="background" args={['#0e1726']} />
            <fog attach="fog" args={['#0e1726', 12, 24]} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[8, 10, 6]} intensity={2.4} castShadow />
            <directionalLight position={[-6, -4, -8]} intensity={0.7} />
            <Cube
              key={cubeInstance}
              ref={cubeRef}
              onMoveComplete={(move) => {
                setHasStarted(true)

                if (pendingUndoTurnsRef.current > 0) {
                  pendingUndoTurnsRef.current -= 1

                  if (pendingUndoTurnsRef.current === 0) {
                    setMoveCount((count) => Math.max(0, count - 1))
                    setHistory((entries) => entries.slice(0, -1))
                  }
                  return
                }

                setMoveCount((count) => count + 1)
                setHistory((entries) => [...entries, move])
              }}
              onRotateStateChange={setIsRotating}
              onSolvedChange={setIsSolved}
            />
            <Environment preset="city" />
            <OrbitControls enableDamping dampingFactor={0.08} minDistance={7} maxDistance={16} />
          </Canvas>
          <div className="canvas-caption">
            Drag to orbit. Pinch or scroll to zoom. The cube stays in the upper focus
            area on portrait screens.
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-block thumb-zone">
            <h2>Quick Actions</h2>
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
              <button className="action-button" onClick={handleHint} disabled={isRotating}>
                Hint
              </button>
            </div>
          </div>

          <div className="panel-block">
            <h2>Face Turns</h2>
            <div className="moves-grid">
              {FACE_MOVES.map((move) => (
                <button
                  key={move}
                  className="move-button"
                  onClick={() => {
                    setHasStarted(true)
                    cubeRef.current?.enqueueMove(move)
                  }}
                  disabled={isRotating}
                >
                  {move}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-block">
            <h2>Session</h2>
            <div className="action-list compact-actions">
              <button className="action-button" onClick={handleReset}>
                Reset Cube
              </button>
              <div className="hint-card" role="status" aria-live="polite">
                {hintMessage}
              </div>
            </div>
          </div>

          <div className="panel-block desktop-only">
            <h2>How It Works</h2>
            <ul className="hint-list">
              <li>The cube uses 26 independent cubelets with dark internal faces.</li>
              <li>Each move groups 9 cubelets under a temporary pivot and animates a 90 degree turn.</li>
              <li>Win detection checks whether every outer face shows one uniform color.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
