const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

/**
 * Base URL for customer-facing /track/{id} links.
 * On Vercel, defaults to the current admin deployment origin (same app hosts the portal).
 * Override with VITE_CUSTOMER_PORTAL_BASE_URL when the portal lives on another domain.
 */
export function getCustomerPortalBaseUrl() {
  const fromEnv = import.meta.env.VITE_CUSTOMER_PORTAL_BASE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(String(hostname || '').toLowerCase())
}

function shouldReplaceLocalhostUrl(storedUrl, baseUrl) {
  if (!storedUrl || !baseUrl) return false
  try {
    const stored = new URL(storedUrl)
    const base = new URL(baseUrl)
    return isLocalHost(stored.hostname) && !isLocalHost(base.hostname)
  } catch {
    return false
  }
}

/**
 * Prefer a production portal URL when Firestore still has localhost from emulator/dev dispatch.
 *
 * @param {string|undefined|null} storedUrl
 * @param {string|undefined|null} loadingDocId
 * @param {{ loadingArchived?: boolean }} [options]
 * @returns {string}
 */
export function resolveTrackingUrl(storedUrl, loadingDocId, options = {}) {
  const { loadingArchived = false } = options
  const baseUrl = getCustomerPortalBaseUrl()

  if (!loadingDocId || loadingArchived) {
    if (storedUrl && !shouldReplaceLocalhostUrl(storedUrl, baseUrl)) {
      return storedUrl
    }
    return ''
  }

  const canonicalUrl = `${baseUrl}/track/${loadingDocId}`

  if (!storedUrl) {
    return canonicalUrl
  }

  if (shouldReplaceLocalhostUrl(storedUrl, baseUrl)) {
    return canonicalUrl
  }

  return storedUrl
}
