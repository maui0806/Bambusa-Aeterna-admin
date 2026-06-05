import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

import { db } from '@/config/firebase'

const LOADINGS = 'loadings'

function tsToDate(value) {
  if (value instanceof Timestamp) return value.toDate()
  if (typeof value === 'string') return new Date(value)
  return null
}

export function mapLoadingDoc(id, data) {
  const createdAt = tsToDate(data.createdAt)
  return {
    id,
    loadingId: data.loadingId ?? '',
    vehicleNumber: data.vehicleNumber ?? '',
    destination: data.destination ?? '',
    loadingDateTime: data.loadingDateTime ?? '',
    driverPhone: data.driverPhone ?? '',
    status: data.status ?? 'PENDING',
    createdBy: data.createdBy ?? '',
    warehouseId: data.warehouseId ?? '',
    warehouseName: data.warehouseName ?? '',
    staffName: data.staffName ?? '',
    totalBundles: Number(data.totalBundles ?? 0),
    totalPieces: Number(data.totalPieces ?? 0),
    customerName: data.customerName ?? '',
    customerPhone: data.customerPhone ?? '',
    subtotal: Number(data.subtotal ?? 0),
    adjustments: Number(data.adjustments ?? 0),
    totalPayable: Number(data.totalPayable ?? 0),
    invoicePdfUrl: data.invoicePdfUrl ?? '',
    invoicePdfPath: data.invoicePdfPath ?? '',
    invoiceId: data.invoiceId ?? '',
    invoiceNumber: data.invoiceNumber ?? '',
    trackingUrl: data.trackingUrl ?? '',
    publicTrackingEnabled: data.publicTrackingEnabled === true,
    createdAt,
    updatedAt: tsToDate(data.updatedAt),
    loadingStartedAt: tsToDate(data.loadingStartedAt),
    dispatchedAt: tsToDate(data.dispatchedAt),
  }
}

export function mapMaterialDoc(id, data) {
  return {
    id,
    materialName: data.materialName ?? '',
    bundles: Number(data.bundles ?? 0),
    piecesPerBundle: Number(data.piecesPerBundle ?? 0),
    totalPieces: Number(data.totalPieces ?? 0),
    ratePerBundle: Number(data.ratePerBundle ?? 0),
    ratePerPiece: Number(data.ratePerPiece ?? 0),
    lineTotal: Number(data.lineTotal ?? 0),
    sortOrder: Number(data.sortOrder ?? 0),
  }
}

export function subscribeAllLoadings(onData, onError) {
  const q = query(collection(db, LOADINGS), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => mapLoadingDoc(d.id, d.data()))
        .filter((row) => row.status !== 'DRAFT')
      onData(rows)
    },
    onError,
  )
}

export async function fetchLoadingMaterials(loadingDocId) {
  const ref = collection(db, LOADINGS, loadingDocId, 'materials')
  const snap = await getDocs(query(ref, orderBy('sortOrder', 'asc')))
  return snap.docs.map((d) => mapMaterialDoc(d.id, d.data()))
}

/** Derive bundle rate and line total from unit price (per piece) entered by admin. */
export function applyMaterialPricing(material) {
  const ratePerPiece = Number(material.ratePerPiece) || 0
  const piecesPerBundle = Number(material.piecesPerBundle) || 0
  const bundles = Number(material.bundles) || 0
  const totalPieces = Number(material.totalPieces) || bundles * piecesPerBundle
  const ratePerBundle = ratePerPiece * piecesPerBundle
  const lineTotal = ratePerPiece * totalPieces
  return { ...material, ratePerBundle, lineTotal, totalPieces }
}

export function calcLineTotal(material) {
  const priced = applyMaterialPricing(material)
  return priced.lineTotal
}

export function calcBillingTotals(materials, adjustments = 0) {
  const subtotal = materials.reduce((sum, m) => sum + calcLineTotal(m), 0)
  const totalPayable = subtotal + (Number(adjustments) || 0)
  return { subtotal, totalPayable }
}

