import type { ComponentType } from 'react'
import {
  ActivityIcon,
  AnalyticsIcon,
  AuditIcon,
  CalendarIcon,
  CoachIcon,
  CommunityIcon,
  DashboardIcon,
  JournalIcon,
  OrgIcon,
  PlugIcon,
  SettingsIcon,
  TemplateIcon,
  SubscriptionIcon,
  UniversityIcon,
  UsersIcon,
  WalletIcon,
} from './components/Icons'
import { hasFeature, type Feature, type PlanId } from './lib/entitlements'

export type IconComponent = ComponentType<{ size?: number; className?: string }>

export type NavItem = {
  route: string
  label: string
  icon: IconComponent
  /** Shown, but not reachable — the screen behind it is not built yet. */
  disabled?: boolean
  /** Hidden entirely when the active plan does not include it. */
  feature?: Feature
}

export type NavSection = {
  heading?: string
  items: NavItem[]
}

/**
 * A category in the sidebar.
 *
 * Deliberately has no `route`: a category is a disclosure, not a destination.
 * Giving one a route of its own would mean a click both navigated and
 * expanded, and the page you landed on would be an arbitrary pick from its
 * own children.
 */
export type NavGroup = {
  id: string
  label: string
  icon: IconComponent
  children: NavItem[]
}

export type NavEntry = NavItem | NavGroup

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

/*
 * The sidebar tree.
 *
 * Categories are named so they never repeat a child's label — a "Journal"
 * holding a "Trade Journal" reads like a mistake — and "Workspace" rather
 * than the more obvious "Setup", because a setup in this product is a
 * strategy (trade.setup, "By setup", "Setup Efficiency") and the word is
 * already spoken for.
 */
const TRADER_TREE: NavEntry[] = [
  { route: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  {
    id: 'trading',
    label: 'Trading',
    icon: JournalIcon,
    children: [
      { route: 'journal', label: 'Trade Journal', icon: JournalIcon },
      { route: 'calendar', label: 'Calendar', icon: CalendarIcon },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: AnalyticsIcon,
    children: [
      { route: 'analytics', label: 'Analytics', icon: AnalyticsIcon, feature: 'analytics' },
      { route: 'coach', label: 'AI Coach', icon: CoachIcon, feature: 'coach' },
    ],
  },
  /*
   * Deliberately not gated as a whole.
   *
   * The feed belongs to `messages`, the same feature chat does — it is the
   * same promise about talking to other traders. My University is not: what
   * it shows turns on `account_type`, which is a different axis from the plan
   * and one this tree cannot see. The page answers for itself instead, and an
   * individual account gets a reason rather than a missing menu item.
   */
  {
    id: 'community',
    label: 'Community',
    icon: CommunityIcon,
    children: [
      { route: 'community', label: 'Feed', icon: CommunityIcon, feature: 'messages' },
      { route: 'university', label: 'My University', icon: UniversityIcon },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: SettingsIcon,
    // Templates sits here rather than under Trading because it configures
    // what a page shows, not what the account did.
    children: [
      { route: 'settings', label: 'Settings', icon: SettingsIcon },
      { route: 'templates', label: 'Templates', icon: TemplateIcon },
    ],
  },
]

/**
 * The sidebar: what a plan includes.
 *
 * A category whose children are all gated out is dropped with them. Leaving
 * an empty "Insights" on a plan with neither analytics nor the coach would be
 * a disclosure that opens onto nothing.
 *
 * A function of the plan rather than a constant, because the plan is not
 * known when this module is imported — it arrives with the profile. Built
 * once per plan change by the caller, which is cheap: the tree is a dozen
 * entries.
 */
export function traderNav(plan: PlanId): NavEntry[] {
  const allowed = (item: NavItem) =>
    item.feature === undefined || hasFeature(item.feature, plan)

  return TRADER_TREE.flatMap((entry): NavEntry[] => {
    if (!isGroup(entry)) return allowed(entry) ? [entry] : []

    const children = entry.children.filter(allowed)
    return children.length === 0 ? [] : [{ ...entry, children }]
  })
}

/** Every destination in the tree, flattened — the tree itself is the only
 *  place a route and its label are written down. */
const ALL_TRADER_NAV: NavItem[] = TRADER_TREE.flatMap((entry) =>
  isGroup(entry) ? entry.children : [entry],
)

/**
 * Which category holds a route, so the sidebar can open it on arrival.
 *
 * Reads the whole tree rather than one plan's view of it. Where a route sits
 * is a fact about the tree and does not change with the plan, and a locked
 * route never reaches here anyway — `App` redirects off one before it renders.
 */
export function groupOfRoute(route: string): string | null {
  for (const entry of TRADER_TREE) {
    if (isGroup(entry) && entry.children.some((child) => child.route === route)) {
      return entry.id
    }
  }
  return null
}

export const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { route: 'admin', label: 'Dashboard', icon: DashboardIcon },
      { route: 'admin/users', label: 'Users', icon: UsersIcon },
      { route: 'admin/organizations', label: 'Organizations', icon: OrgIcon },
      { route: 'admin/accounts', label: 'Trading Accounts', icon: WalletIcon },
      { route: 'admin/integrations', label: 'Broker Integrations', icon: PlugIcon },
      { route: 'admin/subscriptions', label: 'Subscriptions', icon: SubscriptionIcon },
    ],
  },
  {
    heading: 'System Monitoring',
    items: [
      { route: 'admin/ai-insights', label: 'AI Insights', icon: CoachIcon },
      { route: 'admin/health', label: 'System Health', icon: ActivityIcon },
      { route: 'admin/audit', label: 'Audit Logs', icon: AuditIcon },
      { route: 'admin/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

const EXTRA_LABELS: Record<string, string> = {
  profile: 'My Profile',
  billing: 'Billing',
}

export function labelForRoute(route: string): string {
  const trader = ALL_TRADER_NAV.find((item) => item.route === route)
  if (trader) return trader.label

  if (route in EXTRA_LABELS) return EXTRA_LABELS[route]

  const admin = ADMIN_NAV.flatMap((section) => section.items).find(
    (item) => item.route === route,
  )
  return admin?.label ?? 'Not Found'
}
