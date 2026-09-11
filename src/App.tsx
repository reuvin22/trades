import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatDock } from './components/ChatDock'
import { Tour } from './components/Tour'
import { accountIsNew, markTourSeen, tourSeen } from './lib/tourState'
import { QuickAddTrade } from './components/QuickAddTrade'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { APP_SHELL, CONTENT, WORKSPACE } from './components/layout'
import { useNavDrawer } from './lib/useNavDrawer'
import { navigate, useHashRoute } from './lib/useHashRoute'
import { useAuth } from './lib/useAuth'
import {
  accountTypeLabel,
  useProfile,
  type Profile as ProfileRecord,
} from './lib/profile'
import { saveTrade, useTrades } from './lib/trades'
import { useTheme } from './lib/useTheme'
import { labelForRoute } from './navigation'
import { AiCoach } from './pages/AiCoach'
import { Analytics } from './pages/Analytics'
import { Calendar } from './pages/Calendar'
import { Billing } from './pages/Billing'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Placeholder } from './pages/Placeholder'
import { Profile } from './pages/Profile'
import { TradeJournal } from './pages/TradeJournal'
import { VerifyEmail } from './pages/VerifyEmail'
import { AdminShell } from './pages/admin/AdminShell'
import type { StoredTrade } from './lib/trades'
import type { AuthUser } from './lib/useAuth'

/** Where a signed-in session lands, and where sign-out returns from. */
const HOME_ROUTE = 'dashboard'

type TraderViewProps = {
  route: string
  uid: string | null
  user: AuthUser | null
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
    case 'calendar':
      return <Calendar trades={trades} />
    case 'coach':
      return <AiCoach user={user} profile={profile} tradeCount={trades.length} />
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
  const nav = useNavDrawer(route)
  const [tourDone, setTourDone] = useState<string | null>(null)
  // Escape hatch for browsing the UI without an account, or while the API is
  // unreachable.
  const [preview, setPreview] = useState(false)

  const uid = user?.uid ?? null
  const { trades, loading, error, reload } = useTrades(emailVerified ? uid : null)
  const signedIn = (Boolean(user) && emailVerified) || preview

  /*
   * The tour runs once for a new account. Derived rather than held in an
   * effect, so it simply stops being true the moment it is dismissed — and
   * never appears for the preview session, which has no account to remember it
   * against.
   */
  const showTour = useMemo(() => {
    if (!signedIn || !uid || preview) return false
    if (tourDone === uid) return false
    if (!accountIsNew(isNewAccount, profile?.createdAt ?? null)) return false
    return !tourSeen(uid)
  }, [signedIn, uid, preview, tourDone, isNewAccount, profile?.createdAt])

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
      <div className="grid min-h-screen content-center justify-items-center gap-16 bg-[linear-gradient(180deg,var(--color-bg-top)_0%,var(--color-bg-deep)_100%)]">
        <h1 className="animate-pulse-brand text-[30px] font-semibold tracking-[-0.02em] text-fg-strong">
          RagDex
        </h1>
        <p className="text-[12.5px] tracking-[0.01em] text-fg-muted">Restoring your session…</p>
      </div>
    )
  }

  // A signed-in but unconfirmed address gets the gate, never the app.
  if (user && !emailVerified && !preview) {
    return (
      <VerifyEmail
        user={user}
        onRecheck={refresh}
        viaGoogle={user.providers.includes('google.com')}
        isNewAccount={isNewAccount}
      />
    )
  }

  if (!signedIn) {
    return (
      <Login
        theme={theme}
        onToggleTheme={toggle}
        onPreview={() => setPreview(true)}
        onSignedIn={refresh}
      />
    )
  }

  if (route === 'login') return null

  if (route === 'admin' || route.startsWith('admin/')) {
    return <AdminShell route={route} theme={theme} onToggleTheme={toggle} />
  }

  return (
    <div className={APP_SHELL}>
      <Sidebar
        route={route}
        accountLabel={accountTypeLabel(profile?.accountType)}
        onQuickAdd={() => setLogging(true)}
        open={nav.open}
        onClose={nav.close}
      />

      <div className={WORKSPACE}>
        <TopBar
          theme={theme}
          onToggleTheme={toggle}
          navOpen={nav.open}
          onToggleNav={nav.toggle}
        />
        <main className={CONTENT} key={route}>
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

      {showTour && uid && (
        <Tour
          onFinish={() => {
            markTourSeen(uid)
            setTourDone(uid)
          }}
        />
      )}

      <ChatDock user={user} />

      <QuickAddTrade
        open={logging}
        onClose={() => setLogging(false)}
        onSave={async (trade) => {
          if (!user) return
          await saveTrade(trade)
          reload()
        }}
      />
    </div>
  )
}

export default App
