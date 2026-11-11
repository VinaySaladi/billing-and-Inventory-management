import { useMemo, useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, PageHeader, SearchInput, Table, Badge, Modal, Pagination, EmptyState, StatCard } from '../../components/ui'
import { formatCurrency, formatDate } from '../../lib/format'
import { usePagination } from '../../lib/usePagination'

export default function PurchaseList() {
  const { data, markPurchasePaid } = useData()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const supplier = (id) => data.suppliers.find((s) => s.id === id)

  const rows = useMemo(() => {
    const term = q.toLowerCase()
    return [...data.purchases]
      .filter((p) => !term || p.billNumber.toLowerCase().includes(term) || supplier(p.supplierId)?.name.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.purchases, data.suppliers, q])
  const pg = usePagination(rows, 15, q)

  const unpaid = data.purchases.filter((p) => p.status === 'unpaid')
  const month = data.purchases.filter((p) => new Date(p.date).getMonth() === new Date().getMonth() && new Date(p.date).getFullYear() === new Date().getFullYear())
  const current = selected ? data.purchases.find((p) => p.id === selected) : null

  return (
    <div>
      <PageHeader title="Purchases" subtitle="Supplier bills. Saving one adds the items to stock." actions={<Button icon={Plus} to="/purchases/new">Record purchase</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Purchases this month" value={formatCurrency(month.reduce((s, p) => s + p.total, 0))} hint={`${month.length} bills`} />
        <StatCard label="Unpaid to suppliers" value={formatCurrency(unpaid.reduce((s, p) => s + p.total, 0))} hint={`${unpaid.length} bills`} tone="amber" />
        <StatCard label="Suppliers" value={data.suppliers.length} to="/suppliers" />
      </div>
      <Card>
        <div className="border-b border-slate-100 p-4"><SearchInput value={q} onChange={setQ} placeholder="Search bill # or supplier" className="max-w-md" /></div>
        <Table
          rows={pg.pageRows}
          onRowClick={(r) => setSelected(r.id)}
          empty={<EmptyState icon={ShoppingCart} title="No purchases yet" action={<Button icon={Plus} to="/purchases/new">Record purchase</Button>} />}
          columns={[
            { key: 'billNumber', header: 'Bill #', render: (r) => <span className="font-medium text-slate-900">{r.billNumber}</span> },
            { key: 'supplier', header: 'Supplier', render: (r) => supplier(r.supplierId)?.name },
            { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
            { key: 'items', header: 'Items', align: 'right', render: (r) => r.items.length },
            { key: 'status', header: 'Status', render: (r) => r.status === 'paid' ? <Badge color="green">Paid</Badge> : <Badge color="amber">Unpaid</Badge> },
            { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
          ]}
        />
        <Pagination {...pg} onChange={pg.setPage} />
      </Card>

      <Modal open={!!current} onClose={() => setSelected(null)} title={current ? `Bill ${current.billNumber}` : ''} size="lg"
        footer={current?.status === 'unpaid' && <Button variant="success" onClick={() => { markPurchasePaid(current.id); toast('Marked as paid') }}>Mark as paid</Button>}>
        {current && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <div><p className="text-slate-500">Supplier</p><p className="font-medium">{supplier(current.supplierId)?.name}</p></div>
              <div><p className="text-slate-500">Date</p><p className="font-medium">{formatDate(current.date)}</p></div>
              <div><p className="text-slate-500">Status</p>{current.status === 'paid' ? <Badge color="green">Paid</Badge> : <Badge color="amber">Unpaid</Badge>}</div>
            </div>
            <Table rowKey="productId" rows={current.items} columns={[
              { key: 'productName', header: 'Product' },
              { key: 'quantity', header: 'Qty', align: 'right' },
              { key: 'unitCost', header: 'Cost', align: 'right', render: (r) => formatCurrency(r.unitCost) },
              { key: 'taxRate', header: 'GST', align: 'right', render: (r) => `${r.taxRate}%` },
              { key: 'amt', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.quantity * r.unitCost * (1 + r.taxRate / 100)) },
            ]} />
            <div className="ml-auto w-60 space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(current.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST</span><span>{formatCurrency(current.taxTotal)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{formatCurrency(current.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
