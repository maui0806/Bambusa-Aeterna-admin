import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/BrandMark'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 bg-gradient-to-b from-emerald-50 to-white px-6 py-8">
            <BrandMark />
          </div>

          <div className="px-6 py-6 sm:px-8">
            <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">{subtitle}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            <Link className="hover:text-emerald-700" to="/privacy">
              Privacy Policy
            </Link>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <Link className="hover:text-emerald-700" to="/terms">
              Terms of Service
            </Link>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <Link className="hover:text-emerald-700" to="/support">
              Contact Support
            </Link>
          </div>
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-slate-600">{footer}</div> : null}

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Bambusa Aeterna Pvt Ltd
        </p>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-md sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        System Secure &amp; Live
      </div>
    </div>
  )
}
