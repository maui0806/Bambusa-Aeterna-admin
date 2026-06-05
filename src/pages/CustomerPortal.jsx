import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

import logo from '@/assets/logo.jpg'
import { mapLoadingDoc, mapMaterialDoc } from '@/services/loadingsService'
import { db } from '@/config/firebase'
import { openInvoicePdf } from '@/utils/openInvoicePdf'

const STATIC_TOLLS = [
  { name: 'Kherki Daula Toll, Gurugram', time: '11:45 AM', active: true },
  { name: 'DND Flyway, Delhi', time: '10:15 AM', active: false },
  { name: 'Badarpur Border, Faridabad', time: '09:45 AM', active: false },
]

export default function CustomerPortal() {
  const { loadingId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entry, setEntry] = useState(null)
  const [materials, setMaterials] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const snap = await getDoc(doc(db, 'loadings', loadingId))
        if (!snap.exists()) {
          setError('This tracking link is invalid or has expired.')
          return
        }
        const data = mapLoadingDoc(snap.id, snap.data())
        if (!data.publicTrackingEnabled) {
          setError('This dispatch is not yet available for tracking.')
          return
        }
        setEntry(data)
        const matSnap = await getDocs(
          query(collection(db, 'loadings', loadingId, 'materials'), orderBy('sortOrder', 'asc')),
        )
        setMaterials(matSnap.docs.map((d) => mapMaterialDoc(d.id, d.data())))
      } catch (e) {
        setError(e?.message || 'Could not load tracking information.')
      } finally {
        setLoading(false)
      }
    }
    if (loadingId) load()
  }, [loadingId])

  async function onViewInvoicePdf() {
    if (!entry?.invoicePdfUrl && !entry?.invoicePdfPath) return
    await openInvoicePdf(entry.invoicePdfUrl, entry.invoicePdfPath)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading your dispatch…
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow">
          <p className="text-red-600">{error || 'Not found'}</p>
        </div>
      </div>
    )
  }

  const totalPieces = materials.reduce((s, m) => s + m.totalPieces, 0)

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Bambusa" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-bold text-emerald-700">Bambusa</span>
        </div>
        <span className="text-xs font-medium text-emerald-600">Live Track</span>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        <section className="overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-lg">
          <div className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-90">Ongoing Dispatch</div>
            <div className="mt-2 text-2xl font-bold tracking-wide">{entry.vehicleNumber}</div>
            <div className="mt-3 rounded-xl bg-emerald-700/60 p-3">
              <div className="text-xs opacity-80">Current Location</div>
              <div className="font-semibold">Kherki Daula Toll, Gurugram</div>
              <div className="mt-1 text-xs opacity-75">Static preview — live FASTag tracking coming soon</div>
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span>ETA: 02:30 PM Today</span>
              <span>Insured Cargo</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Recent Toll Crossings</h2>
          <p className="text-xs text-slate-500">Updated 2 mins ago (sample data)</p>
          <ul className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
            {STATIC_TOLLS.map((t) => (
              <li key={t.name} className="relative">
                <span
                  className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${t.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                />
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-slate-500">{t.time}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Loading Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {materials.map((m) => (
              <li key={m.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
                <span>{m.materialName}</span>
                <span className="text-slate-500">
                  {m.bundles} bundles · <span className="font-semibold text-emerald-700">{m.totalPieces} pcs</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-2 font-semibold">
            <span>Total Cargo</span>
            <span className="text-emerald-700">{totalPieces} Pieces</span>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Invoice &amp; Billing</h2>
          <div className="mt-2 text-sm text-slate-600">
            {entry.invoiceNumber || entry.loadingId}
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹ {entry.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {entry.adjustments ? (
              <div className="flex justify-between text-slate-600">
                <span>Adjustments</span>
                <span>₹ {Number(entry.adjustments).toLocaleString('en-IN')}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-emerald-700">
              <span>Total Payable</span>
              <span>₹ {entry.totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {entry.invoicePdfUrl || entry.invoicePdfPath ? (
            <button
              type="button"
              onClick={onViewInvoicePdf}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View invoice PDF
            </button>
          ) : null}
        </section>

        <p className="text-center text-xs text-slate-500">
          Order Reference: {entry.loadingId} — Sent via Bambusa Dispatch
        </p>
      </main>
    </div>
  )
}
