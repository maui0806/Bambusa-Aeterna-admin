import { useEffect, useMemo, useState } from 'react'

import { STATUS_LABELS, STATUS_STYLES } from '@/constants/loading'
import { PrimaryButton } from '@/components/FormControls'
import {
  applyMaterialPricing,
  calcBillingTotals,
  calcLineTotal,
  fetchLoadingMaterials,
  saveBillingDraft,
  updateLoadingStatus,
} from '@/services/loadingsService'
import { dispatchViaWhatsApp, generateInvoicePdf } from '@/services/invoiceService'
import { getCallableErrorMessage } from '@/utils/callableError'
import { openInvoicePdf } from '@/utils/openInvoicePdf'
import { normalizePhone, phonesMatch } from '@/utils/phone'

function BillingWorksheetForm({ loading, onDeleteLoading, deleteBusy }) {
  const [materials, setMaterials] = useState([])
  const [customerName, setCustomerName] = useState(loading.customerName || '')
  const [customerPhone, setCustomerPhone] = useState(loading.customerPhone || '')
  const [adjustments, setAdjustments] = useState(loading.adjustments || 0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isLocked = ['INVOICED', 'TRANSIT', 'COMPLETED'].includes(loading.status)
  const canBill = loading.status === 'PENDING'
  const canMarkCompleted = loading.status === 'INVOICED' || loading.status === 'TRANSIT'
  const canDelete = loading.status === 'COMPLETED'
  const hasInvoice = Boolean(loading.invoiceId)

  useEffect(() => {
    let cancelled = false
    fetchLoadingMaterials(loading.id)
      .then((rows) => {
        if (!cancelled) setMaterials(rows.map(applyMaterialPricing))
      })
      .catch(() => {
        if (!cancelled) setError('Could not load materials.')
      })
    return () => {
      cancelled = true
    }
  }, [loading.id])

  const totals = useMemo(
    () => calcBillingTotals(materials, adjustments),
    [materials, adjustments],
  )

  const customerMatchesDriver =
    customerPhone.trim() &&
    loading.driverPhone &&
    phonesMatch(customerPhone, loading.driverPhone)

  const inputClass = isLocked
    ? 'mt-1 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700'
    : 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'

  function updateMaterialRatePerPiece(id, value) {
    if (isLocked) return
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        return applyMaterialPricing({ ...m, ratePerPiece: Number(value) || 0 })
      }),
    )
  }

  async function persistBilling() {
    if (!customerPhone.trim()) {
      throw new Error('Customer / factory WhatsApp number is required.')
    }
    if (customerMatchesDriver) {
      throw new Error(
        'Customer WhatsApp must be different from the driver number entered by staff.',
      )
    }
    return saveBillingDraft(loading.id, {
      customerName,
      customerPhone: normalizePhone(customerPhone),
      materials,
      adjustments,
    })
  }

  async function onGeneratePdf() {
    setBusy(true)
    setError('')
    try {
      await persistBilling()
      const res = await generateInvoicePdf(loading.id)
      setMessage(res?.message || 'Invoice saved.')
    } catch (e) {
      setError(getCallableErrorMessage(e, 'PDF generation failed'))
    } finally {
      setBusy(false)
    }
  }

  async function onDispatchWa() {
    setBusy(true)
    setError('')
    try {
      await persistBilling()
      if (!hasInvoice) {
        throw new Error('Generate the invoice PDF before dispatching via WhatsApp.')
      }
      const res = await dispatchViaWhatsApp(loading.id)
      setMessage(
        res?.message ||
          `Dispatched to customer WhatsApp ${normalizePhone(customerPhone)}.`,
      )
    } catch (e) {
      setError(getCallableErrorMessage(e, 'Dispatch failed'))
    } finally {
      setBusy(false)
    }
  }

  async function onMarkCompleted() {
    setBusy(true)
    setError('')
    try {
      await updateLoadingStatus(loading.id, 'COMPLETED')
      setMessage('Delivery marked as completed.')
    } catch (e) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!onDeleteLoading) return
    setBusy(true)
    setError('')
    try {
      await onDeleteLoading(loading)
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function onViewInvoicePdf() {
    if (!loading.invoicePdfUrl && !loading.invoicePdfPath) return
    await openInvoicePdf(loading.invoicePdfUrl, loading.invoicePdfPath)
  }

  const statusClass = STATUS_STYLES[loading.status] || STATUS_STYLES.PENDING

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-slate-500">DISPATCH ID</div>
            <div className="font-semibold text-slate-900">{loading.loadingId}</div>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {STATUS_LABELS[loading.status]}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Submitted by {loading.staffName} · {loading.warehouseName}
        </div>
        {/* {isLocked ? (
          <p className="mt-2 text-xs text-amber-700">
            Invoice issued — billing is read-only. Resend is not available for this vehicle.
          </p>
        ) : null} */}
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        {message ? (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Customer / Factory Name</span>
            <input
              className={inputClass}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Factory or customer name"
              readOnly={isLocked}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Customer WhatsApp No.</span>
            <input
              className={inputClass}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              readOnly={isLocked}
            />
          </label>
        </div>

        {loading.driverPhone ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-medium text-slate-700">Driver contact (staff entry):</span>{' '}
            {loading.driverPhone}
            <span className="block text-slate-500">Not used for customer messaging.</span>
          </div>
        ) : null}

        {customerMatchesDriver && !isLocked ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Customer WhatsApp matches the driver number. Enter the factory/customer number instead.
          </div>
        ) : null}

        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Material Details</div>
          {!isLocked ? (
            <p className="mb-2 text-[11px] text-slate-500">
              Enter unit price per piece only. Rate per bundle and line total are calculated automatically.
            </p>
          ) : null}
          <div className="space-y-3">
            {materials.map((m) => {
              const priced = applyMaterialPricing(m)
              return (
                <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <div className="font-medium text-slate-800">{m.materialName}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {m.bundles} bundles × {m.piecesPerBundle} pcs/bundle = {priced.totalPieces} pcs
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs">
                      Unit price / piece (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm disabled:bg-slate-50"
                        value={m.ratePerPiece || ''}
                        onChange={(e) => updateMaterialRatePerPiece(m.id, e.target.value)}
                        readOnly={isLocked}
                        disabled={isLocked}
                      />
                    </label>
                    <div className="text-xs">
                      <span className="text-slate-500">Rate / bundle (auto)</span>
                      <div className="mt-1 rounded border border-dashed border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700">
                        ₹ {priced.ratePerBundle.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-right text-sm font-semibold text-emerald-700">
                    Line total: ₹ {calcLineTotal(m).toLocaleString('en-IN')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Adjustments (₹)</span>
          <input
            type="number"
            className={inputClass}
            value={adjustments}
            onChange={(e) => setAdjustments(Number(e.target.value) || 0)}
            readOnly={isLocked}
          />
        </label>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹ {totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {adjustments ? (
            <div className="mt-1 flex justify-between text-slate-600">
              <span>Adjustments</span>
              <span>₹ {Number(adjustments).toLocaleString('en-IN')}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>Total Payable</span>
            <span className="text-emerald-700">₹ {totals.totalPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 p-4">
        {canBill ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onGeneratePdf}
              className="w-full rounded-xl border border-emerald-600 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              {busy ? 'Working…' : hasInvoice ? 'Update PDF' : 'Generate PDF'}
            </button>
            <PrimaryButton type="button" disabled={busy} onClick={onDispatchWa}>
              {busy ? 'Working…' : 'Dispatch via WA'}
            </PrimaryButton>
          </>
        ) : null}

        {canMarkCompleted ? (
          <PrimaryButton type="button" disabled={busy} onClick={onMarkCompleted}>
            {busy ? 'Working…' : 'Mark delivery completed'}
          </PrimaryButton>
        ) : null}

        {canDelete ? (
          <button
            type="button"
            disabled={busy || deleteBusy}
            onClick={handleDelete}
            className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {busy || deleteBusy ? 'Working…' : 'Delete loading'}
          </button>
        ) : null}

        {loading.invoicePdfUrl || loading.invoicePdfPath ? (
          <button
            type="button"
            onClick={onViewInvoicePdf}
            className="block w-full text-center text-xs font-medium text-emerald-700 hover:underline"
          >
            View invoice PDF
          </button>
        ) : null}

        {loading.trackingUrl ? (
          <a
            href={loading.trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs text-slate-500 hover:underline"
          >
            Preview customer portal
          </a>
        ) : null}
      </div>
    </div>
  )
}

export function BillingWorksheet({ loading, onDeleteLoading, deleteBusy }) {
  if (!loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Select a vehicle from the live feed to open the invoicing worksheet.
      </div>
    )
  }

  return (
    <BillingWorksheetForm
      key={`${loading.id}-${loading.status}`}
      loading={loading}
      onDeleteLoading={onDeleteLoading}
      deleteBusy={deleteBusy}
    />
  )
}
