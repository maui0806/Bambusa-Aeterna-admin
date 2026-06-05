import { useEffect, useMemo, useState } from 'react'

import { BillingWorksheet } from '@/components/dashboard/BillingWorksheet'
import { LoadingFeed } from '@/components/dashboard/LoadingFeed'
import { MaterialCatalogModal } from '@/components/dashboard/MaterialCatalogModal'
import { NotificationStack } from '@/components/dashboard/NotificationStack'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { useAuth } from '@/auth/useAuth'
import { useAdminLoadings } from '@/hooks/useAdminLoadings'
import { exportLoadingsCsv, deleteCompletedLoading, updateLoadingStatus } from '@/services/loadingsService'
import { listMaterialCatalog } from '@/services/materialCatalogService'

function isWithinDateRange(createdAt, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true
  if (!createdAt) return false

  const time = createdAt.getTime()
  if (dateFrom) {
    const start = new Date(dateFrom)
    start.setHours(0, 0, 0, 0)
    if (time < start.getTime()) return false
  }
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    if (time > end.getTime()) return false
  }
  return true
}

export default function LiveDashboard() {
  const { user } = useAuth()
  const { loadings, loading, error, stats, notifications, dismissNotification } = useAdminLoadings()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusUpdatingId, setStatusUpdatingId] = useState('')
  const [deleteLoadingId, setDeleteLoadingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [materialCatalog, setMaterialCatalog] = useState([])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return loadings.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false
      if (!isWithinDateRange(row.createdAt, dateFrom, dateTo)) return false
      if (!q) return true
      return (
        row.vehicleNumber.toLowerCase().includes(q) ||
        row.destination.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.loadingId.toLowerCase().includes(q) ||
        row.staffName.toLowerCase().includes(q)
      )
    })
  }, [loadings, search, statusFilter, dateFrom, dateTo])

  const selectedRow = useMemo(
    () => filtered.find((r) => r.id === selected?.id) ?? loadings.find((r) => r.id === selected?.id) ?? null,
    [filtered, loadings, selected],
  )

  async function handleDeleteLoading(row) {
    const confirmed = window.confirm(
      `Delete loading for ${row.vehicleNumber}? The dispatch and materials will be removed from the Live Dashboard. The invoice record will be kept under Billing & Invoices.`,
    )
    if (!confirmed) return

    setActionError('')
    setDeleteLoadingId(row.id)
    try {
      await deleteCompletedLoading(row.id)
      if (selected?.id === row.id) {
        setSelected(null)
      }
    } catch (e) {
      setActionError(e?.message || 'Could not delete loading.')
    } finally {
      setDeleteLoadingId('')
    }
  }

  async function handleStatusChange(row, newStatus) {
    setActionError('')
    setStatusUpdatingId(row.id)
    try {
      await updateLoadingStatus(row.id, newStatus)
    } catch (e) {
      setActionError(e?.message || 'Could not update status.')
    } finally {
      setStatusUpdatingId('')
    }
  }

  useEffect(() => {
    let active = true
    void listMaterialCatalog()
      .then((rows) => {
        if (active) setMaterialCatalog(rows)
      })
      .catch(() => {
        // keep dashboard usable even if archive fetch fails
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-8 text-slate-500">Loading dashboard…</div>
  }

  if (error) {
    return <div className="flex flex-1 items-center justify-center p-8 text-red-600">{error}</div>
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-6">
        <StatsCards stats={stats} />
        {actionError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="min-h-[420px] xl:col-span-3">
            <LoadingFeed
              loadings={filtered}
              selectedId={selectedRow?.id}
              onSelect={setSelected}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClearDateRange={() => {
                setDateFrom('')
                setDateTo('')
              }}
              onExport={() => exportLoadingsCsv(filtered)}
              onStatusChange={handleStatusChange}
              statusUpdatingId={statusUpdatingId}
              onDeleteLoading={handleDeleteLoading}
              deleteLoadingId={deleteLoadingId}
              onManageMaterials={() => setShowMaterialModal(true)}
            />
          </div>
          <div className="min-h-[420px] xl:col-span-2">
            <BillingWorksheet
              key={selectedRow?.id || 'none'}
              loading={selectedRow}
              onDeleteLoading={handleDeleteLoading}
              deleteBusy={Boolean(deleteLoadingId)}
            />
          </div>
        </div>
      </div>
      <MaterialCatalogModal
        open={showMaterialModal}
        materials={materialCatalog}
        adminUid={user?.uid}
        onClose={() => setShowMaterialModal(false)}
        onChanged={() =>
          listMaterialCatalog()
            .then((rows) => setMaterialCatalog(rows))
            .catch(() => {})
        }
      />
      <NotificationStack items={notifications} onDismiss={dismissNotification} />
    </>
  )
}
