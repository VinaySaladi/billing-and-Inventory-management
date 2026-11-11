import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Boxes, AlertTriangle, PackageX, IndianRupee } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, PageHeader, SearchInput, Select, Table, Tabs, Badge, Pagination, StatCard } from '../../components/ui'
import { StockBadge } from '../../components/StatusBadge'
import StockAdjustModal from './StockAdjustModal'
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/format'
import { MOVEMENT_META } from '../../lib/invoice'
import { usePagination } from '../../lib/usePagination'

export default function Inventory() {
  const { data } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'stock'
  const filter = params.get('filter') || 'all'
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [adjustOpen, setAdjustOpen] = useState(false)

  const setParam = (k, v) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p, { replace: true }) }

  const active = data.products.filter((p) => p.active)
  const summary = {
    value: active.reduce((s, p) => s + p.costPrice * p.stockQuantity, 0),
    units: active.reduce((s, p) => s + p.stockQuantity, 0),
    low: active.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
    out: active.filter((p) => p.stockQuantity <= 0).length,
  }

  const stockRows = useMemo(() => {
    const term = q.toLowerCase()
    return active
      .filter((p) => filter === 'all' || (filter === 'low' ? p.stockQuantity <= p.lowStockThreshold : p.stockQuantity <= 0))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term))
      .sort((a, b) => (a.stockQuantity / (a.lowStockThreshold || 1)) - (b.stockQuantity / (b.lowStockThreshold || 1)))
  }, [active, filter, q])

  const productName = (id) => data.products.find((p) => p.id === id)?.name || 'Unknown'
  const movementRows = useMemo(() => {
    const term = q.toLowerCase()
    return [...data.stockMovements]
      .filter((m) => !type || m.movementType === type)
      .filter((m) => !term || productName(m.productId).toLowerCase().includes(term) || m.referenceLabel?.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.stockMovements, data.products, q, type])

  const stockPg = usePagination(stockRows, 15, `${q}|${filter}`)
  const mvPg = usePagination(movementRows, 15, `${q}|${type}`)

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Current stock and every stock movement"
        actions={<Button icon={SlidersHorizontal} onClick={() => setAdjustOpen(true)}>Adjust stock</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Stock value (cost)" value={formatCurrency(summary.value)} icon={IndianRupee} tone="indigo" />
        <StatCard label="Units in stock" value={formatNumber(summary.units)} icon={Boxes} tone="blue" />
        <StatCard label="Low stock" value={summary.low} icon={AlertTriangle} tone="amber" />
        <StatCard label="Out of stock" value={summary.out} icon={PackageX} tone="red" />
      </div>

      <Card>
        <div className="px-4 pt-2">
          <Tabs value={tab} onChange={(v) => setParam('tab', v)} tabs={[{ value: 'stock', label: 'Stock levels' }, { value: 'movements', label: 'Movement ledger' }]} />
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <SearchInput value={q} onChange={setQ} placeholder={tab === 'stock' ? 'Search products' : 'Search product or reference'} className="sm:col-span-2" />
          {tab === 'stock' ? (
            <Select value={filter} onChange={(e) => setParam('filter', e.target.value)} aria-label="Filter">
              <option value="all">All products</option>
              <option value="low">Low & out of stock</option>
              <option value="out">Out of stock only</option>
            </Select>
          ) : (
            <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Movement type">
              <option value="">All movement types</option>
              {Object.entries(MOVEMENT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          )}
        </div>

        {tab === 'stock' ? (
          <>
            <Table
              rows={stockPg.pageRows}
              onRowClick={(r) => navigate(`/products/${r.id}`)}
              columns={[
                { key: 'name', header: 'Product', render: (r) => <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.sku}</p></div> },
                { key: 'stock', header: 'In stock', align: 'right', render: (r) => <span className="font-semibold">{r.stockQuantity} <span className="text-xs font-normal text-slate-500">{r.unit}</span></span> },
                { key: 'reorder', header: 'Reorder at', align: 'right', render: (r) => r.lowStockThreshold },
                { key: 'level', header: 'Level', className: 'w-40', render: (r) => {
                  const pct = Math.min(100, (r.stockQuantity / Math.max(r.lowStockThreshold * 4, 1)) * 100)
                  const color = r.stockQuantity <= 0 ? 'bg-red-500' : r.stockQuantity <= r.lowStockThreshold ? 'bg-amber-500' : 'bg-emerald-500'
                  return <div className="h-1.5 w-32 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
                } },
                { key: 'value', header: 'Value (cost)', align: 'right', render: (r) => formatCurrency(r.costPrice * r.stockQuantity) },
                { key: 'status', header: 'Status', render: (r) => <StockBadge product={r} /> },
              ]}
            />
            <Pagination {...stockPg} onChange={stockPg.setPage} />
          </>
        ) : (
          <>
            <Table
              rows={mvPg.pageRows}
              columns={[
                { key: 'createdAt', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
                { key: 'product', header: 'Product', render: (r) => <span className="font-medium text-slate-900">{productName(r.productId)}</span> },
                { key: 'type', header: 'Type', render: (r) => <Badge color={MOVEMENT_META[r.movementType]?.color}>{MOVEMENT_META[r.movementType]?.label}</Badge> },
                { key: 'ref', header: 'Reference / reason', render: (r) => r.referenceId && r.referenceType === 'invoice'
                  ? <button className="text-indigo-600 hover:underline" onClick={() => navigate(`/invoices/${r.referenceId}`)}>{r.referenceLabel}</button>
                  : <span className="text-slate-600">{r.referenceLabel || r.note || '—'}</span> },
                { key: 'actor', header: 'By', render: (r) => r.actor },
                { key: 'delta', header: 'Qty', align: 'right', render: (r) => <span className={r.quantityDelta > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>{r.quantityDelta > 0 ? '+' : ''}{r.quantityDelta}</span> },
              ]}
            />
            <Pagination {...mvPg} onChange={mvPg.setPage} />
          </>
        )}
      </Card>

      <StockAdjustModal open={adjustOpen} onClose={() => setAdjustOpen(false)} />
    </div>
  )
}
