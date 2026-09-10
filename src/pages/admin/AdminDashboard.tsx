import { AdminStats } from '../../components/admin/AdminStats'
import { BrokerStatus } from '../../components/admin/BrokerStatus'
import { PlatformActivity } from '../../components/admin/PlatformActivity'
import { RevenueGrowth } from '../../components/admin/RevenueGrowth'
import { DownloadIcon, PlusIcon } from '../../components/Icons'

export function AdminDashboard() {
  return (
    <>
      <div className="page-head">
        <div>
          <p className="crumbs">
            Admin <span>/</span> Platform Overview
          </p>
          <h2 className="page-title">Dashboard</h2>
        </div>

        <div className="page-actions">
          <button type="button" className="pill">
            <DownloadIcon />
            Export Data
          </button>
          <button type="button" className="pill is-accent">
            <PlusIcon size={14} />
            New Integration
          </button>
        </div>
      </div>

      <AdminStats />

      <div className="admin-grid">
        <RevenueGrowth />
        <PlatformActivity />
      </div>

      <BrokerStatus />
    </>
  )
}
