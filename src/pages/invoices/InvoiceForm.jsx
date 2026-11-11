import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Eye, Save, AlertTriangle, UserPlus } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea, Modal, EmptyState, cx } from '../../components/ui'
import InvoiceDocument from '../../components/InvoiceDocument'
import CustomerFormModal from '../customers/CustomerFormModal'
import { calcLine, calcTotals, PAYMENT_METHODS } from '../../lib/invoice'
import { formatCurrency, toDateInput, uid } from '../../lib/format'

const blankLine = () => ({ key: uid('l'), productId: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 })

export default function InvoiceForm() {
  const { id } = useParams()
  const { data, saveInvoice } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const existing = id ? data.invoices.find((i) => i.id === id) : null

  const due = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + Number(days)); return toDateInput(d) }

  const [customerId, setCustomerId] = useState(existing?.customerId || '')
  const [issueDate, setIssueDate] = useState(existing ? toDateInput(existing.issueDate) : toDateInput())
  const [dueDate, setDueDate] = useState(existing ? toDateInput(existing.dueDate) : due(new Date(), data.business.defaultDueDays))
  const [notes, setNotes] = useState(existing?.notes ?? data.business.invoiceNotes)
  const [lines, setLines] = useState(existing ? existing.items.map((it) => ({ ...it, key: it.id })) : [blankLine()])
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [custOpen, setCustOpen] = useState(false)
  const [payNow, setPayNow] = useState({ enabled: false, amount: '', method: 'cash', reference: '' })

  const customer = data.customers.find((c) => c.id === customerId)
  const interState = customer ? customer.state !== data.business.address.state : false
  const activeProducts = data.products.filter((p) => p.active)
  const totals = useMemo(() => calcTotals(lines, { interState }), [lines, interState])

  if (id && (!existing || existing.status !== 'draft')) {
    return <EmptyState title="This invoice can't be edited" message="Only drafts can be edited. Issued invoices are locked." action={<Button to={existing ? `/invoices/${id}` : '/invoices'}>Go back</Button>} />
  }

  const updateLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const pickProduct = (key, productId) => {
    const p = data.products.find((x) => x.id === productId)
    updateLine(key, p ? { productId, unitPrice: p.sellingPrice, taxRate: p.taxRate, productName: p.name } : { productId: '' })
  }

  const stockIssues = (() => {
    const need = {}
    lines.forEach((l) => { if (l.productId) need[l.productId] = (need[l.productId] || 0) + Number(l.quantity || 0) })
    return Object.fromEntries(Object.entries(need).filter(([pid, q]) => (data.products.find((p) => p.id === pid)?.stockQuantity ?? 0) < q))
  })()

  const input = () => ({
    id: existing?.id,
    customerId, issueDate, dueDate, notes,
    items: lines.filter((l) => l.productId || l.quantity).map((l) => ({ ...l, id: l.id })),
  })

  const validate = () => {
    const i = input()
    if (!customerId) return 'Select a customer.'
    if (!i.items.length || i.items.some((l) => !l.productId)) return 'Every line needs a product.'
    if (i.items.some((l) => !(Number(l.quantity) > 0))) return 'Quantities must be above 0.'
    if (new Date(dueDate) < new Date(issueDate)) return 'Due date cannot be before the invoice date.'
    return ''
  }

  const saveDraft = () => {
    const err = validate(); setError(err); if (err) return
    const res = saveInvoice(input())
    if (!res.ok) return setError(res.error)
    toast('Draft saved')
    navigate('/invoices?status=draft')
  }

  const openPreview = () => {
    const err = validate(); setError(err); if (err) return
    if (Object.keys(stockIssues).length) return setError('Some items don\'t have enough stock. Reduce the quantity or add stock first.')
    setPayNow((p) => ({ ...p, amount: String(totals.grandTotal) }))
    setPreviewOpen(true)
  }

  const issue = () => {
    const res = saveInvoice(input(), { issue: true, payment: payNow.enabled ? payNow : null })
    if (!res.ok) { setPreviewOpen(false); return setError(res.error) }
    toast(`Invoice ${res.value.invoiceNumber} issued`)
    navigate(`/invoices/${res.value.id}`)
  }

  const previewInvoice = {
    ...totals, interState, issueDate, dueDate, notes, status: 'draft', invoiceNumber: '', amountPaid: 0,
    placeOfSupply: customer?.state,
    customerSnapshot: customer,
    items: lines.map((l) => {
      const p = data.products.find((x) => x.id === l.productId)
      return { ...l, id: l.key, productName: p?.name, hsn: p?.hsn, unit: p?.unit, lineTotal: calcLine(l).lineTotal }
    }),
  }

  return (
    <div>
      <PageHeader
        title={existing ? 'Edit draft invoice' : 'New invoice'}
        subtitle="Totals here are a preview. The server recalculates them when the invoice is issued."
        back={{ to: '/invoices', label: 'Invoices' }}
        actions={<>
          <Button variant="secondary" icon={Save} onClick={saveDraft}>Save draft</Button>
          <Button icon={Eye} onClick={openPreview}>Preview & issue</Button>
        </>}
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Customer & dates" />
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Customer" required className="sm:col-span-2">
                <div className="flex gap-2">
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">Select customer</option>
                    {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Button variant="secondary" icon={UserPlus} onClick={() => setCustOpen(true)} aria-label="Add customer" />
                </div>
              </Field>
              <Field label="Invoice date"><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field>
              <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            </div>
            {customer && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                <span>{customer.gstin ? `GSTIN ${customer.gstin} (B2B)` : 'Unregistered (B2C)'}</span>
                <span>Place of supply: {customer.state}</span>
                <span className="font-medium text-slate-700">{interState ? 'Inter-state → IGST' : 'Intra-state → CGST + SGST'}</span>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Items" />
            <div className="hidden grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
              <span className="col-span-4">Product</span><span className="col-span-1 text-right">Qty</span><span className="col-span-2 text-right">Rate (₹)</span>
              <span className="col-span-2 text-right">Discount (₹)</span><span className="col-span-1 text-right">GST</span><span className="col-span-2 text-right">Amount</span>
            </div>
            <div className="divide-y divide-slate-100">
              {lines.map((l) => {
                const p = data.products.find((x) => x.id === l.productId)
                const short = stockIssues[l.productId] !== undefined
                return (
                  <div key={l.key} className="grid grid-cols-2 gap-2 px-5 py-3 md:grid-cols-12 md:items-start">
                    <div className="col-span-2 md:col-span-4">
                      <Select value={l.productId} onChange={(e) => pickProduct(l.key, e.target.value)} aria-label="Product">
                        <option value="">Select product</option>
                        {activeProducts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                      </Select>
                      {p && <p className={cx('mt-1 text-xs', short ? 'font-medium text-red-600' : 'text-slate-500')}>{short ? `Only ${p.stockQuantity} ${p.unit} in stock` : `${p.stockQuantity} ${p.unit} in stock`}</p>}
                    </div>
                    <label className="md:col-span-1"><span className="mb-1 block text-xs text-slate-500 md:hidden">Qty</span>
                      <Input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: e.target.value })} className={cx('text-right', short && 'border-red-400')} /></label>
                    <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-500 md:hidden">Rate</span>
                      <Input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })} className="text-right" /></label>
                    <label className="md:col-span-2"><span className="mb-1 block text-xs text-slate-500 md:hidden">Discount</span>
                      <Input type="number" min="0" step="0.01" value={l.discount} onChange={(e) => updateLine(l.key, { discount: e.target.value })} className="text-right" /></label>
                    <div className="flex items-center text-sm text-slate-600 md:col-span-1 md:h-9 md:justify-end"><span className="mr-1 text-xs text-slate-500 md:hidden">GST</span>{l.taxRate}%</div>
                    <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-2 md:h-9">
                      <span className="font-medium tabular-nums text-slate-900">{formatCurrency(calcLine(l).lineTotal)}</span>
                      <button onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [blankLine()])}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove line"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setLines((ls) => [...ls, blankLine()])}>Add line</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" subtitle="Shown at the bottom of the invoice" />
            <div className="p-5"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader title="Summary" />
          <dl className="space-y-2 p-5 text-sm">
            <SRow label="Subtotal" value={totals.subtotal} />
            <SRow label="Discount" value={-totals.discountTotal} />
            <SRow label="Taxable amount" value={totals.taxableTotal} />
            {interState ? <SRow label="IGST" value={totals.igst} /> : <><SRow label="CGST" value={totals.cgst} /><SRow label="SGST" value={totals.sgst} /></>}
            <SRow label="Round off" value={totals.roundOff} />
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{formatCurrency(totals.grandTotal)}</dd></div>
          </dl>
          <div className="space-y-2 border-t border-slate-100 p-5">
            <Button className="w-full" icon={Eye} onClick={openPreview}>Preview & issue</Button>
            <Button className="w-full" variant="secondary" icon={Save} onClick={saveDraft}>Save as draft</Button>
          </div>
        </Card>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview invoice" size="xl"
        footer={<>
          <Button variant="secondary" onClick={() => setPreviewOpen(false)}>Back to edit</Button>
          <Button variant="success" onClick={issue}>Issue invoice</Button>
        </>}>
        <InvoiceDocument invoice={previewInvoice} business={data.business} draft />
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={payNow.enabled} onChange={(e) => setPayNow({ ...payNow, enabled: e.target.checked })} />
            Payment received now
          </label>
          {payNow.enabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Amount (₹)"><Input type="number" min="0" max={totals.grandTotal} value={payNow.amount} onChange={(e) => setPayNow({ ...payNow, amount: e.target.value })} /></Field>
              <Field label="Method"><Select value={payNow.method} onChange={(e) => setPayNow({ ...payNow, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select></Field>
              <Field label="Reference"><Input value={payNow.reference} onChange={(e) => setPayNow({ ...payNow, reference: e.target.value })} placeholder="UPI ref / cheque no." /></Field>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">Issuing assigns the next invoice number, locks the invoice, and deducts stock.</p>
        </div>
      </Modal>

      <CustomerFormModal open={custOpen} onClose={() => setCustOpen(false)} onSaved={(c) => setCustomerId(c.id)} />
    </div>
  )
}

function SRow({ label, value }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{label}</dt><dd className="tabular-nums text-slate-800">{formatCurrency(value)}</dd></div>
}
