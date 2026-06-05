import { httpsCallable } from 'firebase/functions'

import { functions } from '@/config/firebase'

export async function generateInvoicePdf(loadingDocId) {
  const fn = httpsCallable(functions, 'generateInvoicePdf')
  const res = await fn({ loadingDocId })
  return res.data
}

export async function dispatchViaWhatsApp(loadingDocId) {
  const fn = httpsCallable(functions, 'dispatchViaWhatsApp')
  const res = await fn({ loadingDocId })
  return res.data
}
