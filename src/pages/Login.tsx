import { useEffect, useState, type FormEvent } from 'react'
import { isFirebaseConfigured, missingFirebaseKeys, projectId } from '../lib/firebase'
import {
  consumeRedirectResult,
  readableAuthError,
  registerWithPassword,
  signInWithGoogle,
  signInWithPassword,
} from '../lib/useAuth'
import type { Theme } from '../lib/useTheme'
import { ThemeToggle } from '../components/TopBar'
import { LoginBackdrop } from '../components/LoginBackdrop'
import {
  BoltIcon,
  GoogleIcon,
  ShieldIcon,
  SpinnerIcon,
  TrendIcon,
} from '../components/Icons'
import '../styles/login.css'

type LoginProps = {
  theme: Theme
  onToggleTheme: () => void
  onPreview: () => void
}

type Mode = 'signin' | 'register'

const PROJECT = 'trading-journal-43d07'
const CONSOLE_URL = `https://console.firebase.google.com/project/${PROJECT}/settings/general`

/** Advice differs: locally you edit a file, on a host you set build variables. */
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

const HIGHLIGHTS = [
  {
    icon: TrendIcon,
    title: 'Every edge, quantified',
    body: 'Win rate, expectancy and R-multiples recalculated on each fill.',
  },
  {
    icon: BoltIcon,
    title: 'Behavioral leak detection',
    body: 'The coach flags revenge trades and session fatigue before they compound.',
  },
  {
    icon: ShieldIcon,
    title: 'Your journal, your rules',
    body: 'Entries are scoped to your account and synced live through Firestore.',
  },
]

export function Login({ theme, onToggleTheme, onPreview }: LoginProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)

  // A redirect sign-in reports its outcome only after the page comes back.
  useEffect(() => {
    let live = true
    consumeRedirectResult().then((message) => {
      if (live && message) setError(message)
    })
    return () => {
      live = false
    }
  }, [])

  async function handleGoogle() {
    setError('')
    setBusy('google')
    try {
      await signInWithGoogle()
    } catch (cause) {
      setError(readableAuthError(cause))
    } finally {
      setBusy(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (email.trim() === '' || password === '') {
      setError('Enter your email and password to continue.')
      return
    }

    setError('')
    setBusy('email')
    try {
      if (mode === 'signin') {
        await signInWithPassword(email.trim(), password)
      } else {
        await registerWithPassword(email.trim(), password, name)
      }
    } catch (cause) {
      setError(readableAuthError(cause))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="login">
      <LoginBackdrop />

      <div className="login-toggle">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className="login-aside">
        {/* Name sits directly above the tagline so a first-time visitor reads
            what the product is called before what it claims to do. */}
        <div className="login-hero">
          <h1 className="login-brand">RagDex</h1>

          <p className="login-pitch">
            Know Your Trades.
            <br />
            Grow Your Edge.
          </p>

          <ul className="login-points">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span className="point-glyph">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="point-title">{title}</p>
                  <p className="point-body">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="login-foot">12,480 traders journaling this week</p>
      </section>

      <section className="login-main">
        <div className="login-card card">
          <h2 className="login-title">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="login-sub">
            {mode === 'signin'
              ? 'Sign in to pick up where your last session left off.'
              : 'We will email you a link to confirm the address before your journal opens.'}
          </p>

          {!isFirebaseConfigured && (
            <div className="setup-notice" role="status">
              <p className="setup-title">Firebase is not connected yet</p>
              <p>
                Project <code>{projectId ?? PROJECT}</code> needs its{' '}
                <strong>web app</strong> config — a different credential from a service
                account key, which has none of these values in it.
              </p>
              {IS_LOCAL ? (
                <ol className="setup-steps">
                  <li>
                    Open{' '}
                    <a href={CONSOLE_URL} target="_blank" rel="noreferrer">
                      Project settings &rsaquo; General
                    </a>{' '}
                    and scroll to <em>Your apps</em>. No web app there yet? Click{' '}
                    <code>&lt;/&gt;</code> to register one.
                  </li>
                  <li>
                    Copy the whole <code>firebaseConfig</code> block.
                  </li>
                  <li>
                    Run <code>npm run setup:firebase</code>, paste it, then restart the
                    dev server.
                  </li>
                </ol>
              ) : (
                <ol className="setup-steps">
                  <li>
                    Set these in your host&rsquo;s environment variables (on Vercel:
                    Settings &rsaquo; Environment Variables, type <em>Config</em>).
                  </li>
                  <li>
                    <strong>Redeploy.</strong> These are compiled in at build time, so an
                    environment change alone does not update the running site.
                  </li>
                </ol>
              )}
              {missingFirebaseKeys.length > 0 && (
                <ul className="setup-list">
                  {missingFirebaseKeys.map((key) => (
                    <li key={key}>
                      <code>{key}</code>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="setup-skip" onClick={onPreview}>
                Preview the app without signing in
              </button>
            </div>
          )}

          <button
            type="button"
            className="google-button"
            onClick={handleGoogle}
            disabled={!isFirebaseConfigured || busy !== null}
          >
            {busy === 'google' ? (
              <SpinnerIcon className="spinner" />
            ) : (
              <GoogleIcon size={18} />
            )}
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <label className="field">
                <span className="field-label">Display name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Moreno"
                  autoComplete="name"
                  disabled={!isFirebaseConfigured}
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@desk.com"
                autoComplete="email"
                disabled={!isFirebaseConfigured}
              />
            </label>

            <label className="field">
              <span className="field-label">
                Password
                {mode === 'signin' && (
                  <span className="field-aside">At least 6 characters</span>
                )}
              </span>
              <span className="input-pair">
                <input
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  disabled={!isFirebaseConfigured}
                />
                <button
                  type="button"
                  className="reveal"
                  onClick={() => setReveal((current) => !current)}
                  aria-pressed={reveal}
                >
                  {reveal ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={!isFirebaseConfigured || busy !== null}
            >
              {busy === 'email' && <SpinnerIcon className="spinner" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="login-switch">
            {mode === 'signin' ? 'New to RagDex? ' : 'Already have an account? '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin')
                setError('')
              }}
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
