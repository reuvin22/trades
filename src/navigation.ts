import type { ComponentType } from 'react'
import {
  ActivityIcon,
  AnalyticsIcon,
  AuditIcon,
  CalendarIcon,
  CoachIcon,
  DashboardIcon,
  JournalIcon,
  OrgIcon,
  PlugIcon,
  SettingsIcon,
  TemplateIcon,
  SubscriptionIcon,
  UsersIcon,
  WalletIcon,
} from './components/Icons'

import { hasFeature, type Feature } from './lib/entitlements'
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

const ALL_TRADER_NAV: NavItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { route: 'journal', label: 'Trade Journal', icon: JournalIcon },
  { route: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { route: 'analytics', label: 'Analytics', icon: AnalyticsIcon, feature: 'analytics' },
  { route: 'coach', label: 'AI Coach', icon: CoachIcon, feature: 'coach' },
  // Next to Settings, because it is one: what a page shows, rather than what
  // the account is.
  { route: 'templates', label: 'Templates', icon: TemplateIcon },
  { route: 'settings', label: 'Settings', icon: SettingsIcon },
]

/** The sidebar: what the active plan includes. */
export const TRADER_NAV = ALL_TRADER_NAV.filter(
  (item) => item.feature === undefined || hasFeature(item.feature),
)

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
