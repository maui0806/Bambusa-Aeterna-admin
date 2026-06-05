export function NotificationStack({ items, onDismiss }) {
  if (!items.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
      {items.map((n) => (
        <div
          key={n.id}
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-lg"
        >
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          <div className="flex-1 text-sm text-slate-700">{n.message}</div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={() => onDismiss(n.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
