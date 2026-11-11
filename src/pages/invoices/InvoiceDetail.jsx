import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer, IndianRupee, Ban, Pencil, Send, Trash2 } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Textarea, EmptyState, ConfirmDialog } from '../../components/ui'
import StatusBadge from '../../components/StatusBadge'
import InvoiceDocument from '../../components/InvoiceDocument'
import { formatCurrency, formatDate, formatDateTime, toDateInput } from '../../lib/format'
import { balanceDue, PAYMENT_METHODS } from '../../lib/invoice'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { data, recordPayment, voidInvoice, issueInvoice, deleteDraft } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const invoice = data.invoices.find((i) => i.id === id)
  const [payOpen, setPayOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', method: 'upi', reference: '', receivedAt: toDateInput() })
  const [voidForm, setVoidForm] = useState({ reason: '', restock: true })
  const [error, setError] = useState('')

  if (!invoice) return <EmptyState title="Invoice not found" action={<Button to="/invoices">Back to invoices</Button>} />

  const due = balanceDue(invoice)
  const payable = ['issued', 'partially_paid'].includes(invoice.status)
  const methodLabel = (m) => PAYMENT_METHODS.find((x) => x.value === m)?.label || m

  const openPay = () => { setPay({ amount: String(due), method: 'upi', reference: '', receivedAt: toDateInput() }); setError(''); setPayOpen(true) }
  const submitPay = () => {
    const res = recordPayment(invoice.id, pay)
    if (!res.ok) return setError(res.error)
    toast(`Payment of ${formatCurrency(pay.amount)} recorded`)
    setPayOpen(false)
  }
  const submitVoid = () => {
    const res = voidInvoice(invoice.id, voidForm.reason, voidForm.restock)
    if (!res.ok) return setError(res.error)
    toast(`Invoice ${invoice.invoiceNumber} voided`)
    setVoidOpen(false)
  }
  const issueDraft = () => {
    const res = issueInvoice(invoice.id)
    if (!res.ok) return toast(res.error, 'error')
    toast(`Invoice ${res.value.invoiceNumber} issued`)
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={<span className="flex items-center gap-3">{invoice.invoiceNumber || 'Draft invoice'} <StatusBadge invoice={invoice} /></span>}
          subtitle={`${invoice.customerSnapshot?.name} · ${formatDate(invoice.issueDate)}`}
          back={{ to: '/invoices', label: 'Invoices' }}
          actions={<>
            {invoice.status === 'draft' && <>
              <Button variant="secondary" icon={Trash2} onClick={() => setDeleteOpen(true)}>Delete</Button>
              <Button variant="secondary" icon={Pencil} to={`/invoices/${invoice.id}/edit`}>Edit</Button>
              <Button icon={Send} onClick={issueDraft}>Issue</Button>
            </>}
            {invoice.status !== 'draft' && <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>}
            {!['draft', 'void'].includes(invoice.status) && <Button variant="secondary" icon={Ban} onClick={() => { setError(''); setVoidForm({ reason: '', restock: true }); setVoidOpen(true) }}>Void</Button>}
            {payable && <Button icon={IndianRupee} onClick={openPay}>Record payment</Button>}
          </>}
        />
      </div>

      {invoice.status === 'void' && (
        <div className="no-print mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">This invoice was voided. Reason: {invoice.voidReason}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3 print:block">
        <div className="xl:col-span-2"><InvoiceDocument invoice={invoice} business={data.business} /></div>
        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Payment summary" />
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Invoice total</dt><dd className="font-medium">{formatCurrency(invoice.grandTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="font-medium text-emerald-600">{formatCurrency(invoice.amountPaid)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base"><dt className="font-medium text-slate-900">Balance due</dt><dd className="font-semibold text-slate-900">{formatCurrency(invoice.status === 'void' ? 0 : due)}</dd></div>
            </dl>
            {invoice.grandTotal > 0 && invoice.status !== 'void' && (
              <div className="px-5 pb-5">
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (invoice.amountPaid / invoice.grandTotal) * 100)}%` }} /></div>
              </div>
            )}
          </Card>
          <Card>
            <CardHeader title="Payments" subtitle={`${invoice.payments.length} recorded`} />
            {invoice.payments.length ? (
              <ul className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{methodLabel(p.method)}{p.reference && <span className="font-normal text-slate-500"> · {p.reference}</span>}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(p.receivedAt)}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-emerald-600">{formatCurrency(p.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-6 text-center text-sm text-slate-500">No payments yet.</p>}
          </Card>
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-slate-100 text-sm">
              {[
                ['Customer', <button key="c" className="text-indigo-600 hover:underline" onClick={() => navigate(`/customers/${invoice.customerId}`)}>{invoice.customerSnapshot?.name}</button>],
                ['Tax type', invoice.interState ? 'IGST (inter-state)' : 'CGST + SGST'],
                ['Created by', invoice.createdBy],
                ['Created', formatDateTime(invoice.createdAt)],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800">{v}</dd></div>)}
            </dl>
          </Card>
        </div>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment"
        footer={<><Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={submitPay}>Save payment</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)" required hint={`Balance due: ${formatCurrency(due)}`}><Input type="number" min="0" max={due} step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={pay.receivedAt} onChange={(e) => setPay({ ...pay, receivedAt: e.target.value })} /></Field>
          <Field label="Method"><Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select></Field>
          <Field label="Reference"><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="UPI ref / cheque no." /></Field>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Modal>

      <Modal open={voidOpen} onClose={() => setVoidOpen(false)} title={`Void ${invoice.invoiceNumber}?`}
        footer={<><Button variant="secondary" onClick={() => setVoidOpen(false)}>Cancel</Button><Button variant="danger" onClick={submitVoid}>Void invoice</Button></>}>
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Voiding can't be undone. The invoice stays in your records, marked as void.</p>
        <Field label="Reason" required><Textarea value={voidForm.reason} onChange={(e) => setVoidForm({ ...voidForm, reason: e.target.value })} /></Field>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={voidForm.restock} onChange={(e) => setVoidForm({ ...voidForm, restock: e.target.checked })} />
          Return items to stock
        </label>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Modal>

      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete draft?" message="This draft will be removed. It has no invoice number and no stock effect."
        confirmLabel="Delete draft" onConfirm={() => { deleteDraft(invoice.id); toast('Draft deleted'); navigate('/invoices') }} />
    </div>
  )
}
