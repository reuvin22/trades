import {
  ADMIN_GRID,
  CRUMBS,
  PAGE_ACTIONS,
  PAGE_HEAD,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
} from '../../components/ui'
import { AdminStats } from '../../components/admin/AdminStats'
import { BrokerStatus } from '../../components/admin/BrokerStatus'
import { PlatformActivity } from '../../components/admin/PlatformActivity'
import { RevenueGrowth } from '../../components/admin/RevenueGrowth'
import { DownloadIcon, PlusIcon } from '../../components/Icons'

export function AdminDashboard() {
  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <p className={CRUMBS}>
            Admin <span>/</span> Platform Overview
          </p>
          <h2 className={`${PAGE_TITLE} mt-6`}>Dashboard</h2>
        </div>

        <div className={PAGE_ACTIONS}>
          <button type="button" className={PILL}>
            <DownloadIcon />
            Export Data
          </button>
          <button type="button" className={`${PILL} ${PILL_ACCENT}`}>
            <PlusIcon size={14} />
            New Integration
          </button>
        </div>
      </div>

      <AdminStats />

      <div className={ADMIN_GRID}>
        <RevenueGrowth />
        <PlatformActivity />
      </div>

      <BrokerStatus />
    </>
  )
}
