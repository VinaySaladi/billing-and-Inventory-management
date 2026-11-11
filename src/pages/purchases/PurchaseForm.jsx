import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import CustomerFormModal from '../customers/CustomerFormModal'
import { formatCurrency, toDateInput, uid } from '../../lib/format'

const blank = () => ({ key: uid('l'), productId: '', quantity: 1, unitCost: 0, taxRate: 0 })

export default function PurchaseForm() {
  const { data, createPurchase } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ supplierId: '', billNumber: '', date: toDateInput(), status: 'unpaid', notes: '' })
  const [lines, setLines] = useState([blank()])
  const [error, setError] = useState('')
  const [supOpen, setSupOpen] = useState(false)

  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const pick = (key, pid) => {
    const p = data.products.find((x) => x.id === pid)
    update(key, p ? { productId: pid, unitCost: p.costPrice, taxRate: p.taxRate } : { productId: '' })
  }
  const subtotal = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitCost), 0)
  const tax = lines.reduce((s, l) => s + (Number(l.quantity) * Number(l.unitCost) * Number(l.taxRate)) / 100, 0)

  const save = () => {
    if (!form.billNumber.trim()) return setError('Enter the supplier bill number.')
    const res = createPurchase({ ...form, items: lines })
    if (!res.ok) return setError(res.error)
    toast(`Purchase saved. Stock added for ${lines.length} item${lines.length > 1 ? 's' : ''}.`)
    navigate('/purchases')
  }

  return (
    <div>
      <PageHeader title="Record purchase" back={{ to: '/purchases', label: 'Purchases' }}
        actions={<><Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button onClick={save}>Save purchase</Button></>} />
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-6">
        <Card>
          <CardHeader title="Bill details" />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Supplier" required>
              <div className="flex gap-2">
                <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">Select supplier</option>
                  {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Button variant="secondary" onClick={() => setSupOpen(true)}>New</Button>
              </div>
            </Field>
            <Field label="Supplier bill #" required><Input value={form.billNumber} onChange={(e) => setForm({ ...form, billNumber: e.target.value })} /></Field>
            <Field label="Bill date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Payment status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></Select></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Items received" subtitle="These quantities will be added to stock." />
          <div className="divide-y divide-slate-100">
            {lines.map((l) => (
              <div key={l.key} className="grid grid-cols-2 gap-2 px-5 py-3 md:grid-cols-12 md:items-end">
                <Field label="Product" className="col-span-2 md:col-span-5">
                  <Select value={l.productId} onChange={(e) => pick(l.key, e.target.value)}>
                    <option value="">Select product</option>
                    {data.products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <Field label="Qty" className="md:col-span-2"><Input type="number" min="1" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} /></Field>
                <Field label="Unit cost (₹)" className="md:col-span-2"><Input type="number" min="0" step="0.01" value={l.unitCost} onChange={(e) => update(l.key, { unitCost: e.target.value })} /></Field>
                <Field label="GST %" className="md:col-span-1"><Input type="number" min="0" value={l.taxRate} onChange={(e) => update(l.key, { taxRate: e.target.value })} /></Field>
                <div className="col-span-2 flex h-9 items-center justify-end gap-2 md:col-span-2">
                  <span className="font-medium tabular-nums">{formatCurrency(Number(l.quantity) * Number(l.unitCost) * (1 + Number(l.taxRate) / 100))}</span>
                  <button onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [blank()])} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove line"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" size="sm" icon={Plus} onClick={() => setLines((ls) => [...ls, blank()])}>Add line</Button>
            <div className="text-sm text-slate-600">Subtotal {formatCurrency(subtotal)} · GST {formatCurrency(tax)} · <span className="font-semibold text-slate-900">Total {formatCurrency(subtotal + tax)}</span></div>
          </div>
        </Card>
        <Card><CardHeader title="Notes" /><div className="p-5"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></Card>
      </div>
      <CustomerFormModal kind="supplier" open={supOpen} onClose={() => setSupOpen(false)} onSaved={(s) => setForm((f) => ({ ...f, supplierId: s.id }))} />
    </div>
  )
}
