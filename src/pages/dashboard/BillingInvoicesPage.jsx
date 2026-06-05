import { useEffect, useMemo, useState } from 'react'

import { BillingFilters } from '@/components/billing/BillingFilters'
import { VehicleInvoiceAccordionItem } from '@/components/billing/VehicleInvoiceAccordionItem'
import {
  filterVehicleGroups,
  groupInvoicesByVehicle,
  subscribeAdminInvoices,
} from '@/services/invoicesService'

const PAGE_SIZE = 8

export default function BillingInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedVehicleKey, setExpandedVehicleKey] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const unsub = subscribeAdminInvoices(
      (rows) => {
        setInvoices(rows)
        setLoading(false)
        setError('')
      },
      (err) => {
        setError(err?.message || 'Could not load invoice records.')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const vehicleGroups = useMemo(() => groupInvoicesByVehicle(invoices), [invoices])

  const filteredGroups = useMemo(
    () => filterVehicleGroups(vehicleGroups, { search, searchCategory, statusFilter }),
    [vehicleGroups, search, searchCategory, statusFilter],
  )

  const pageCount = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pagedGroups = filteredGroups.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [search, searchCategory, statusFilter])

  useEffect(() => {
    if (expandedVehicleKey && !filteredGroups.some((g) => g.vehicleKey === expandedVehicleKey)) {
      setExpandedVehicleKey('')
    }
  }, [filteredGroups, expandedVehicleKey])

  function handleToggleVehicle(vehicleKey) {
    setExpandedVehicleKey((prev) => (prev === vehicleKey ? '' : vehicleKey))
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
        Loading billing records…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-red-600">{error}</div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">All Invoices by Vehicle</h2>
        <p className="mt-1 text-sm text-slate-500">
          Consolidated view of logistics billing grouped by vehicle fleet. Click a vehicle to expand
          its invoice history below the row.
        </p>
      </div>

      <BillingFilters
        search={search}
        onSearchChange={setSearch}
        searchCategory={searchCategory}
        onSearchCategoryChange={setSearchCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        {pagedGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No invoice records yet. Generate invoices from the Live Dashboard for registered
            vehicles.
          </div>
        ) : (
          pagedGroups.map((group) => (
            <VehicleInvoiceAccordionItem
              key={group.vehicleKey}
              group={group}
              expanded={expandedVehicleKey === group.vehicleKey}
              onToggle={handleToggleVehicle}
            />
          ))
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-sm text-slate-600">
        <span>
          Showing {filteredGroups.length} vehicle group{filteredGroups.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
