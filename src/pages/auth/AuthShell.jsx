import { CheckCircle2 } from 'lucide-react'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-bold">B</div>
          <span className="text-lg font-semibold">BillStock</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">Billing and inventory,<br />without the spreadsheets.</h2>
          <ul className="mt-8 space-y-3 text-indigo-100">
            {['GST-ready invoices in seconds', 'Stock updates automatically with every sale', 'Track payments and outstanding balances', 'Sales and stock reports at a glance'].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-300" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-indigo-200">Built for small businesses in India.</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">B</div>
            <span className="text-lg font-semibold">BillStock</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
