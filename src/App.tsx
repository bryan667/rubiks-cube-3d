import { lazy, Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const RubiksCubePage = lazy(() => import('./rubiks-cube/RubiksCubePage'))
const MegaminxPage = lazy(() => import('./megaminx/MegaminxPage'))

function App() {
  return (
    <>
      <nav className="mode-switcher" aria-label="Puzzle routes">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'mode-switcher-link active' : 'mode-switcher-link'
          }
        >
          Rubik&apos;s Cube
        </NavLink>
        <NavLink
          to="/megaminx"
          className={({ isActive }) =>
            isActive ? 'mode-switcher-link active' : 'mode-switcher-link'
          }
        >
          Megaminx
        </NavLink>
      </nav>
      <Suspense fallback={<div className="route-loading">Loading puzzle...</div>}>
        <Routes>
          <Route path="/" element={<RubiksCubePage />} />
          <Route path="/megaminx" element={<MegaminxPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
