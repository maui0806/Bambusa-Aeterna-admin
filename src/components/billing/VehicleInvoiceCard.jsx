function TruckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        d="M3 7h11v8H3V7zm11 2h3l3 3v3h-6V9zM6 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        strokeWidth="2"
      />
    </svg>
  )
}

function ChevronRight({ expanded }) {
  return (
    <svg
      className={[
        'h-5 w-5 text-slate-400 transition-transform duration-200',
        expanded ? 'rotate-90' : '',
      ].join(' ')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function VehicleInvoiceCard({ group, expanded, onToggle }) {
  const driverLabel = group.driverPhone
    ? `Driver: ${group.driverPhone}`
    : null

  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className={[
        'flex w-full items-center gap-4 bg-white p-4 text-left transition',
        expanded ? '' : 'hover:bg-slate-50/50',
      ].join(' ')}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50">
        <TruckIcon />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-900">{group.vehicleNumber}</span>
          {/* {driverLabel ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
              {driverLabel}
            </span>
          ) : null} */}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {group.driverPhone ? (
            <span className="inline-flex items-center gap-1">
              <PhoneIcon />
              {group.driverPhone}
            </span>
          ) : null}
          {group.driverPhone ? <span aria-hidden="true">·</span> : null}
          <span>
            {group.invoiceCount} Invoice{group.invoiceCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Aggregated Amount
        </div>
        <div className="text-xl font-bold text-slate-900">
          ₹ {group.totalRevenue.toLocaleString('en-IN')}
        </div>
      </div>

      <ChevronRight expanded={expanded} />
    </button>
  )
}
