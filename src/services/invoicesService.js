import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'

import { db } from '@/config/firebase'

function tsToDate(value) {
  if (value instanceof Timestamp) return value.toDate()
  if (typeof value === 'string') return new Date(value)
  return null
}

export function normalizeVehicleKey(vehicleNumber) {
  return String(vehicleNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function mapInvoiceDoc(id, data) {
  const generatedAt = tsToDate(data.generatedAt)
  const dispatchedAt = tsToDate(data.dispatchedAt)
  const archivedAt = tsToDate(data.archivedAt)
  const updatedAt = tsToDate(data.updatedAt)
  const materials = Array.isArray(data.materials) ? data.materials : []
  const totalPiecesFromMaterials = materials.reduce(
    (sum, m) => sum + Number(m.totalPieces ?? 0),
    0,
  )
  const totalBundlesFromMaterials = materials.reduce(
    (sum, m) => sum + Number(m.bundles ?? 0),
    0,
  )

  return {
    id,
    loadingDocId: data.loadingDocId ?? '',
    loadingId: data.loadingId ?? '',
    invoiceNumber: data.invoiceNumber ?? '',
    vehicleNumber: data.vehicleNumber ?? '',
    vehicleKey: normalizeVehicleKey(data.vehicleNumber),
    customerName: data.customerName ?? '',
    customerPhone: data.customerPhone ?? '',
    destination: data.destination ?? '',
    staffName: data.staffName ?? '',
    driverPhone: data.driverPhone ?? '',
    warehouseName: data.warehouseName ?? '',
    loadingDateTime: data.loadingDateTime ?? '',
    shipmentStatus: data.shipmentStatus ?? 'PENDING',
    totalPayable: Number(data.totalPayable ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    adjustments: Number(data.adjustments ?? 0),
    totalPieces: Number(data.totalPieces ?? totalPiecesFromMaterials),
    totalBundles: Number(data.totalBundles ?? totalBundlesFromMaterials),
    invoicePdfUrl: data.invoicePdfUrl ?? '',
    invoicePdfPath: data.invoicePdfPath ?? '',
    trackingUrl: data.trackingUrl ?? '',
    loadingArchived: data.loadingArchived === true,
    publicVisible: data.publicVisible === true,
    generatedAt,
    dispatchedAt,
    archivedAt,
    updatedAt,
    invoiceIssuedAt: generatedAt,
  }
}

/** Real-time count of invoices dispatched in the last 7 days. */
export function subscribeSentInvoicesCount(onCount, onError) {
  const weekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const q = query(collection(db, 'invoices'), where('dispatchedAt', '>=', weekAgo))
  return onSnapshot(q, (snap) => onCount(snap.size), onError)
}

/** All invoice records for admin billing archive (includes archived loadings). */
export function subscribeAdminInvoices(onData, onError) {
  const q = collection(db, 'invoices')
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => mapInvoiceDoc(d.id, d.data()))
        .sort(
          (a, b) =>
            (b.invoiceIssuedAt?.getTime() ?? b.updatedAt?.getTime() ?? 0) -
            (a.invoiceIssuedAt?.getTime() ?? a.updatedAt?.getTime() ?? 0),
        )
      onData(rows)
    },
    onError,
  )
}

export function groupInvoicesByVehicle(invoices) {
  const groups = new Map()

  invoices.forEach((invoice) => {
    const key = invoice.vehicleKey || 'UNKNOWN'
    const existing = groups.get(key)
    if (existing) {
      existing.invoices.push(invoice)
      existing.totalRevenue += invoice.totalPayable
      if (!existing.driverPhone && invoice.driverPhone) {
        existing.driverPhone = invoice.driverPhone
      }
      if (!existing.vehicleNumber && invoice.vehicleNumber) {
        existing.vehicleNumber = invoice.vehicleNumber
      }
    } else {
      groups.set(key, {
        vehicleKey: key,
        vehicleNumber: invoice.vehicleNumber || key,
        driverPhone: invoice.driverPhone || '',
        invoices: [invoice],
        totalRevenue: invoice.totalPayable,
      })
    }
  })

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      invoiceCount: group.invoices.length,
      invoices: group.invoices.sort(
        (a, b) => (b.invoiceIssuedAt?.getTime() ?? 0) - (a.invoiceIssuedAt?.getTime() ?? 0),
      ),
    }))
    .sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber, 'en-IN'))
}

export function filterVehicleGroups(groups, { search, searchCategory, statusFilter }) {
  const q = search.trim().toLowerCase()
  return groups
    .map((group) => {
      let invoices = group.invoices
      if (statusFilter !== 'ALL') {
        invoices = invoices.filter((inv) => inv.shipmentStatus === statusFilter)
      }
      if (q) {
        const matchesGroup =
          (searchCategory === 'all' || searchCategory === 'vehicle') &&
          group.vehicleNumber.toLowerCase().includes(q)
        const matchesDriver =
          (searchCategory === 'all' || searchCategory === 'driver') &&
          group.driverPhone.toLowerCase().includes(q)
        invoices = invoices.filter((inv) => {
          if (matchesGroup || matchesDriver) return true
          if (searchCategory === 'vehicle') {
            return inv.vehicleNumber.toLowerCase().includes(q)
          }
          if (searchCategory === 'driver') {
            return inv.driverPhone.toLowerCase().includes(q)
          }
          if (searchCategory === 'customer') {
            return (
              inv.customerName.toLowerCase().includes(q) ||
              inv.customerPhone.toLowerCase().includes(q)
            )
          }
          return (
            inv.vehicleNumber.toLowerCase().includes(q) ||
            inv.driverPhone.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.customerPhone.toLowerCase().includes(q) ||
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.loadingId.toLowerCase().includes(q)
          )
        })
      }
      if (invoices.length === 0) return null
      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalPayable, 0)
      return {
        ...group,
        invoices,
        invoiceCount: invoices.length,
        totalRevenue,
      }
    })
    .filter(Boolean)
}

export function formatLoadingDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBillingDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatBillingDateTime(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
