import { getBlob, ref } from 'firebase/storage'

import { isFirebaseEmulatorsEnabled } from '@/config/emulatorHost'
import { storage } from '@/config/firebase'

function pdfBlob(blob) {
  if (!blob || blob.type === 'application/pdf') return blob
  return new Blob([blob], { type: 'application/pdf' })
}

function isHostedStorageUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    return (
      hostname.includes('firebasestorage.googleapis.com') ||
      hostname.includes('storage.googleapis.com') ||
      hostname.includes('googleapis.com')
    )
  } catch {
    return false
  }
}

/**
 * Opens the invoice PDF in a new tab (preview only, no download).
 * @param {string} [url] Stored download URL (emulator HTTP or signed URL).
 * @param {string} [storagePath] Storage object path, e.g. invoices/{loadingId}/{invoiceId}.pdf
 */
export async function openInvoicePdf(url, storagePath) {
  if (!url && !storagePath) return

  // Production Storage URLs work when opened directly (Console / new tab).
  // Blob fetch + about:blank often yields a blank tab due to CORS / async timing.
  if (url && isHostedStorageUrl(url) && !isFirebaseEmulatorsEnabled()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

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

  if (/^https?:\/\//i.test(url)) {
    showInTab(url)
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
