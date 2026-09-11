import { useState } from 'react'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { AdminTopBar } from '../../components/admin/AdminTopBar'
import { ADMIN_SHELL, CONTENT, WORKSPACE } from '../../components/layout'
import { QuickAddTrade } from '../../components/QuickAddTrade'
import { useNavDrawer } from '../../lib/useNavDrawer'
import { labelForRoute } from '../../navigation'
import type { Theme } from '../../lib/useTheme'
import { AdminDashboard } from './AdminDashboard'
import { Placeholder } from '../Placeholder'

type AdminShellProps = {
  route: string
  theme: Theme
  onToggleTheme: () => void
}

export function AdminShell({ route, theme, onToggleTheme }: AdminShellProps) {
  const [logging, setLogging] = useState(false)
  const nav = useNavDrawer(route)

  return (
    <div className={ADMIN_SHELL}>
      <AdminSidebar
        route={route}
        onQuickAdd={() => setLogging(true)}
        open={nav.open}
        onClose={nav.close}
      />

      <div className={WORKSPACE}>
        <AdminTopBar
          theme={theme}
          onToggleTheme={onToggleTheme}
          navOpen={nav.open}
          onToggleNav={nav.toggle}
        />
        <main className={CONTENT} key={route}>
          {route === 'admin' ? (
            <AdminDashboard />
          ) : (
            <Placeholder title={labelForRoute(route)} />
          )}
        </main>
      </div>

      <QuickAddTrade
        open={logging}
        onClose={() => setLogging(false)}
        onSave={(trade) => console.info('Trade logged', trade)}
      />
    </div>
  )
}
