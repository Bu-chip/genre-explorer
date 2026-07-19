import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import './AuthMenu.css'

function UserIcon({ active }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" fill={active ? 'currentColor' : 'none'} />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  )
}

export function AuthMenu() {
  const { user, signInWithMagicLink, signInWithGoogle, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault()
      const addr = email.trim()
      if (!addr) return
      setStatus('sending')
      setErrorMsg('')
      const { error } = await signInWithMagicLink(addr)
      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
      } else {
        setStatus('sent')
      }
    },
    [email, signInWithMagicLink],
  )

  const handleGoogle = useCallback(async () => {
    setStatus('sending')
    setErrorMsg('')
    const { error } = await signInWithGoogle()
    // On success the browser redirects to Google, so there's no further UI to
    // update here — only the error path needs to reset the menu state.
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    }
  }, [signInWithGoogle])

  const handleSignOut = useCallback(async () => {
    await signOut()
    setOpen(false)
  }, [signOut])

  const signedIn = !!user

  // Avatar initial: prefer the Google display name, fall back to the email, and
  // take the first alphanumeric character so leading symbols/spaces are skipped.
  const initial = useMemo(() => {
    const name = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
    const base = name.trim() || user?.email || ''
    const match = base.match(/[a-z0-9]/i)
    return match ? match[0].toUpperCase() : '?'
  }, [user])

  return (
    <div className="auth-menu" ref={ref}>
      <button
        type="button"
        className="auth-menu__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={signedIn ? 'Account' : 'Sign in'}
        title={signedIn ? 'Account' : 'Sign in'}
      >
        {signedIn ? (
          <span className="auth-menu__avatar">{initial}</span>
        ) : (
          <UserIcon active={signedIn} />
        )}
      </button>

      {open && (
        <div className="auth-menu__panel">
          {signedIn ? (
            <>
              <p className="auth-menu__account">
                <span className="auth-menu__account-label">signed in as</span>
                <span className="auth-menu__account-email">{user.email}</span>
              </p>
              <button
                type="button"
                className="auth-menu__action"
                onClick={handleSignOut}
              >
                sign out
              </button>
            </>
          ) : status === 'sent' ? (
            <p className="auth-menu__note">
              check your inbox — magic link sent to{' '}
              <span className="auth-menu__note-email">{email.trim()}</span>
            </p>
          ) : (
            <form className="auth-menu__form" onSubmit={handleSend}>
              <p className="auth-menu__note">
                sign in to sync your collection across devices.
              </p>
              <input
                className="auth-menu__input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                spellCheck={false}
                aria-label="Email for magic link"
              />
              <button
                type="submit"
                className="auth-menu__action"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'sending…' : 'send magic link'}
              </button>
              {status === 'error' && (
                <p className="auth-menu__error">
                  {errorMsg || 'something went wrong. try again.'}
                </p>
              )}
              <button
                type="button"
                className="auth-menu__action auth-menu__action--google"
                onClick={handleGoogle}
                disabled={status === 'sending'}
              >
                entrar con google
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
