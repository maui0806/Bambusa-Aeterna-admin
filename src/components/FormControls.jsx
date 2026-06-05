import { useState } from 'react'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.841 0 3.548-.41 5.03-1.14M9.878 9.878a3 3 0 104.243 4.243M6.228 6.228L17.772 17.772"
      />
    </svg>
  )
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  name,
  required,
  hint,
  icon,
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="relative mt-2">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          className={[
            'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400',
            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
            icon ? 'pl-10 pr-3' : 'px-3',
          ].join(' ')}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          name={name}
          required={required}
        />
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </label>
  )
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  name,
  required,
  hint,
  icon,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      <div className="relative mt-2">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          className={[
            'w-full rounded-xl border border-slate-200 bg-white py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400',
            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
            icon ? 'pl-10 pr-11' : 'px-3 pr-11',
          ].join(' ')}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          name={name}
          required={required}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </label>
  )
}

export function Checkbox({ label, checked, onChange, name }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
        checked={checked}
        onChange={onChange}
        name={name}
      />
      <span>{label}</span>
    </label>
  )
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  )
}

export function GoogleButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      <GoogleIcon />
      {children}
    </button>
  )
}

export function Divider({ label }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <div className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

export function Alert({ kind = 'info', children }) {
  const styles =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : kind === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-slate-50 text-slate-700'

  return <div className={`rounded-xl border px-3 py-2.5 text-sm ${styles}`}>{children}</div>
}
