import { jsPDF } from 'jspdf'

import { applyMaterialPricing } from '@/services/loadingsService'

function formatInr(value) {
  return `₹ ${Number(value || 0).toLocaleString('en-IN')}`
}

export function buildInvoicePayload({ loading, materials, invoiceNumber }) {
  const pricedMaterials = materials.map(applyMaterialPricing)
  const subtotal = pricedMaterials.reduce((sum, m) => sum + m.lineTotal, 0)
  const adjustments = Number(loading.adjustments) || 0
  const totalPayable = Number(loading.totalPayable) || subtotal + adjustments

  return {
    invoiceNumber: invoiceNumber || loading.invoiceNumber || loading.loadingId,
    loadingId: loading.loadingId,
    vehicleNumber: loading.vehicleNumber,
    destination: loading.destination,
    customerName: loading.customerName,
    customerPhone: loading.customerPhone,
    warehouseName: loading.warehouseName,
    materials: pricedMaterials,
    subtotal,
    adjustments,
    totalPayable,
  }
}

export function downloadInvoicePdf(payload) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  let y = 18

  const writeln = (text, opts = {}) => {
    const { size = 10, bold = false, gap = 6 } = opts
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(String(text), 182)
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.35) + gap
  }

  writeln('BAMBUSA AETERNA', { size: 16, bold: true, gap: 2 })
  writeln('INVOICE', { size: 12, bold: true, gap: 8 })
  writeln(`Invoice No: ${payload.invoiceNumber}`)
  writeln(`Dispatch ID: ${payload.loadingId}`)
  writeln(`Vehicle: ${payload.vehicleNumber}`)
  writeln(`Destination: ${payload.destination}`)
  writeln(`Customer: ${payload.customerName || '—'}`)
  if (payload.customerPhone) writeln(`Customer WhatsApp: ${payload.customerPhone}`)
  y += 4
  payload.materials.forEach((m) => {
    writeln(
      `${m.materialName}: ${m.bundles} bundles × ${m.piecesPerBundle} pcs = ${m.totalPieces} pcs`,
      { size: 9, gap: 2 },
    )
    writeln(
      `  ${formatInr(m.ratePerPiece)}/pc · Bundle ${formatInr(m.ratePerBundle)} · Line ${formatInr(m.lineTotal)}`,
      { size: 9, gap: 4 },
    )
  })
  writeln(`Subtotal: ${formatInr(payload.subtotal)}`)
  if (payload.adjustments) writeln(`Adjustments: ${formatInr(payload.adjustments)}`)
  writeln(`Total Payable: ${formatInr(payload.totalPayable)}`, { size: 12, bold: true })

  const filename = `${payload.invoiceNumber || 'invoice'}.pdf`.replace(/[^\w.-]+/g, '_')
  doc.save(filename)
}
