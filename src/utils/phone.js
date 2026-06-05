/** Normalize to comparable E.164-style string (India-focused). */
export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (String(phone).trim().startsWith('+')) return `+${digits}`
  return `+91${digits}`
}

export function phonesMatch(a, b) {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  return Boolean(na && nb && na === nb)
}
