import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChatDock } from './components/ChatDock'
import { SplashScreen } from './components/SplashScreen'
import { Tour } from './components/Tour'
import { PalettePicker } from './components/PalettePicker'
import { accountIsNew, markTourSeen, tourSeen } from './lib/tourState'
import { QuickAddTrade } from './components/QuickAddTrade'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { appShell, CONTENT, WORKSPACE } from './components/layout'
import { PAGE_PENDING, PAGE_PENDING_BAR } from './components/ui'
import { useNavDrawer } from './lib/useNavDrawer'
import { useCollapsedNav } from './lib/useCollapsedNav'
import {
  navigate,
  rememberDestination,
  takeDestination,
  useHashRoute,
  PUBLIC_ROUTES,
} from './lib/useHashRoute'
import { useAuth } from './lib/useAuth'
import {
  accountTypeLabel,
  useProfile,
  type Profile as ProfileRecord,
} from './lib/profile'
import { saveTrade, useTrades } from './lib/trades'
import {
  markPaletteChosen,
  paletteChosen,
  useTheme,
  type Origin,
  type Palette,
  type Theme,
} from './lib/useTheme'
import { useWarmup } from './lib/useWarmup'
import { labelForRoute } from './navigation'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Placeholder } from './pages/Placeholder'
import { VerifyEmail } from './pages/VerifyEmail'
import type { StoredTrade } from './lib/trades'
import type { AuthUser } from './lib/useAuth'
import {
  hasFeature,
  planFromApi,
  PREVIEW_PLAN,
  routeAllowed,
  setActivePlan,
  usePlan,
} from './lib/entitlements'

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
const Community = lazy(() =>
  import('./pages/Community').then((module) => ({ default: module.Community })),
)
const MyUniversity = lazy(() =>
  import('./pages/MyUniversity').then((module) => ({ default: module.MyUniversity })),
)
const UniversitySettings = lazy(() =>
  import('./pages/UniversitySettings').then((module) => ({
    default: module.UniversitySettings,
  })),
)
const JoinUniversity = lazy(() =>
  import('./pages/JoinUniversity').then((module) => ({
    default: module.JoinUniversity,
  })),
)
const UniversityDocuments = lazy(() =>
  import('./pages/UniversityDocuments').then((module) => ({
    default: module.UniversityDocuments,
  })),
)
const StudentDocument = lazy(() =>
  import('./pages/StudentDocument').then((module) => ({
    default: module.StudentDocument,
  })),
)
const StudentActivity = lazy(() =>
  import('./pages/StudentActivity').then((module) => ({
    default: module.StudentActivity,
  })),
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
  /* Appearance lives on the Settings screen, so the two theme axes and their
     setters have to reach it. They are not on the profile: both are per-device
     (see useTheme.ts), so there is nothing to save and nothing to re-fetch. */
  theme: Theme
  palette: Palette
  onPickPalette: (id: Palette, origin?: Origin) => void
  onToggleTheme: (origin?: Origin) => void
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
  theme,
  palette,
  onPickPalette,
  onToggleTheme,
}: TraderViewProps) {
  // A screen the plan does not include never mounts, so nothing on it fetches
  // in the moment before the redirect lands.
  if (!routeAllowed(route)) return null

  // `university/settings` before `university/<uid>`: "settings" matches the
  // uid pattern perfectly well, so the specific route has to be tried first
  // or a coach opening their own settings gets a student page instead.
  // Where the invitation email lands. Before the uid branch, which would
  // otherwise read "join" as a student id.
  if (route === 'university/join') {
    return <JoinUniversity profile={profile} />
  }

  if (route === 'university/settings') {
    return <UniversitySettings profile={profile} />
  }

  if (route === 'university/documents') {
    return <UniversityDocuments profile={profile} />
  }

  // One document a student is reading. Prefixed so it cannot be mistaken for
  // a student uid, which the next branch matches on the same shape.
  if (route.startsWith('university/doc/')) {
    return (
      <StudentDocument
        id={route.slice('university/doc/'.length)}
        profile={profile}
      />
    )
  }

  // One student's record, at `university/<uid>`. Matched before the switch
  // because the uid is part of the route — the only screen in the trader app
  // that is addressed rather than simply named.
  if (route.startsWith('university/')) {
    const uid = route.slice('university/'.length)
    return <StudentActivity uid={uid} profile={profile} />
  }

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
    case 'community':
      return <Community profile={profile} />
    case 'university':
      return <MyUniversity profile={profile} />
    case 'profile':
      return <Profile user={user} profile={profile} onSaved={reloadProfile} />
    case 'billing':
      return <Billing user={user} profile={profile} onChanged={reloadProfile} />
    case 'templates':
      return <Templates />
    case 'settings':
      return (
        <Settings
          profile={profile}
          onSaved={reloadProfile}
          theme={theme}
          palette={palette}
          onPickPalette={onPickPalette}
          onToggleTheme={onToggleTheme}
        />
      )
    default:
      return <Placeholder title={labelForRoute(route)} />
  }
}

