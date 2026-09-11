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
  SubscriptionIcon,
  UsersIcon,
  WalletIcon,
} from './components/Icons'

export type IconComponent = ComponentType<{ size?: number; className?: string }>

export type NavItem = {
  route: string
  label: string
  icon: IconComponent
}

export type NavSection = {
  heading?: string
  items: NavItem[]
}

export const TRADER_NAV: NavItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { route: 'journal', label: 'Trade Journal', icon: JournalIcon },
  { route: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { route: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
  { route: 'coach', label: 'AI Coach', icon: CoachIcon },
  { route: 'settings', label: 'Settings', icon: SettingsIcon },
]

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
  const trader = TRADER_NAV.find((item) => item.route === route)
  if (trader) return trader.label

  if (route in EXTRA_LABELS) return EXTRA_LABELS[route]

  const admin = ADMIN_NAV.flatMap((section) => section.items).find(
    (item) => item.route === route,
  )
  return admin?.label ?? 'Not Found'
}
