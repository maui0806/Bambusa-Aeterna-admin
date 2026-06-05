/** Human-readable message from Firebase httpsCallable errors. */
export function getCallableErrorMessage(err, fallback = 'Request failed') {
  if (!err) return fallback

  const code = err?.code || ''
  const details = err?.details
  const customData = err?.customData

  if (typeof details === 'string' && details && details !== 'INTERNAL') {
    return details
  }

  if (details && typeof details === 'object' && typeof details.message === 'string') {
    return details.message
  }

  if (typeof customData?.message === 'string' && customData.message) {
    return customData.message
  }

  const msg = err.message
  if (typeof msg === 'string' && msg && msg !== 'INTERNAL') {
    if (msg.startsWith('FirebaseError: ')) {
      return msg.replace(/^FirebaseError:\s*/, '')
    }
    return msg
  }

  if (code === 'functions/internal') {
    return fallback
  }

  return fallback
}
