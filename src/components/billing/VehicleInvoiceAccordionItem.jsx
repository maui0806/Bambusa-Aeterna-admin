import { InvoiceRecordsTable } from '@/components/billing/InvoiceRecordsTable'
import { VehicleInvoiceCard } from '@/components/billing/VehicleInvoiceCard'

export function VehicleInvoiceAccordionItem({ group, expanded, onToggle }) {
  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border bg-white shadow-sm transition',
        expanded
          ? 'border-emerald-300 ring-2 ring-emerald-500/20'
          : 'border-slate-200 hover:border-emerald-200',
      ].join(' ')}
    >
      <VehicleInvoiceCard
        group={group}
        expanded={expanded}
        onToggle={() => onToggle(group.vehicleKey)}
      />

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/40">
          <InvoiceRecordsTable embedded invoices={group.invoices} vehicleNumber={group.vehicleNumber} />
        </div>
      ) : null}
    </div>
  )
}
