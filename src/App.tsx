import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ChatDock } from './components/ChatDock'
import { SplashScreen } from './components/SplashScreen'
import { Tour } from './components/Tour'
import { accountIsNew, markTourSeen, tourSeen } from './lib/tourState'
import { QuickAddTrade } from './components/QuickAddTrade'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { appShell, CONTENT, WORKSPACE } from './components/layout'
import { PAGE_PENDING, PAGE_PENDING_BAR } from './components/ui'
import { useNavDrawer } from './lib/useNavDrawer'
import { useCollapsedNav } from './lib/useCollapsedNav'
import { navigate, useHashRoute, PUBLIC_ROUTES } from './lib/useHashRoute'
import { useAuth } from './lib/useAuth'
import {
  accountTypeLabel,
  useProfile,
  type Profile as ProfileRecord,
} from './lib/profile'
import { saveTrade, useTrades } from './lib/trades'
import { useTheme } from './lib/useTheme'
import { useWarmup } from './lib/useWarmup'
import { labelForRoute } from './navigation'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Placeholder } from './pages/Placeholder'
import { VerifyEmail } from './pages/VerifyEmail'
import type { StoredTrade } from './lib/trades'
import type { AuthUser } from './lib/useAuth'
import { hasFeature, routeAllowed } from './lib/entitlements'

/**
 * Shown while a page's code is on its way.
 *
 * A quiet bar rather than a spinner or a message. Most of these resolve in
 * well under a second on a warm connection, and something that appears and
 * vanishes in that time reads as a flicker rather than as progress — so it
 * fades in only if the wait is long enough to be worth acknowledging.
 */
function PagePending() {
  return (
    <div className={PAGE_PENDING} role="status" aria-label="Loading">
      <span className={PAGE_PENDING_BAR} />
    </div>
  )
}

/*
 * Every page but the dashboard is fetched when it is first opened.
 *
 * The dashboard stays eager because every sign-in lands there — making it
 * a second round trip would put a spinner in front of the one screen that
 * should already be on screen. The rest are weight most sessions never
 * touch: the coach, the admin shell, a settings page opened twice a month.
 */
const Analytics = lazy(() =>
  import('./pages/Analytics').then((module) => ({ default: module.Analytics })),
)
const Billing = lazy(() =>
  import('./pages/Billing').then((module) => ({ default: module.Billing })),
)
const Calendar = lazy(() =>
  import('./pages/Calendar').then((module) => ({ default: module.Calendar })),
)
const AiCoach = lazy(() =>
  import('./pages/AiCoach').then((module) => ({ default: module.AiCoach })),
)
const Profile = lazy(() =>
  import('./pages/Profile').then((module) => ({ default: module.Profile })),
)
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings })),
)
const Templates = lazy(() =>
  import('./pages/Templates').then((module) => ({ default: module.Templates })),
)
const TradeJournal = lazy(() =>
  import('./pages/TradeJournal').then((module) => ({ default: module.TradeJournal })),
)
const AdminShell = lazy(() =>
  import('./pages/admin/AdminShell').then((module) => ({ default: module.AdminShell })),
)


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
  reload: () => void
  onQuickAdd: () => void
  /** Re-fetch the account record. Settings writes to it, and the journal and
   *  the trade form both read their setup list back out of it. */
  reloadProfile: () => void
}

function TraderView({
  route,
  uid,
  user,
  profile,
  trades,
  loading,
  error,
  reload,
  onQuickAdd,
  reloadProfile,
}: TraderViewProps) {
  // A screen the plan does not include never mounts, so nothing on it fetches
  // in the moment before the redirect lands.
  if (!routeAllowed(route)) return null

  switch (route) {
    case 'dashboard':
      return <Dashboard trades={trades} profile={profile} onQuickAdd={onQuickAdd} />
    case 'journal':
      return (
        <TradeJournal
          uid={uid}
          trades={trades}
          loading={loading}
          error={error}
          reload={reload}
          profile={profile}
        />
      )
    case 'analytics':
      return <Analytics trades={trades} profile={profile} />
    case 'calendar':
      return <Calendar trades={trades} profile={profile} />
    case 'coach':
      return <AiCoach user={user} profile={profile} tradeCount={trades.length} />
    case 'profile':
      return <Profile user={user} profile={profile} onSaved={reloadProfile} />
    case 'billing':
      return <Billing user={user} profile={profile} />
    case 'templates':
      return <Templates />
    case 'settings':
      return <Settings profile={profile} onSaved={reloadProfile} />
    default:
      return <Placeholder title={labelForRoute(route)} />
  }
}

