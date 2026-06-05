import { BILLING_SHIPMENT_LABELS, BILLING_SHIPMENT_STYLES } from '@/constants/billing'
import { formatBillingDateTime, formatLoadingDateTime } from '@/services/invoicesService'
import { resolveTrackingUrl } from '@/utils/customerPortalUrl'
import { openInvoicePdf } from '@/utils/openInvoicePdf'

function PdfIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PortalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ActionIconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function InvoiceRecordsTable({ invoices, vehicleNumber, embedded = false }) {
  if (!invoices.length) {
    return (
      <div
        className={[
          'p-8 text-center text-sm text-slate-500',
          embedded ? '' : 'rounded-xl border border-dashed border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        No invoices match your filters for this vehicle.
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'}>
      {!embedded ? (
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Invoice records — {vehicleNumber}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Detailed billing history for this vehicle (preserved even if loading was removed from Live
            Dashboard).
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Invoice ID</th>
              {/* <th className="px-4 py-2.5 font-medium">Issued</th> */}
              <th className="px-4 py-2.5 font-medium">Loading Date &amp; Time</th>
              <th className="px-4 py-2.5 font-medium">Staff</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Customer Phone</th>
              <th className="px-4 py-2.5 font-medium text-right">Qty (pcs)</th>
              <th className="px-4 py-2.5 font-medium text-right">Total</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-center font-medium">Links</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const statusClass =
                BILLING_SHIPMENT_STYLES[inv.shipmentStatus] || BILLING_SHIPMENT_STYLES.PENDING
              const statusLabel =
                BILLING_SHIPMENT_LABELS[inv.shipmentStatus] || inv.shipmentStatus
              const hasPdf = Boolean(inv.invoicePdfUrl || inv.invoicePdfPath)
              const portalUrl = resolveTrackingUrl(inv.trackingUrl, inv.loadingDocId, {
                loadingArchived: inv.loadingArchived,
              })

              return (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{inv.invoiceNumber || inv.id}</div>
                    {inv.loadingId ? (
                      <div className="text-xs text-slate-500">{inv.loadingId}</div>
                    ) : null}
                    {inv.loadingArchived ? (
                      <div className="mt-0.5 text-[10px] font-medium text-amber-700">Archived loading</div>
                    ) : null}
                  </td>
                  {/* <td className="px-4 py-3 text-slate-600">{formatBillingDateTime(inv.invoiceIssuedAt)}</td> */}
                  <td className="px-4 py-3 text-slate-600">
                    { inv.loadingDateTime ? formatLoadingDateTime(inv.loadingDateTime) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{inv.staffName || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{inv.customerName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.customerPhone || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {inv.totalPieces.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    ₹ {inv.totalPayable.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <ActionIconButton
                        label="View invoice PDF"
                        disabled={!hasPdf}
                        onClick={() => openInvoicePdf(inv.invoicePdfUrl, inv.invoicePdfPath)}
                      >
                        <PdfIcon />
                      </ActionIconButton>
                      <ActionIconButton
                        label={
                          portalUrl
                            ? 'Open customer portal'
                            : 'Customer portal unavailable (loading removed)'
                        }
                        disabled={!portalUrl}
                        onClick={() => {
                          if (portalUrl) window.open(portalUrl, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <PortalIcon />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
