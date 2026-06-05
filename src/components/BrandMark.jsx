import logo from '@/assets/logo.jpg'

export function BrandMark({ compact = false, showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'justify-center'}`}>
      <img
        src={logo}
        alt="Bambusa Aeterna"
        className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm"
      />
      {showText ? (
        <div className="text-left leading-tight">
          <div className="text-lg font-bold tracking-tight text-slate-900">Bambusa Aeterna</div>
          {!compact ? (
            <div className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
              Secure Access
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