export async function saveBillingDraft(loadingDocId, { customerName, customerPhone, materials, adjustments }) {
  const pricedMaterials = materials.map(applyMaterialPricing)
  const totals = calcBillingTotals(pricedMaterials, adjustments)
  const batch = writeBatch(db)

  pricedMaterials.forEach((m) => {
    batch.update(doc(db, LOADINGS, loadingDocId, 'materials', m.id), {
      ratePerBundle: m.ratePerBundle,
      ratePerPiece: m.ratePerPiece,
      lineTotal: m.lineTotal,
    })
  })

  batch.update(doc(db, LOADINGS, loadingDocId), {
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    subtotal: totals.subtotal,
    adjustments: Number(adjustments) || 0,
    gstPercent: 0,
    gstAmount: 0,
    totalPayable: totals.totalPayable,
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
  return { ...totals, materials: pricedMaterials }
}

export async function updateLoadingStatus(loadingDocId, status) {
  const patch = { status, updatedAt: serverTimestamp() }
  if (status === 'COMPLETED') {
    patch.completedAt = serverTimestamp()
  }
  await updateDoc(doc(db, LOADINGS, loadingDocId), patch)

  const loadingSnap = await getDoc(doc(db, LOADINGS, loadingDocId))
  if (loadingSnap.exists()) {
    const invoiceId = loadingSnap.data().invoiceId
    if (invoiceId) {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        shipmentStatus: status,
        updatedAt: serverTimestamp(),
      })
    }
  }
}

export async function deleteCompletedLoading(loadingDocId) {
  const loadingRef = doc(db, LOADINGS, loadingDocId)
  const loadingSnap = await getDoc(loadingRef)
  if (!loadingSnap.exists()) {
    throw new Error('Loading not found.')
  }

  const data = loadingSnap.data()
  if (data.status !== 'COMPLETED') {
    throw new Error('Only completed deliveries can be deleted.')
  }

  const materialsRef = collection(db, LOADINGS, loadingDocId, 'materials')
  const materialsSnap = await getDocs(materialsRef)
  const materials = materialsSnap.docs.map((d) => mapMaterialDoc(d.id, d.data()))
  const batch = writeBatch(db)

  const invoiceId = data.invoiceId
  if (invoiceId) {
    const logistics = {
      staffName: data.staffName ?? '',
      driverPhone: data.driverPhone ?? '',
      loadingDateTime: data.loadingDateTime ?? '',
      warehouseName: data.warehouseName ?? '',
      shipmentStatus: data.status ?? 'COMPLETED',
      totalBundles: Number(data.totalBundles ?? 0),
      totalPieces: Number(data.totalPieces ?? 0),
      destination: data.destination ?? '',
      vehicleNumber: data.vehicleNumber ?? '',
      customerName: data.customerName ?? '',
      customerPhone: data.customerPhone ?? '',
      trackingUrl: data.trackingUrl ?? '',
      invoicePdfUrl: data.invoicePdfUrl ?? '',
      invoicePdfPath: data.invoicePdfPath ?? '',
      materials,
      loadingArchived: true,
      archivedAt: serverTimestamp(),
    }
    if (!logistics.totalBundles) {
      logistics.totalBundles = materials.reduce((sum, m) => sum + m.bundles, 0)
    }
    if (!logistics.totalPieces) {
      logistics.totalPieces = materials.reduce((sum, m) => sum + m.totalPieces, 0)
    }
    batch.update(doc(db, 'invoices', invoiceId), logistics)
  }

  materialsSnap.docs.forEach((materialDoc) => {
    batch.delete(materialDoc.ref)
  })

  batch.delete(loadingRef)
  await batch.commit()
}

export function computeDashboardStats(loadings) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const todayDispatches = loadings.filter((l) => l.createdAt && l.createdAt >= startOfDay).length

  const pendingInvoicesValue = loadings
    .filter((l) => l.status === 'PENDING')
    .reduce((sum, l) => sum + (l.totalPayable || 0), 0)

  const activeVehicles = loadings.filter((l) => l.status === 'TRANSIT').length

  return { todayDispatches, pendingInvoicesValue, sentInvoices: 0, activeVehicles }
}

export function exportLoadingsCsv(loadings) {
  const headers = [
    'Dispatch ID',
    'Vehicle',
    'Destination',
    'Customer',
    'Status',
    'Staff',
    'Total Payable',
    'Created',
  ]
  const rows = loadings.map((l) => [
    l.loadingId,
    l.vehicleNumber,
    l.destination,
    l.customerName || '—',
    l.status,
    l.staffName,
    l.totalPayable,
    l.createdAt ? l.createdAt.toISOString() : '',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bambusa-loadings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
