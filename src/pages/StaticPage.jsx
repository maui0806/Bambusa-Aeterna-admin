import { BrandMark } from '@/components/BrandMark'

export default function StaticPage({ title }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="mb-4 flex justify-center">
          <BrandMark compact />
        </div>
        <div className="text-xl font-semibold text-slate-900">{title}</div>
        <div className="mt-2 text-sm text-slate-600">This page is a placeholder.</div>
      </div>
    </div>
  )
}

