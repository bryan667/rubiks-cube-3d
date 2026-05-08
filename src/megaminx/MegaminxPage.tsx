import { useRef, useState } from 'react'
import MegaMinx from './components/MegaMinx/MegaMinx'

type MegaMinxActions = {
  scramble: () => void
  undo: () => void
}

export default function MegaminxPage() {
  const [resetKey, setResetKey] = useState(0)
  const actionsRef = useRef<MegaMinxActions | null>(null)

  const handleScramble = () => {
    if (!window.confirm('Do you want to scramble the megaminx?')) return
    actionsRef.current?.scramble()
  }

  const handleReset = () => {
    if (!window.confirm('Do you want to reset the megaminx?')) return
    actionsRef.current = null
    setResetKey((k) => k + 1)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel route-aware">
        <div className="hero-copy">
          <p className="eyebrow">Touch-Interactive</p>
          <h1>Megaminx</h1>
        </div>
      </section>

      <section className="playground">
        <div className="canvas-card">
          <MegaMinx
            key={resetKey}
            reset={handleReset}
            onRegisterActions={(actions: MegaMinxActions) => {
              actionsRef.current = actions
            }}
          />
          <div className="canvas-caption">
            Drag the puzzle to turn layers. Drag empty space to orbit the camera.
          </div>
        </div>
        <aside className="control-panel">
          <div className="panel-block thumb-zone">
            <h2>Action Bar</h2>
            <div className="primary-actions">
              <button className="action-button primary" onClick={handleScramble}>
                Scramble
              </button>
              <button
                className="action-button"
                onClick={() => actionsRef.current?.undo()}
              >
                Undo
              </button>
              <button className="action-button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
