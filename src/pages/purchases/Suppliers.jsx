import { useMemo, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, PageHeader, SearchInput, Table, EmptyState } from '../../components/ui'
import CustomerFormModal from '../customers/CustomerFormModal'
import { formatCurrency } from '../../lib/format'

export default function Suppliers() {
  const { data } = useData()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const stats = useMemo(() => {
    const m = {}
    data.purchases.forEach((p) => {
      m[p.supplierId] = m[p.supplierId] || { total: 0, unpaid: 0, count: 0 }
      m[p.supplierId].total += p.total
      m[p.supplierId].count += 1
      if (p.status === 'unpaid') m[p.supplierId].unpaid += p.total
    })
    return m
  }, [data.purchases])

  const rows = data.suppliers.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Who you buy stock from" actions={<Button icon={Plus} onClick={() => { setEditing(null); setOpen(true) }}>Add supplier</Button>} />
      <Card>
        <div className="border-b border-slate-100 p-4"><SearchInput value={q} onChange={setQ} placeholder="Search suppliers" className="max-w-md" /></div>
        <Table
          rows={rows}
          onRowClick={(r) => { setEditing(r); setOpen(true) }}
          empty={<EmptyState icon={Truck} title="No suppliers" />}
          columns={[
            { key: 'name', header: 'Supplier', render: (r) => <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{[r.city, r.state].filter(Boolean).join(', ')}</p></div> },
            { key: 'contact', header: 'Contact', render: (r) => <div className="text-xs"><p>{r.phone}</p><p className="text-slate-500">{r.email}</p></div> },
            { key: 'gstin', header: 'GSTIN', render: (r) => r.gstin || '—' },
            { key: 'count', header: 'Bills', align: 'right', render: (r) => stats[r.id]?.count || 0 },
            { key: 'total', header: 'Purchased', align: 'right', render: (r) => formatCurrency(stats[r.id]?.total || 0) },
            { key: 'unpaid', header: 'Unpaid', align: 'right', render: (r) => (stats[r.id]?.unpaid || 0) > 0 ? <span className="font-semibold text-amber-600">{formatCurrency(stats[r.id].unpaid)}</span> : '—' },
          ]}
        />
      </Card>
      <CustomerFormModal kind="supplier" open={open} onClose={() => setOpen(false)} initial={editing} />
    </div>
  )
}
