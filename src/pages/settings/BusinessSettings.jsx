import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea, ConfirmDialog } from '../../components/ui'
import SettingsTabs from './SettingsTabs'
import { INDIAN_STATES } from '../../lib/invoice'

export default function BusinessSettings() {
  const { data, updateBusiness, resetDemoData } = useData()
  const toast = useToast()
  const [form, setForm] = useState(() => ({ ...data.business, ...flatten(data.business) }))
  const [errors, setErrors] = useState({})
  const [resetOpen, setResetOpen] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required.'
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(form.gstin.toUpperCase())) errs.gstin = 'Enter a valid 15-character GSTIN.'
    if (!form.invoicePrefix.trim()) errs.invoicePrefix = 'Required.'
    setErrors(errs)
    if (Object.keys(errs).length) return toast('Please fix the highlighted fields', 'error')
    updateBusiness({
      name: form.name, legalName: form.legalName, gstin: form.gstin.toUpperCase(), phone: form.phone, email: form.email,
      invoicePrefix: form.invoicePrefix.toUpperCase(), defaultDueDays: Number(form.defaultDueDays),
      invoiceNotes: form.invoiceNotes, invoiceTerms: form.invoiceTerms,
      address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
      bank: { name: form.bankName, account: form.bankAccount, ifsc: form.bankIfsc, upi: form.bankUpi },
    })
    toast('Business settings saved')
  }

  return (
    <div>
      <PageHeader title="Settings" actions={<Button onClick={save}>Save changes</Button>} />
      <SettingsTabs />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Business profile" subtitle="Shown on your invoices" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Business name" required error={errors.name}><Input value={form.name} onChange={set('name')} error={errors.name} /></Field>
            <Field label="Legal name"><Input value={form.legalName} onChange={set('legalName')} /></Field>
            <Field label="GSTIN" error={errors.gstin}><Input value={form.gstin} onChange={set('gstin')} error={errors.gstin} className="uppercase" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
            <div />
            <Field label="Address line 1"><Input value={form.line1} onChange={set('line1')} /></Field>
            <Field label="Address line 2"><Input value={form.line2} onChange={set('line2')} /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
            <Field label="State"><Select value={form.state} onChange={set('state')}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Pincode"><Input value={form.pincode} onChange={set('pincode')} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Invoice settings" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Invoice prefix" required error={errors.invoicePrefix} hint={`Next invoice: ${form.invoicePrefix.toUpperCase()}-${String(data.business.nextInvoiceNumber).padStart(4, '0')}`}><Input value={form.invoicePrefix} onChange={set('invoicePrefix')} className="uppercase" /></Field>
            <Field label="Default payment terms"><Select value={form.defaultDueDays} onChange={set('defaultDueDays')}>{[0, 7, 15, 30, 45, 60].map((d) => <option key={d} value={d}>{d === 0 ? 'Due on receipt' : `${d} days`}</option>)}</Select></Field>
            <Field label="Default notes" className="sm:col-span-2"><Textarea value={form.invoiceNotes} onChange={set('invoiceNotes')} /></Field>
            <Field label="Terms & conditions" className="sm:col-span-2"><Textarea value={form.invoiceTerms} onChange={set('invoiceTerms')} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Bank & UPI details" subtitle="Printed on invoices so customers know where to pay" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Bank name"><Input value={form.bankName} onChange={set('bankName')} /></Field>
            <Field label="Account number"><Input value={form.bankAccount} onChange={set('bankAccount')} /></Field>
            <Field label="IFSC"><Input value={form.bankIfsc} onChange={set('bankIfsc')} className="uppercase" /></Field>
            <Field label="UPI ID"><Input value={form.bankUpi} onChange={set('bankUpi')} /></Field>
          </div>
        </Card>
        <Card className="border-red-200">
          <CardHeader title="Demo data" subtitle="Only in the UI prototype" />
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Reset all products, customers, invoices and stock back to the sample data.</p>
            <Button variant="danger" onClick={() => setResetOpen(true)}>Reset demo data</Button>
          </div>
        </Card>
      </div>
      <ConfirmDialog open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?"
        message="All changes you made will be lost and the sample data will be restored."
        confirmLabel="Reset" onConfirm={() => { resetDemoData(); setResetOpen(false); toast('Demo data reset'); window.location.reload() }} />
    </div>
  )
}

function flatten(b) {
  return {
    line1: b.address.line1, line2: b.address.line2, city: b.address.city, state: b.address.state, pincode: b.address.pincode,
    bankName: b.bank?.name || '', bankAccount: b.bank?.account || '', bankIfsc: b.bank?.ifsc || '', bankUpi: b.bank?.upi || '',
  }
}
