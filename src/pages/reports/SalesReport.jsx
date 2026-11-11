import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, CardHeader, Input, PageHeader, Select, Table, StatCard } from '../../components/ui'
import { TimeBarChart, RankedBars } from '../../components/charts'
import { formatCurrency, formatDate, toDateInput, round2 } from '../../lib/format'
import { dailySeries, isRevenue } from '../../lib/selectors'
import { PAYMENT_METHODS } from '../../lib/invoice'
import { downloadCsv } from '../../lib/csv'

const presets = {
  '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', month: 'This month', custom: 'Custom range',
}

export default function SalesReport() {
  const { data } = useData()
  const [preset, setPreset] = useState('30')
  const [custom, setCustom] = useState(() => {
    const f = new Date(); f.setDate(f.getDate() - 29)
    return { from: toDateInput(f), to: toDateInput() }
  })

  const { from, to } = useMemo(() => {
    const end = new Date(); end.setHours(23, 59, 59, 999)
    if (preset === 'custom') return { from: new Date(`${custom.from}T00:00:00`), to: new Date(`${custom.to}T23:59:59`) }
    const start = new Date(); start.setHours(0, 0, 0, 0)
    if (preset === 'month') start.setDate(1)
    else start.setDate(start.getDate() - (Number(preset) - 1))
    return { from: start, to: end }
  }, [preset, custom])

  const inRange = useMemo(() => data.invoices.filter((i) => isRevenue(i) && new Date(i.issueDate) >= from && new Date(i.issueDate) <= to), [data.invoices, from, to])
  const days = Math.max(1, Math.round((to - from) / 86400000))
  const series = useMemo(() => dailySeries(data.invoices, days, from), [data.invoices, days, from])

  const summary = inRange.reduce((s, i) => ({
    gross: s.gross + i.grandTotal, taxable: s.taxable + i.taxableTotal, tax: s.tax + i.taxTotal, collected: s.collected + i.amountPaid,
  }), { gross: 0, taxable: 0, tax: 0, collected: 0 })

  const byProduct = useMemo(() => {
    const m = {}
    inRange.forEach((i) => i.items.forEach((it) => {
      m[it.productName] = m[it.productName] || { label: it.productName, qty: 0, value: 0 }
      m[it.productName].qty += it.quantity; m[it.productName].value += it.lineTotal
    }))
    return Object.values(m).sort((a, b) => b.value - a.value)
  }, [inRange])

  const byMethod = useMemo(() => {
    const m = {}
    data.invoices.forEach((i) => i.payments.forEach((p) => {
      const d = new Date(p.receivedAt)
      if (d >= from && d <= to && i.status !== 'void') m[p.method] = (m[p.method] || 0) + p.amount
    }))
    return PAYMENT_METHODS.map((pm) => ({ label: pm.label, value: m[pm.value] || 0 })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value)
  }, [data.invoices, from, to])

  const exportCsv = () => downloadCsv(`sales-${toDateInput(from)}-to-${toDateInput(to)}.csv`, [
    ['Invoice', 'Date', 'Customer', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Paid', 'Status'],
    ...inRange.map((i) => [i.invoiceNumber, formatDate(i.issueDate), i.customerSnapshot?.name, i.customerSnapshot?.gstin, i.taxableTotal, i.cgst, i.sgst, i.igst, i.grandTotal, i.amountPaid, i.status]),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Sales report" subtitle={`${formatDate(from)} – ${formatDate(to)}`}
        actions={<>
          <Select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-40" aria-label="Date range">
            {Object.entries(presets).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          {preset === 'custom' && <>
            <Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="w-40" aria-label="From" />
            <Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="w-40" aria-label="To" />
          </>}
          <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
        </>} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Gross sales" value={formatCurrency(summary.gross)} hint={`${inRange.length} invoices`} />
        <StatCard label="Taxable value" value={formatCurrency(summary.taxable)} />
        <StatCard label="GST collected" value={formatCurrency(round2(summary.tax))} />
        <StatCard label="Payments received" value={formatCurrency(summary.collected)} hint="Against these invoices" tone="green" />
      </div>

      <Card>
        <CardHeader title="Daily sales" subtitle="Issued invoice value incl. GST; drafts and voids excluded" />
        <div className="p-4"><TimeBarChart data={series} height={280} /></div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sales by product" />
          <Table rowKey="label" rows={byProduct.slice(0, 12)} columns={[
            { key: 'label', header: 'Product', render: (r) => <span className="font-medium text-slate-900">{r.label}</span> },
            { key: 'qty', header: 'Qty sold', align: 'right' },
            { key: 'value', header: 'Sales', align: 'right', render: (r) => formatCurrency(r.value) },
            { key: 'share', header: 'Share', align: 'right', render: (r) => `${summary.gross ? ((r.value / summary.gross) * 100).toFixed(1) : 0}%` },
          ]} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Payments by method" subtitle="Received in this period" />
          <div className="p-5">{byMethod.length ? <RankedBars data={byMethod} /> : <p className="text-sm text-slate-500">No payments in this period.</p>}</div>
        </Card>
      </div>
    </div>
  )
}
