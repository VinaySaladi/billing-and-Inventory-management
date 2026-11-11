import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Plus, Phone, Mail, MapPin, Receipt } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, CardHeader, PageHeader, Table, EmptyState, Badge, StatCard } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import CustomerFormModal from './CustomerFormModal'
import { formatCurrency, formatDate } from '../../lib/format'
import { balanceDue } from '../../lib/invoice'
import { isRevenue } from '../../lib/selectors'

export default function CustomerDetail() {
  const { id } = useParams()
  const { data } = useData()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const customer = data.customers.find((c) => c.id === id)

  const invoices = useMemo(() => data.invoices.filter((i) => i.customerId === id)
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)), [data.invoices, id])

  if (!customer) return <EmptyState title="Customer not found" action={<Button to="/customers">Back to customers</Button>} />

  const revenue = invoices.filter(isRevenue)
  const totalSales = revenue.reduce((s, i) => s + i.grandTotal, 0)
  const paid = revenue.reduce((s, i) => s + i.amountPaid, 0)
  const due = revenue.reduce((s, i) => s + balanceDue(i), 0)

  return (
    <div>
      <PageHeader
        title={<span className="flex items-center gap-3">{customer.name} {customer.gstin ? <Badge color="indigo">B2B</Badge> : <Badge>B2C</Badge>}</span>}
        back={{ to: '/customers', label: 'Customers' }}
        actions={<>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
          <Button icon={Plus} to="/invoices/new">New invoice</Button>
        </>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total sales" value={formatCurrency(totalSales)} />
        <StatCard label="Received" value={formatCurrency(paid)} />
        <StatCard label="Balance due" value={formatCurrency(due)} tone="amber" />
        <StatCard label="Invoices" value={revenue.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="Contact & billing" />
          <ul className="space-y-3 p-5 text-sm text-slate-700">
            <li className="flex gap-3"><Phone className="h-4 w-4 text-slate-400" />{customer.phone || '—'}</li>
            <li className="flex gap-3"><Mail className="h-4 w-4 text-slate-400" />{customer.email || '—'}</li>
            <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-slate-400" /><span>{[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || '—'}</span></li>
            <li className="flex gap-3"><Receipt className="h-4 w-4 text-slate-400" />{customer.gstin ? `GSTIN ${customer.gstin}` : 'Not GST registered'}</li>
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Invoices" />
          <Table
            rows={invoices}
            onRowClick={(r) => navigate(r.status === 'draft' ? `/invoices/${r.id}/edit` : `/invoices/${r.id}`)}
            empty={<EmptyState title="No invoices yet" action={<Button icon={Plus} to="/invoices/new">Create invoice</Button>} />}
            columns={[
              { key: 'n', header: 'Invoice', render: (r) => <span className="font-medium text-slate-900">{r.invoiceNumber || 'Draft'}</span> },
              { key: 'd', header: 'Date', render: (r) => formatDate(r.issueDate) },
              { key: 's', header: 'Status', render: (r) => <StatusBadge invoice={r} /> },
              { key: 't', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.grandTotal) },
              { key: 'b', header: 'Balance', align: 'right', render: (r) => ['draft', 'void'].includes(r.status) ? '—' : formatCurrency(balanceDue(r)) },
            ]}
          />
        </Card>
      </div>
      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} initial={customer} />
    </div>
  )
}