function App() {
  const route = useHashRoute()
  const { theme, toggle } = useTheme()
  const { user, confirmed, pending, refresh } = useAuth()
  const {
    profile,
    isNewAccount,
    loading: profileLoading,
    reload: reloadProfile,
  } = useProfile(user)
  const [logging, setLogging] = useState(false)
  const nav = useNavDrawer(route)
  const rail = useCollapsedNav()
  const [tourDone, setTourDone] = useState<string | null>(null)
  // Escape hatch for browsing the UI without an account, or while the API is
  // unreachable.
  const [preview, setPreview] = useState(false)

  const uid = user?.uid ?? null
  const { trades, loading, error, reload } = useTrades(confirmed ? uid : null)
  // Confirmed, not merely signed in. A Google account arrives with Firebase
  // already calling it verified, so that flag cannot be the gate — this one is.
  const signedIn = (Boolean(user) && confirmed) || preview
  const warming = useWarmup(
    !pending && signedIn && !preview && (loading || profileLoading),
  )

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
      if (signedIn && PUBLIC_ROUTES.has(route)) navigate(HOME_ROUTE)
      if (!signedIn && !PUBLIC_ROUTES.has(route)) navigate('landing')
      return
    }

    if (signedIn && !wasSignedIn.current) navigate(HOME_ROUTE)
    if (!signedIn && wasSignedIn.current) navigate('landing')
    if (!signedIn && !PUBLIC_ROUTES.has(route)) navigate('landing')

    wasSignedIn.current = signedIn
  }, [pending, signedIn, route])

  // A deep link to a locked screen lands on the dashboard instead.
  useEffect(() => {
    if (signedIn && !routeAllowed(route)) navigate(HOME_ROUTE)
  }, [signedIn, route])

  /*
   * Held until there is something to show, not merely until the session is
   * known. With a cache from this tab there is nothing to wait for and the
   * splash never appears; without one it stays up rather than letting an
   * empty shell through. Preview has no account and so nothing to fetch.
   */
  if (pending || warming) return <SplashScreen />

  // A signed-in but unconfirmed address gets the gate, never the app.
  if (user && !confirmed && !preview) {
    return (
      <VerifyEmail
        user={user}
        onRecheck={refresh}
        viaGoogle={user.providers.includes('google.com')}
      />
    )
  }

  if (!signedIn && route !== 'login') {
    return <Landing />
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

  if (PUBLIC_ROUTES.has(route)) return null

  if (route === 'admin' || route.startsWith('admin/')) {
    return (
      <Suspense fallback={<PagePending />}>
        <AdminShell route={route} theme={theme} onToggleTheme={toggle} />
      </Suspense>
    )
  }

  return (
    <div className={appShell(rail.collapsed)}>
      <Sidebar
        route={route}
        accountLabel={accountTypeLabel(profile?.accountType)}
        onQuickAdd={() => setLogging(true)}
        open={nav.open}
        onClose={nav.close}
        collapsed={rail.collapsed}
        onToggleCollapse={rail.toggle}
      />

      <div className={WORKSPACE}>
        <TopBar
          theme={theme}
          onToggleTheme={toggle}
          navOpen={nav.open}
          onToggleNav={nav.toggle}
          photoURL={profile?.photoURL}
        />
        <main className={CONTENT} key={route}>
          {/*
            One boundary around the whole page rather than one per page. The
            route key above already remounts on navigation, so a single
            Suspense here covers every lazy page without repeating itself.
          */}
          <Suspense fallback={<PagePending />}>
          <TraderView
            route={route}
            uid={uid}
            user={user}
            profile={profile}
            trades={trades}
            loading={loading}
            error={error}
            reload={reload}
            reloadProfile={reloadProfile}
            onQuickAdd={() => setLogging(true)}
          />
          </Suspense>
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

      {hasFeature('messages') && <ChatDock user={user} />}

      <QuickAddTrade
        open={logging}
        setups={profile?.strategies ?? []}
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
