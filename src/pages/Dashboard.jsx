import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndianRupee, FileText, Wallet, Package, AlertTriangle, Plus, ArrowRight } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { Button, Card, CardHeader, StatCard, Table, Badge, EmptyState, Tabs } from '../components/ui'
import StatusBadge from '../components/StatusBadge'
import { TimeBarChart, RankedBars } from '../components/charts'
import { formatCurrency, formatCurrencyShort, formatDate, formatNumber } from '../lib/format'
import { isRevenue, dailySeries, sameDay } from '../lib/selectors'
import { balanceDue, isOverdue } from '../lib/invoice'

export default function Dashboard() {
  const { data } = useData()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [range, setRange] = useState('30')

  const stats = useMemo(() => {
    const today = new Date()
    const revenue = data.invoices.filter(isRevenue)
    const todaySales = revenue.filter((i) => sameDay(i.issueDate, today))
    const monthSales = revenue.filter((i) => {
      const d = new Date(i.issueDate)
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
    })
    const outstanding = data.invoices.filter((i) => ['issued', 'partially_paid'].includes(i.status))
    const lowStock = data.products.filter((p) => p.active && p.stockQuantity <= p.lowStockThreshold)
    return {
      today: todaySales.reduce((s, i) => s + i.grandTotal, 0),
      todayCount: todaySales.length,
      month: monthSales.reduce((s, i) => s + i.grandTotal, 0),
      monthCount: monthSales.length,
      outstanding: outstanding.reduce((s, i) => s + balanceDue(i), 0),
      outstandingCount: outstanding.length,
      overdueCount: outstanding.filter(isOverdue).length,
      products: data.products.filter((p) => p.active).length,
      lowStock,
      outstandingList: [...outstanding].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5),
    }
  }, [data])

  const series = useMemo(() => dailySeries(data.invoices, Number(range)), [data.invoices, range])

  const topProducts = useMemo(() => {
    const since = new Date(); since.setDate(since.getDate() - 30)
    const map = {}
    data.invoices.filter((i) => isRevenue(i) && new Date(i.issueDate) >= since).forEach((i) =>
      i.items.forEach((it) => { map[it.productName] = (map[it.productName] || 0) + it.lineTotal }))
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [data.invoices])

  const recent = data.invoices.filter((i) => i.status !== 'draft').slice().sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)).slice(0, 6)
  const periodTotal = series.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Good {greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Here's how {data.business.name} is doing today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Package} to="/products/new">Add product</Button>
          <Button icon={Plus} to="/invoices/new">New invoice</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard label="Sales today" value={formatCurrencyShort(stats.today)} hint={`${stats.todayCount} invoices`} icon={IndianRupee} tone="indigo" />
        <StatCard label="Sales this month" value={formatCurrencyShort(stats.month)} hint={`${stats.monthCount} invoices issued`} icon={FileText} tone="blue" />
        <StatCard label="Outstanding" value={formatCurrencyShort(stats.outstanding)} hint={`${stats.outstandingCount} unpaid · ${stats.overdueCount} overdue`} icon={Wallet} tone="amber" to="/invoices?status=unpaid" />
        <StatCard label="Active products" value={formatNumber(stats.products)} hint="In catalogue" icon={Package} tone="green" to="/products" />
        <StatCard label="Low stock" value={formatNumber(stats.lowStock.length)} hint="Need reorder" icon={AlertTriangle} tone="red" to="/inventory?filter=low" />
      </div>
      <p className="-mt-3 text-xs text-slate-400">Sales = value of issued invoices (incl. GST), excluding drafts and voided invoices.</p>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Sales"
            subtitle={`${formatCurrency(periodTotal)} in the last ${range} days`}
            action={<div className="w-44"><Tabs value={range} onChange={setRange} tabs={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }]} /></div>}
          />
          <div className="p-4"><TimeBarChart data={series} /></div>
        </Card>
        <Card>
          <CardHeader title="Top products" subtitle="By sales value, last 30 days" />
          <div className="p-5">
            {topProducts.length ? <RankedBars data={topProducts} /> : <EmptyState title="No sales yet" />}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent invoices" action={<Button size="sm" variant="ghost" to="/invoices">View all <ArrowRight className="h-4 w-4" /></Button>} />
          <Table
            rows={recent}
            onRowClick={(r) => navigate(`/invoices/${r.id}`)}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice', render: (r) => <span className="font-medium text-slate-900">{r.invoiceNumber}</span> },
              { key: 'customer', header: 'Customer', render: (r) => r.customerSnapshot?.name },
              { key: 'issueDate', header: 'Date', render: (r) => formatDate(r.issueDate) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge invoice={r} /> },
              { key: 'grandTotal', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.grandTotal) },
            ]}
          />
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Low stock alerts" action={<Button size="sm" variant="ghost" to="/inventory?filter=low">View</Button>} />
            {stats.lowStock.length ? (
              <ul className="divide-y divide-slate-100">
                {stats.lowStock.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50" onClick={() => navigate(`/products/${p.id}`)}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">Reorder at {p.lowStockThreshold} {p.unit}</p>
                    </div>
                    <Badge color={p.stockQuantity <= 0 ? 'red' : 'amber'}>{p.stockQuantity} left</Badge>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="All stocked up" message="No products are below their reorder level." />}
          </Card>
          <Card>
            <CardHeader title="Payments due" action={<Button size="sm" variant="ghost" to="/invoices?status=unpaid">View</Button>} />
            {stats.outstandingList.length ? (
              <ul className="divide-y divide-slate-100">
                {stats.outstandingList.map((i) => (
                  <li key={i.id} className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50" onClick={() => navigate(`/invoices/${i.id}`)}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{i.customerSnapshot?.name}</p>
                      <p className={isOverdue(i) ? 'text-xs text-red-600' : 'text-xs text-slate-500'}>{i.invoiceNumber} · due {formatDate(i.dueDate)}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(balanceDue(i))}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="Nothing outstanding" />}
          </Card>
        </div>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}
