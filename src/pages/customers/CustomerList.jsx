import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, PageHeader, SearchInput, Table, Pagination, EmptyState, Badge, Select } from '../../components/ui'
import CustomerFormModal from './CustomerFormModal'
import { formatCurrency } from '../../lib/format'
import { customerBalances, isRevenue } from '../../lib/selectors'
import { usePagination } from '../../lib/usePagination'

export default function CustomerList() {
  const { data } = useData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)

  const balances = useMemo(() => customerBalances(data), [data])
  const sales = useMemo(() => {
    const m = {}
    data.invoices.filter(isRevenue).forEach((i) => { m[i.customerId] = (m[i.customerId] || 0) + i.grandTotal })
    return m
  }, [data.invoices])

  const rows = useMemo(() => {
    const term = q.toLowerCase()
    return data.customers
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.phone?.includes(term) || c.email?.toLowerCase().includes(term))
      .filter((c) => filter === 'all' || (filter === 'due' ? (balances[c.id] || 0) > 0 : filter === 'b2b' ? !!c.gstin : !c.gstin))
  }, [data.customers, q, filter, balances])
  const pg = usePagination(rows, 15, `${q}|${filter}`)

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${data.customers.length} customers`} actions={<Button icon={Plus} onClick={() => setOpen(true)}>Add customer</Button>} />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, phone or email" className="sm:col-span-2" />
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
            <option value="all">All customers</option>
            <option value="due">With balance due</option>
            <option value="b2b">Business (GST registered)</option>
            <option value="b2c">Individual / unregistered</option>
          </Select>
        </div>
        <Table
          rows={pg.pageRows}
          onRowClick={(r) => navigate(`/customers/${r.id}`)}
          empty={<EmptyState icon={Users} title="No customers found" action={<Button icon={Plus} onClick={() => setOpen(true)}>Add customer</Button>} />}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{[r.city, r.state].filter(Boolean).join(', ')}</p></div> },
            { key: 'contact', header: 'Contact', render: (r) => <div className="text-xs"><p>{r.phone || '—'}</p><p className="text-slate-500">{r.email}</p></div> },
            { key: 'type', header: 'Type', render: (r) => r.gstin ? <Badge color="indigo">B2B</Badge> : <Badge>B2C</Badge> },
            { key: 'sales', header: 'Total sales', align: 'right', render: (r) => formatCurrency(sales[r.id] || 0) },
            { key: 'balance', header: 'Balance due', align: 'right', render: (r) => (balances[r.id] || 0) > 0 ? <span className="font-semibold text-amber-600">{formatCurrency(balances[r.id])}</span> : <span className="text-slate-400">₹0</span> },
          ]}
        />
        <Pagination {...pg} onChange={pg.setPage} />
      </Card>
      <CustomerFormModal open={open} onClose={() => setOpen(false)} onSaved={(c) => navigate(`/customers/${c.id}`)} />
    </div>
  )
}
