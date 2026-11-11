import { useState } from 'react'
import { Check } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, PageHeader, Badge, ConfirmDialog, cx } from '../../components/ui'
import SettingsTabs from './SettingsTabs'
import { plans } from '../../data/mockData'
import { formatCurrencyShort } from '../../lib/format'

export default function SubscriptionSettings() {
  const { data, setPlan } = useData()
  const toast = useToast()
  const [changing, setChanging] = useState(null)
  const current = plans.find((p) => p.key === data.business.plan)

  const thisMonth = data.invoices.filter((i) => i.status !== 'draft' && new Date(i.issueDate).getMonth() === new Date().getMonth()).length
  const limits = { free: [50, 100, 1], starter: [500, 1000, 2], business: [Infinity, 10000, 5], premium: [Infinity, Infinity, Infinity] }[data.business.plan]
  const usage = [
    ['Invoices this month', thisMonth, limits[0]],
    ['Products', data.products.length, limits[1]],
    ['Users', data.members.length, limits[2]],
  ]

  return (
    <div>
      <PageHeader title="Settings" />
      <SettingsTabs />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Current plan" action={<Badge color="indigo">{current.name}</Badge>} />
          <div className="grid gap-6 p-5 sm:grid-cols-3">
            {usage.map(([label, used, limit]) => (
              <div key={label}>
                <div className="flex justify-between text-sm"><span className="text-slate-600">{label}</span><span className="font-medium">{used} / {limit === Infinity ? '∞' : limit}</span></div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className={cx('h-2 rounded-full', limit !== Infinity && used / limit > 0.9 ? 'bg-red-500' : 'bg-indigo-600')}
                    style={{ width: `${limit === Infinity ? 4 : Math.min(100, (used / limit) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Renews on 1 Dec 2026 · Payments handled by the payment provider (connected in a later step).</p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = p.key === data.business.plan
            return (
              <Card key={p.key} className={cx('flex flex-col p-5', isCurrent && 'border-indigo-500 ring-1 ring-indigo-500')}>
                <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{p.name}</h3>{p.key === 'business' && <Badge color="indigo">Popular</Badge>}</div>
                <p className="mt-3"><span className="text-3xl font-semibold text-slate-900">{formatCurrencyShort(p.price)}</span><span className="text-sm text-slate-500"> / month</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{f}</li>)}
                </ul>
                <Button className="mt-5 w-full" variant={isCurrent ? 'secondary' : 'primary'} disabled={isCurrent} onClick={() => setChanging(p)}>
                  {isCurrent ? 'Current plan' : p.price > current.price ? 'Upgrade' : 'Downgrade'}
                </Button>
              </Card>
            )
          })}
        </div>
        <p className="text-xs text-slate-500">Prices are placeholders from the planning doc and are not final.</p>
      </div>
      <ConfirmDialog open={!!changing} onClose={() => setChanging(null)} variant="primary"
        title={`Switch to ${changing?.name}?`}
        message="In the real app this opens the payment provider's checkout. In this prototype it switches the plan right away."
        confirmLabel="Switch plan" onConfirm={() => { setPlan(changing.key); toast(`Switched to ${changing.name}`); setChanging(null) }} />
    </div>
  )
}
