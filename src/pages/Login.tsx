import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/api'
import {
  readableAuthError,
  readableGoogleError,
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
import {
  CARD,
  FIELD,
  FIELD_ASIDE,
  FIELD_LABEL,
  GOOGLE_BUTTON,
  INPUT_PAIR,
  LINK_BUTTON,
  LOGIN_ASIDE,
  LOGIN_BRAND,
  LOGIN_CARD,
  LOGIN_DIVIDER,
  LOGIN_ERROR,
  LOGIN_FOOT,
  LOGIN_FORM,
  LOGIN_MAIN,
  LOGIN_PITCH,
  LOGIN_POINTS,
  LOGIN_SHELL,
  LOGIN_SUB,
  LOGIN_SUBMIT,
  LOGIN_SWITCH,
  LOGIN_TITLE,
  POINT_BODY,
  POINT_GLYPH,
  POINT_TITLE,
  REVEAL,
  SETUP_NOTICE,
  SETUP_SKIP,
  SETUP_STEPS,
  SETUP_TITLE,
} from '../components/ui'

type LoginProps = {
  theme: Theme
  onToggleTheme: () => void
  onPreview: () => void
  /** Called once a session exists, so the app can leave the login screen. */
  onSignedIn: () => void
}

type Mode = 'signin' | 'register'

/** Advice differs: locally the API is probably not running; deployed it is down. */
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
    body: 'Entries are scoped to your account and never leave it.',
  },
]

export function Login({ theme, onToggleTheme, onPreview, onSignedIn }: LoginProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  /*
   * Set when a sign-in attempt could not reach the API at all — status 0, which
   * is a network failure, a blocked preflight, or a free instance still waking.
   * Derived from a real attempt rather than a probe on load: an extra request
   * on every visit to learn something only the first sign-in needs is waste.
   */
  const [unreachable, setUnreachable] = useState(false)

  /**
   * The Google popup, then the API.
   *
   * `onSignedIn` is what moves the app on. Sign-in sets an HttpOnly cookie,
   * and a cookie the page cannot read is also a cookie the page cannot notice
   * arriving — so every path that establishes a session has to say so.
   */
  async function handleGoogle() {
    setError('')
    setBusy('google')
    try {
      await signInWithGoogle()
      onSignedIn()
    } catch (cause) {
      // A closed popup reports null: the person changed their mind, which is
      // not an error worth shouting about.
      const message = readableGoogleError(cause)
      if (message) setError(message)
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
      onSignedIn()
    } catch (cause) {
      setUnreachable(cause instanceof ApiError && cause.status === 0)
      setError(readableAuthError(cause))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={LOGIN_SHELL}>
      <LoginBackdrop />

      <div className="absolute top-20 right-24 z-[3]">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className={LOGIN_ASIDE}>
        {/* Name sits directly above the tagline so a first-time visitor reads
            what the product is called before what it claims to do. */}
        <div className="w-full max-w-460">
          <h1 className={LOGIN_BRAND}>RagDex</h1>

          <p className={LOGIN_PITCH}>
            Know Your Trades.
            <br />
            Grow Your Edge.
          </p>

          <ul className={LOGIN_POINTS}>
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span className={POINT_GLYPH}>
                  <Icon size={16} />
                </span>
                <div>
                  <p className={POINT_TITLE}>{title}</p>
                  <p className={POINT_BODY}>{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className={LOGIN_FOOT}>12,480 traders journaling this week</p>
      </section>

      <section className={LOGIN_MAIN}>
        <div className={`${CARD} ${LOGIN_CARD}`}>
          <h2 className={LOGIN_TITLE}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className={LOGIN_SUB}>
            {mode === 'signin'
              ? 'Sign in to pick up where your last session left off.'
              : 'We will email you a link to confirm the address before your journal opens.'}
          </p>

          {unreachable && (
            <div className={SETUP_NOTICE} role="status">
              <p className={SETUP_TITLE}>Cannot reach the RagDex API</p>
              <p>
                Sign-in, the journal and the coach all live behind the API, so nothing
                here works until it answers.
              </p>
              <ol className={SETUP_STEPS}>
                {IS_LOCAL ? (
                  <li>
                    Start it with <code>uvicorn app.main:app --reload</code> in{' '}
                    <code>ragdex-be</code>, and point this at it with{' '}
                    <code>VITE_API_BASE_URL</code>.
                  </li>
                ) : (
                  <li>
                    The service may be asleep — a free instance takes about a minute to
                    wake. Try again shortly.
                  </li>
                )}
              </ol>
              <button type="button" className={SETUP_SKIP} onClick={onPreview}>
                Preview the app without signing in
              </button>
            </div>
          )}

          <button
            type="button"
            className={GOOGLE_BUTTON}
            onClick={handleGoogle}
            disabled={busy !== null}
          >
            {busy === 'google' ? (
              <SpinnerIcon className="animate-spin" />
            ) : (
              <GoogleIcon size={18} />
            )}
            {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </button>

          <div className={LOGIN_DIVIDER}>
            <span>or</span>
          </div>

          <form className={LOGIN_FORM} onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <label className={FIELD}>
                <span className={FIELD_LABEL}>Display name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Moreno"
                  autoComplete="name"
                />
              </label>
            )}

            <label className={FIELD}>
              <span className={FIELD_LABEL}>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@desk.com"
                autoComplete="email"
              />
            </label>

            <label className={FIELD}>
              <span className={FIELD_LABEL}>
                Password
                {mode === 'signin' && (
                  <span className={FIELD_ASIDE}>At least 6 characters</span>
                )}
              </span>
              <span className={INPUT_PAIR}>
                <input
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className={REVEAL}
                  onClick={() => setReveal((current) => !current)}
                  aria-pressed={reveal}
                >
                  {reveal ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            {error && (
              <p className={LOGIN_ERROR} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={LOGIN_SUBMIT}
              disabled={busy !== null}
            >
              {busy === 'email' && <SpinnerIcon className="animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className={LOGIN_SWITCH}>
            {mode === 'signin' ? 'New to RagDex? ' : 'Already have an account? '}
            <button
              type="button"
              className={LINK_BUTTON}
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
