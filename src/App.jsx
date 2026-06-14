import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import Login from './pages/Login.jsx'
import PlayerView from './pages/PlayerView.jsx'
import DMView from './pages/DMView.jsx'
import CreateCharacter from './pages/CreateCharacter.jsx'

// ---------------------------------------------------------------
// Top-level routing.
//   /        -> Login (or redirect if already logged in)
//   /create  -> Character creation wizard (guarded: must have a pending signup)
//   /player  -> Player character sheet  (guarded: must be a player)
//   /dm      -> DM dashboard            (guarded: must be the DM)
// ---------------------------------------------------------------
export default function App() {
  const role = useStore((s) => s.role)
  const pendingSignup = useStore((s) => s.pendingSignup)

  return (
    <Routes>
      <Route
        path="/"
        element={
          // If a session already exists, skip the login screen.
          role === 'player' ? (
            <Navigate to="/player" replace />
          ) : role === 'dm' ? (
            <Navigate to="/dm" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/create"
        element={pendingSignup ? <CreateCharacter /> : <Navigate to="/" replace />}
      />

      <Route
        path="/player"
        element={role === 'player' ? <PlayerView /> : <Navigate to="/" replace />}
      />

      <Route
        path="/dm"
        element={role === 'dm' ? <DMView /> : <Navigate to="/" replace />}
      />

      {/* Anything unknown goes home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
