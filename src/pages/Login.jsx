import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithCode } from '../lib/auth.js'
import { useStore } from '../store/useStore.js'
import ConfigBanner from '../components/ConfigBanner.jsx'

// Login screen — the campaign join code is the password.
// Player (existing): character name + campaign code.
// Player (new):      a fresh name + campaign code -> character creation.
// DM:                leave name blank (or type the campaign name) + DM code.
export default function Login() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = useStore((s) => s.login)
  const setPendingSignup = useStore((s) => s.setPendingSignup)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginWithCode(name, pin)

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    // New name + valid campaign code -> off to character creation.
    if (result.action === 'signup') {
      setPendingSignup({ session: result.session, name: result.name })
      navigate('/create', { replace: true })
      return
    }

    // Save the login in our global store (also persisted to localStorage)…
    login({
      session: result.session,
      role: result.role,
      character: result.character,
    })

    // …and send them to the right screen.
    navigate(result.role === 'dm' ? '/dm' : '/player', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ConfigBanner />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-panel border border-panel-2 rounded-2xl shadow-xl p-8"
        >
          {/* Title */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚔️</div>
            <h1 className="text-3xl font-bold text-gold tracking-wide">
              D&amp;D Companion
            </h1>
            <p className="text-muted mt-2 text-sm">
              Enter the realm with your name and campaign code.
            </p>
          </div>

          {/* Name */}
          <label className="block text-sm text-muted mb-1" htmlFor="name">
            Character name
            <span className="text-muted/60"> (leave blank if you're the DM)</span>
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 mb-4 focus:outline-none focus:border-gold"
            placeholder="e.g. Thrain"
            autoComplete="off"
          />

          {/* Campaign code (the join code is the password) */}
          <label className="block text-sm text-muted mb-1" htmlFor="pin">
            Campaign code
            <span className="text-muted/60"> (or the DM code)</span>
          </label>
          <input
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-lg bg-ink border border-panel-2 px-3 py-2 mb-2 focus:outline-none focus:border-gold tracking-widest"
            placeholder="enter campaign code"
            type="password"
            autoComplete="off"
          />

          {/* Error message */}
          {error && (
            <p className="text-blood text-sm mt-2 mb-1" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold text-ink font-semibold py-2.5 mt-4 hover:brightness-110 active:brightness-95 disabled:opacity-50 transition"
          >
            {loading ? 'Entering…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
