function formatCurrency(value) {
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(1)}L`
  return `₹ ${value.toLocaleString('en-IN')}`
}

function StatCard({ title, value, hint, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {hint ? (
        <div className={`mt-1 text-xs font-medium ${accent || 'text-slate-500'}`}>{hint}</div>
      ) : null}
    </div>
  )
}

export function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Today's Dispatches"
        value={stats.todayDispatches}
        hint="+ live"
        accent="text-emerald-600"
      />
      <StatCard
        title="Pending Invoices"
        value={formatCurrency(stats.pendingInvoicesValue)}
        hint="Awaiting billing"
      />
      <StatCard
        title="Sent Invoices"
        value={stats.sentInvoices}
        hint="Dispatched · last 7 days"
        accent="text-emerald-600"
      />
      <StatCard title="Active Vehicles" value={stats.activeVehicles} hint="On-road tracking" />
    </div>
  )
}
