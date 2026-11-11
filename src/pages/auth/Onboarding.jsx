import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, Receipt, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { Button, Card, Field, Input, Select, cx } from '../../components/ui'
import { INDIAN_STATES } from '../../lib/invoice'

const STEPS = [
  { title: 'Business details', icon: Building2 },
  { title: 'Invoice & tax', icon: Receipt },
]

export default function Onboarding() {
  const { session, completeOnboarding } = useAuth()
  const { data, updateBusiness } = useData()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '', phone: '', line1: '', city: '', state: 'Telangana', pincode: '',
    gstRegistered: 'yes', gstin: '', invoicePrefix: 'INV', currency: 'INR', defaultDueDays: 15,
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (!session) return <Navigate to="/login" replace />
  if (session.onboarded) return <Navigate to="/dashboard" replace />

  const next = () => {
    const errs = {}
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Business name is required.'
      if (!form.city.trim()) errs.city = 'City is required.'
    } else {
      if (form.gstRegistered === 'yes' && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(form.gstin.toUpperCase())) {
        errs.gstin = 'Enter a valid 15-character GSTIN.'
      }
      if (!form.invoicePrefix.trim()) errs.invoicePrefix = 'Prefix is required.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (step === 0) return setStep(1)

    updateBusiness({
      name: form.name,
      legalName: form.name,
      phone: form.phone,
      gstin: form.gstRegistered === 'yes' ? form.gstin.toUpperCase() : '',
      invoicePrefix: form.invoicePrefix.toUpperCase(),
      defaultDueDays: Number(form.defaultDueDays),
      address: { ...data.business.address, line1: form.line1, line2: '', city: form.city, state: form.state, pincode: form.pincode },
    })
    completeOnboarding()
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Set up your business</h1>
          <p className="mt-1 text-sm text-slate-500">This appears on your invoices. You can change it later in Settings.</p>
        </div>
        <ol className="mb-6 flex items-center justify-center gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-2">
              <span className={cx('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500')}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cx('text-sm font-medium', i === step ? 'text-slate-900' : 'text-slate-500')}>{s.title}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-slate-300" />}
            </li>
          ))}
        </ol>
        <Card className="p-6">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={set('name')} error={errors.name} placeholder="e.g. Sri Sai Traders" /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+91" /></Field>
              <Field label="Pincode"><Input value={form.pincode} onChange={set('pincode')} /></Field>
              <Field label="Address" className="sm:col-span-2"><Input value={form.line1} onChange={set('line1')} placeholder="Shop no., street, area" /></Field>
              <Field label="City" required error={errors.city}><Input value={form.city} onChange={set('city')} error={errors.city} /></Field>
              <Field label="State"><Select value={form.state} onChange={set('state')}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Are you GST registered?" className="sm:col-span-2">
                <div className="flex gap-3">
                  {['yes', 'no'].map((v) => (
                    <label key={v} className={cx('flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', form.gstRegistered === v ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300')}>
                      <input type="radio" name="gst" value={v} checked={form.gstRegistered === v} onChange={set('gstRegistered')} />
                      {v === 'yes' ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
              </Field>
              {form.gstRegistered === 'yes' && (
                <Field label="GSTIN" required error={errors.gstin} className="sm:col-span-2"><Input value={form.gstin} onChange={set('gstin')} error={errors.gstin} placeholder="36ABCDE1234F1Z5" className="uppercase" /></Field>
              )}
              <Field label="Invoice prefix" required error={errors.invoicePrefix} hint="Invoices will be numbered like INV-0001."><Input value={form.invoicePrefix} onChange={set('invoicePrefix')} className="uppercase" /></Field>
              <Field label="Default payment terms"><Select value={form.defaultDueDays} onChange={set('defaultDueDays')}>{[0, 7, 15, 30, 45].map((d) => <option key={d} value={d}>{d === 0 ? 'Due on receipt' : `${d} days`}</option>)}</Select></Field>
              <Field label="Currency"><Select value={form.currency} disabled><option value="INR">INR (₹)</option></Select></Field>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} disabled={step === 0}>Back</Button>
            <Button onClick={next}>{step === 0 ? 'Continue' : 'Finish setup'}</Button>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-slate-500">Demo note: sample products, customers, and invoices are already loaded so you can explore.</p>
      </div>
    </div>
  )
}
