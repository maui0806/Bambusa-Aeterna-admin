import { getBlob, ref } from 'firebase/storage'

import { storage } from '@/config/firebase'

function pdfBlob(blob) {
  if (!blob || blob.type === 'application/pdf') return blob
  return new Blob([blob], { type: 'application/pdf' })
}

/**
 * Opens the invoice PDF in a new tab (preview only, no download).
 * @param {string} [url] Stored download URL (emulator HTTP or signed URL).
 * @param {string} [storagePath] Storage object path, e.g. invoices/{loadingId}/{invoiceId}.pdf
 */
export async function openInvoicePdf(url, storagePath) {
  if (!url && !storagePath) return

  // Must open the tab synchronously on click; async fetch/getBlob runs afterward.
  const tab = window.open('about:blank', '_blank')

  const showInTab = (href) => {
    if (tab && !tab.closed) {
      tab.opener = null
      tab.location.replace(href)
      return
    }
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const showBlob = (blob) => {
    const blobUrl = URL.createObjectURL(pdfBlob(blob))
    showInTab(blobUrl)
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  }

  if (storagePath) {
    try {
      showBlob(await getBlob(ref(storage, storagePath)))
      return
    } catch (err) {
      console.warn('[openInvoicePdf] Storage getBlob failed, falling back to URL', err)
    }
  }

  if (!url) {
    if (tab && !tab.closed) tab.close()
    return
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`)
    showBlob(await res.blob())
  } catch (err) {
    console.warn('[openInvoicePdf] fetch failed, opening URL directly', err)
    showInTab(url)
  }
}
