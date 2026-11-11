import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, PageHeader, SearchInput, Table, Tabs, Pagination, EmptyState, Input } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../lib/format'
import { balanceDue, isOverdue } from '../../lib/invoice'
import { usePagination } from '../../lib/usePagination'

const FILTERS = {
  all: () => true,
  draft: (i) => i.status === 'draft',
  unpaid: (i) => ['issued', 'partially_paid'].includes(i.status),
  overdue: (i) => isOverdue(i),
  paid: (i) => i.status === 'paid',
  void: (i) => i.status === 'void',
}

export default function InvoiceList() {
  const { data } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const base = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.invoices
      .filter((i) => !term || i.invoiceNumber.toLowerCase().includes(term) || i.customerSnapshot?.name.toLowerCase().includes(term))
      .filter((i) => !from || new Date(i.issueDate) >= new Date(from))
      .filter((i) => !to || new Date(i.issueDate) <= new Date(`${to}T23:59:59`))
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate) || (b.invoiceNumber || '').localeCompare(a.invoiceNumber || ''))
  }, [data.invoices, q, from, to])

  const rows = base.filter(FILTERS[status] || FILTERS.all)
  const pg = usePagination(rows, 15, `${q}|${status}|${from}|${to}`)
  const count = (k) => base.filter(FILTERS[k]).length

  const totals = rows.reduce((acc, i) => {
    if (i.status === 'draft' || i.status === 'void') return acc
    acc.total += i.grandTotal; acc.due += balanceDue(i); return acc
  }, { total: 0, due: 0 })

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Create, track and collect payments"
        actions={<Button icon={Plus} to="/invoices/new">New invoice</Button>} />
      <Card>
        <div className="px-4 pt-2">
          <Tabs value={status} onChange={(v) => setParams(v === 'all' ? {} : { status: v }, { replace: true })}
            tabs={[
              { value: 'all', label: 'All', count: count('all') },
              { value: 'draft', label: 'Drafts', count: count('draft') },
              { value: 'unpaid', label: 'Unpaid', count: count('unpaid') },
              { value: 'overdue', label: 'Overdue', count: count('overdue') },
              { value: 'paid', label: 'Paid', count: count('paid') },
              { value: 'void', label: 'Void', count: count('void') },
            ]} />
        </div>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-4">
          <SearchInput value={q} onChange={setQ} placeholder="Invoice # or customer" className="sm:col-span-2" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        </div>
        <Table
          rows={pg.pageRows}
          onRowClick={(r) => navigate(r.status === 'draft' ? `/invoices/${r.id}/edit` : `/invoices/${r.id}`)}
          empty={<EmptyState icon={FileText} title="No invoices found" message="Change the filters or create a new invoice." action={<Button icon={Plus} to="/invoices/new">New invoice</Button>} />}
          columns={[
            { key: 'invoiceNumber', header: 'Invoice', render: (r) => <span className="font-medium text-slate-900">{r.invoiceNumber || <span className="italic text-slate-400">Draft</span>}</span> },
            { key: 'customer', header: 'Customer', render: (r) => r.customerSnapshot?.name },
            { key: 'issueDate', header: 'Date', render: (r) => formatDate(r.issueDate) },
            { key: 'dueDate', header: 'Due', render: (r) => <span className={isOverdue(r) ? 'text-red-600' : ''}>{formatDate(r.dueDate)}</span> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge invoice={r} /> },
            { key: 'grandTotal', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.grandTotal) },
            { key: 'due', header: 'Balance', align: 'right', render: (r) => ['draft', 'void'].includes(r.status) ? '—' : <span className={balanceDue(r) > 0 ? 'font-medium text-slate-900' : 'text-slate-400'}>{formatCurrency(balanceDue(r))}</span> },
          ]}
        />
        <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>Total: <span className="font-semibold text-slate-900">{formatCurrency(totals.total)}</span></span>
          <span>Balance due: <span className="font-semibold text-slate-900">{formatCurrency(totals.due)}</span></span>
        </div>
        <Pagination {...pg} onChange={pg.setPage} />
      </Card>
    </div>
  )
}
