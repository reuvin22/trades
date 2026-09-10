import { useState } from 'react'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { AdminTopBar } from '../../components/admin/AdminTopBar'
import { QuickAddTrade } from '../../components/QuickAddTrade'
import type { Theme } from '../../lib/useTheme'
import { labelForRoute } from '../../navigation'
import { Placeholder } from '../Placeholder'
import { AdminDashboard } from './AdminDashboard'
import '../../styles/admin.css'

type AdminShellProps = {
  route: string
  theme: Theme
  onToggleTheme: () => void
}

export function AdminShell({ route, theme, onToggleTheme }: AdminShellProps) {
  const [logging, setLogging] = useState(false)

  return (
    <div className="app is-admin">
      <AdminSidebar route={route} onQuickAdd={() => setLogging(true)} />

      <div className="workspace">
        <AdminTopBar theme={theme} onToggleTheme={onToggleTheme} />
        <main className="content" key={route}>
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
