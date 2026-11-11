import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, CardHeader, PageHeader, Select, Table, StatCard } from '../../components/ui'
import { StockBadge } from '../../components/StatusBadge'
import { RankedBars } from '../../components/charts'
import { formatCurrency, formatNumber } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'

export default function StockReport() {
  const { data } = useData()
  const [category, setCategory] = useState('')
  const catName = (id) => data.categories.find((c) => c.id === id)?.name || 'Uncategorised'

  const rows = useMemo(() => {
    const since = new Date(); since.setDate(since.getDate() - 30)
    return data.products.filter((p) => p.active && (!category || p.categoryId === category)).map((p) => {
      const mv = data.stockMovements.filter((m) => m.productId === p.id)
      const in30 = mv.filter((m) => new Date(m.createdAt) >= since && m.quantityDelta > 0).reduce((s, m) => s + m.quantityDelta, 0)
      const out30 = mv.filter((m) => new Date(m.createdAt) >= since && m.quantityDelta < 0).reduce((s, m) => s - m.quantityDelta, 0)
      const ledger = mv.reduce((s, m) => s + m.quantityDelta, 0)
      return { ...p, in30, out30, ledger, costValue: p.costPrice * p.stockQuantity, saleValue: p.sellingPrice * p.stockQuantity }
    }).sort((a, b) => b.costValue - a.costValue)
  }, [data.products, data.stockMovements, category])

  const totals = rows.reduce((s, r) => ({ cost: s.cost + r.costValue, sale: s.sale + r.saleValue, units: s.units + r.stockQuantity }), { cost: 0, sale: 0, units: 0 })
  const mismatches = rows.filter((r) => r.ledger !== r.stockQuantity)
  const byCategory = useMemo(() => {
    const m = {}
    rows.forEach((r) => { const k = catName(r.categoryId); m[k] = (m[k] || 0) + r.costValue })
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const exportCsv = () => downloadCsv('stock-report.csv', [
    ['SKU', 'Product', 'Category', 'Unit', 'In stock', 'Reorder at', 'Cost price', 'Stock value (cost)', 'In (30d)', 'Out (30d)'],
    ...rows.map((r) => [r.sku, r.name, catName(r.categoryId), r.unit, r.stockQuantity, r.lowStockThreshold, r.costPrice, r.costValue, r.in30, r.out30]),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Stock report" subtitle="Stock on hand and value, as of now"
        actions={<>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48" aria-label="Category">
            <option value="">All categories</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
        </>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Stock value (cost)" value={formatCurrency(totals.cost)} />
        <StatCard label="Stock value (selling)" value={formatCurrency(totals.sale)} />
        <StatCard label="Units on hand" value={formatNumber(totals.units)} />
        <StatCard label="Ledger check" value={mismatches.length ? `${mismatches.length} mismatch` : 'All match'} hint="Balance vs. sum of movements" tone={mismatches.length ? 'red' : 'green'} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Products" />
          <Table rows={rows} columns={[
            { key: 'name', header: 'Product', render: (r) => <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{catName(r.categoryId)}</p></div> },
            { key: 'stock', header: 'On hand', align: 'right', render: (r) => `${r.stockQuantity} ${r.unit}` },
            { key: 'in30', header: 'In (30d)', align: 'right', render: (r) => <span className="text-emerald-600">+{r.in30}</span> },
            { key: 'out30', header: 'Out (30d)', align: 'right', render: (r) => <span className="text-red-600">−{r.out30}</span> },
            { key: 'value', header: 'Value (cost)', align: 'right', render: (r) => formatCurrency(r.costValue) },
            { key: 'status', header: 'Status', render: (r) => <StockBadge product={r} /> },
          ]} />
        </Card>
        <Card className="h-fit">
          <CardHeader title="Stock value by category" subtitle="At cost price" />
          <div className="p-5"><RankedBars data={byCategory} /></div>
        </Card>
      </div>
    </div>
  )
}
