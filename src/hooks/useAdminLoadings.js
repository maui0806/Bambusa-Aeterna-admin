import { useEffect, useMemo, useRef, useState } from 'react'

import { computeDashboardStats, subscribeAllLoadings } from '@/services/loadingsService'
import { subscribeSentInvoicesCount } from '@/services/invoicesService'

export function useAdminLoadings() {
  const [loadings, setLoadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sentInvoices, setSentInvoices] = useState(0)
  const [notifications, setNotifications] = useState([])
  const seenIdsRef = useRef(new Set())

  useEffect(() => {
    const unsub = subscribeAllLoadings(
      (rows) => {
        setLoadings(rows)
        setLoading(false)

        const newPending = rows.filter(
          (r) => r.status === 'PENDING' && !seenIdsRef.current.has(r.id),
        )
        if (seenIdsRef.current.size > 0 && newPending.length > 0) {
          setNotifications((prev) => [
            ...newPending.map((r) => ({
              id: `${r.id}-${Date.now()}`,
              message: `New vehicle submitted: ${r.vehicleNumber}`,
              loadingId: r.id,
            })),
            ...prev,
          ].slice(0, 5))
        }
        rows.forEach((r) => seenIdsRef.current.add(r.id))
      },
      (err) => {
        setError(err?.message || 'Failed to load dispatches')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = subscribeSentInvoicesCount(setSentInvoices, () => setSentInvoices(0))
    return () => unsub()
  }, [])

  const stats = useMemo(
    () => ({ ...computeDashboardStats(loadings), sentInvoices }),
    [loadings, sentInvoices],
  )

  function dismissNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return {
    loadings,
    loading,
    error,
    stats,
    notifications,
    dismissNotification,
  }
}
