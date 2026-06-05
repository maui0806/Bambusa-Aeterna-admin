import { useEffect, useRef, useState } from 'react'

import { STATUS_LABELS } from '@/constants/loading'

const ADMIN_STATUS_OPTIONS = ['PENDING', 'INVOICED', 'TRANSIT', 'COMPLETED']

function KebabIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  )
}

export function LoadingRowActions({ row, onStatusChange, onDelete, busy, deleteBusy }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function handlePick(status) {
    setOpen(false)
    if (status !== row.status) onStatusChange(row, status)
  }

  function handleDelete() {
    setOpen(false)
    onDelete?.(row)
  }

  const canDelete = row.status === 'COMPLETED'

  return (
    <div ref={rootRef} className="relative inline-flex justify-center">
      <button
        type="button"
        disabled={busy || deleteBusy}
        aria-label="Row actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
      >
        <KebabIcon />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Update status
          </div>
          {ADMIN_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy || deleteBusy || status === row.status}
              onClick={() => handlePick(status)}
              className={[
                'block w-full px-3 py-2 text-left text-sm',
                status === row.status
                  ? 'cursor-default bg-slate-50 text-slate-400'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800',
              ].join(' ')}
            >
              {STATUS_LABELS[status]}
              {status === row.status ? ' (current)' : ''}
            </button>
          ))}
          {canDelete ? (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                disabled={busy || deleteBusy}
                onClick={handleDelete}
                className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              >
                Delete loading
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
