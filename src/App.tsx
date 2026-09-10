// Loaded first on purpose: page stylesheets override these base rules at equal
// specificity, so they have to come later in the bundle.
import './styles/app.css'
import './styles/forms.css'
import './styles/motion.css'
import { useEffect, useRef, useState } from 'react'
import { QuickAddTrade } from './components/QuickAddTrade'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { navigate, useHashRoute } from './lib/useHashRoute'
import { useAuth } from './lib/useAuth'
import { useProfile, type Profile as ProfileRecord } from './lib/profile'
import { saveTrade, useTrades } from './lib/trades'
import { useTheme } from './lib/useTheme'
import { labelForRoute } from './navigation'
import { AiCoach } from './pages/AiCoach'
import { Analytics } from './pages/Analytics'
import { Billing } from './pages/Billing'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Placeholder } from './pages/Placeholder'
import { Profile } from './pages/Profile'
import { TradeJournal } from './pages/TradeJournal'
import { VerifyEmail } from './pages/VerifyEmail'
import { AdminShell } from './pages/admin/AdminShell'
import type { StoredTrade } from './lib/trades'
import type { User } from 'firebase/auth'

/** Where a signed-in session lands, and where sign-out returns from. */
const HOME_ROUTE = 'dashboard'

type TraderViewProps = {
  route: string
  uid: string | null
  user: User | null
  profile: ProfileRecord | null
  trades: StoredTrade[]
  loading: boolean
  error: string | null
}

function TraderView({
  route,
  uid,
  user,
  profile,
  trades,
  loading,
  error,
}: TraderViewProps) {
  switch (route) {
    case 'dashboard':
      return <Dashboard trades={trades} uid={uid} />
    case 'journal':
      return <TradeJournal uid={uid} trades={trades} loading={loading} error={error} />
    case 'analytics':
      return <Analytics trades={trades} />
    case 'coach':
      return <AiCoach />
    case 'profile':
      return <Profile user={user} profile={profile} />
    case 'billing':
      return <Billing user={user} profile={profile} />
    default:
      return <Placeholder title={labelForRoute(route)} />
  }
}

function App() {
  const route = useHashRoute()
  const { theme, toggle } = useTheme()
  const { user, emailVerified, pending, refresh } = useAuth()
  const { profile, isNewAccount } = useProfile(user)
  const [logging, setLogging] = useState(false)
  // Escape hatch for browsing the UI before Firebase credentials are in place.
  const [preview, setPreview] = useState(false)

  const uid = user?.uid ?? null
  const { trades, loading, error } = useTrades(emailVerified ? uid : null)
  const signedIn = (Boolean(user) && emailVerified) || preview

  // Signing in always lands on the dashboard, and signing out always returns to
  // login. Matching on `route === 'login'` alone was not enough: a session that
  // ends while the hash reads #/coach leaves that hash in place, so the next
  // sign-in would drop the user straight back onto AI Coach.
  const wasSignedIn = useRef(false)
  const settled = useRef(false)

  useEffect(() => {
    if (pending) return

    if (!settled.current) {
      // First resolution of the session. Deep links are honoured here, so a
      // refresh on #/journal stays on the journal.
      settled.current = true
      wasSignedIn.current = signedIn
      if (signedIn && route === 'login') navigate(HOME_ROUTE)
      if (!signedIn && route !== 'login') navigate('login')
      return
    }

    if (signedIn && !wasSignedIn.current) navigate(HOME_ROUTE)
    if (!signedIn && wasSignedIn.current) navigate('login')
    if (!signedIn && route !== 'login') navigate('login')

    wasSignedIn.current = signedIn
  }, [pending, signedIn, route])

  if (pending) {
    return (
      <div className="auth-splash">
        <h1 className="brand-name">TradeX</h1>
        <p className="brand-sub">Restoring your session…</p>
      </div>
    )
  }

  // A signed-in but unconfirmed address gets the gate, never the app.
  if (user && !emailVerified && !preview) {
    return (
      <VerifyEmail
        user={user}
        onRecheck={refresh}
        viaGoogle={user.providerData.some((entry) => entry.providerId === 'google.com')}
        isNewAccount={isNewAccount}
      />
    )
  }

  if (!signedIn) {
    return <Login theme={theme} onToggleTheme={toggle} onPreview={() => setPreview(true)} />
  }

  if (route === 'login') return null

  if (route === 'admin' || route.startsWith('admin/')) {
    return <AdminShell route={route} theme={theme} onToggleTheme={toggle} />
  }

  return (
    <div className="app">
      <Sidebar route={route} onQuickAdd={() => setLogging(true)} />

      <div className="workspace">
        <TopBar theme={theme} onToggleTheme={toggle} />
        <main className="content" key={route}>
          <TraderView
            route={route}
            uid={uid}
            user={user}
            profile={profile}
            trades={trades}
            loading={loading}
            error={error}
          />
        </main>
      </div>

      <QuickAddTrade
        open={logging}
        onClose={() => setLogging(false)}
        onSave={async (trade) => {
          if (!user) return
          await saveTrade(user.uid, trade)
        }}
      />
    </div>
  )
}

export default App
