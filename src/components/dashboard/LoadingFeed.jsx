import { STATUS_LABELS, STATUS_STYLES } from '@/constants/loading'

import { LoadingRowActions } from '@/components/dashboard/LoadingRowActions'

export function LoadingFeed({
  loadings,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDateRange,
  onExport,
  onStatusChange,
  statusUpdatingId,
  onDeleteLoading,
  deleteLoadingId,
  onManageMaterials,
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Live Entry Feed</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
            />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs"
            />
            {dateFrom || dateTo ? (
              <button
                type="button"
                onClick={onClearDateRange}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                Clear
              </button>
            ) : null}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="INVOICED">Invoiced</option>
            <option value="TRANSIT">In Transit</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            Export
          </button>
          <button
            type="button"
            onClick={onManageMaterials}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Manage Materials
          </button>
        </div>
      </div>

      <div className="border-b border-slate-100 px-4 py-2">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vehicles, destination, customer…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Vehicle No</th>
              <th className="px-4 py-2 font-medium">Staff / Destination</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No dispatches match your filters.
                </td>
              </tr>
            ) : (
              loadings.map((row) => {
                const selected = row.id === selectedId
                const statusClass = STATUS_STYLES[row.status] || STATUS_STYLES.PENDING
                const busy = statusUpdatingId === row.id
                const deleteBusy = deleteLoadingId === row.id
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row)}
                    className={[
                      'cursor-pointer border-t border-slate-100 transition',
                      selected ? 'bg-emerald-50/80' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 font-semibold text-emerald-800">{row.vehicleNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {row.staffName || row.customerName || '—'}
                      </div>
                      <div className="text-xs text-slate-500">{row.destination}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                      >
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LoadingRowActions
                        row={row}
                        busy={busy}
                        deleteBusy={deleteBusy}
                        onStatusChange={onStatusChange}
                        onDelete={onDeleteLoading}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