function App() {
  const route = useHashRoute()
  const { theme, palette, toggle, setPalette } = useTheme()
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
  /*
   * Held in state as well as in storage, because the picker is what writes
   * the storage key — reading it back alone could never close the dialog for
   * a browser with site data blocked, and it would reopen on the next render.
   */
  const [pickedTheme, setPickedTheme] = useState(paletteChosen)
  // Escape hatch for browsing the UI without an account, or while the API is
  // unreachable.
  const [preview, setPreview] = useState(false)

  const uid = user?.uid ?? null

  /*
   * What this account is entitled to, pushed into the entitlements store.
   *
   * The store rather than a prop or a context because the plan is read from
   * outside React as well: `apiFetch` checks it before every request, and so
   * do `chat.ts` and `uploads.ts`. Those are the guarantee — hiding a button
   * is only the courtesy — and none of them can call a hook.
   *
   * A layout effect, not an ordinary one, so the write lands between render
   * and paint. Everything plan-derived renders once at the default Free and
   * then again with the real plan; with `useEffect` that second render is
   * after the paint, which shows a paying account a stripped sidebar for a
   * frame. `usePlan()` here also re-renders the tree when the plan changes,
   * which is what makes a plan switch on the billing page take effect without
   * a reload.
   */
  const plan = usePlan()
  useLayoutEffect(() => {
    setActivePlan(preview ? PREVIEW_PLAN : planFromApi(profile?.plan))
  }, [preview, profile?.plan])

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
  /**
   * Whether this account is new enough to be onboarded at all. Both the
   * palette picker and the tour hang off it.
   */
  const onboarding = useMemo(() => {
    if (!signedIn || !uid || preview) return false
    return accountIsNew(isNewAccount, profile?.createdAt ?? null)
  }, [signedIn, uid, preview, isNewAccount, profile?.createdAt])

  /*
   * The palette picker comes first. Asking someone to sit through a tour of
   * a colour scheme they are about to change is the wrong order, and the tour
   * spotlights real elements — running both at once would put two veils on
   * the page.
   */
  const showPicker = onboarding && !pickedTheme

  /*
   * The tour runs once for a new account. Derived rather than held in an
   * effect, so it simply stops being true the moment it is dismissed — and
   * never appears for the preview session, which has no account to remember it
   * against.
   */
  const showTour = useMemo(() => {
    if (!onboarding || !uid || showPicker) return false
    if (tourDone === uid) return false
    return !tourSeen(uid)
  }, [onboarding, uid, showPicker, tourDone])

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
      if (!signedIn && !PUBLIC_ROUTES.has(route)) {
        // Held so signing in returns here rather than to the dashboard.
        rememberDestination(route)
        navigate('landing')
      }
      return
    }

    if (signedIn && !wasSignedIn.current) navigate(takeDestination() ?? HOME_ROUTE)
    if (!signedIn && wasSignedIn.current) navigate('landing')
    if (!signedIn && !PUBLIC_ROUTES.has(route)) {
      rememberDestination(route)
      navigate('landing')
    }

    wasSignedIn.current = signedIn
  }, [pending, signedIn, route])

  // A deep link to a locked screen lands on the dashboard instead. Keyed on
  // the plan as well as the route, so an account that arrives on #/coach
  // before its profile has loaded is moved off it once the plan is known.
  useEffect(() => {
    if (signedIn && !routeAllowed(route, plan)) navigate(HOME_ROUTE)
  }, [signedIn, route, plan])

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
          profile={profile}
          trades={trades}
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
            theme={theme}
            palette={palette}
            onPickPalette={setPalette}
            onToggleTheme={toggle}
          />
          </Suspense>
        </main>
      </div>

      {showPicker && (
        <PalettePicker
          palette={palette}
          theme={theme}
          onPick={setPalette}
          onToggleTheme={toggle}
          onDone={() => {
            markPaletteChosen()
            setPickedTheme(true)
          }}
        />
      )}

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
