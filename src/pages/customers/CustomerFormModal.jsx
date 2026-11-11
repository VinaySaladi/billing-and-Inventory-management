import { useEffect, useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Field, Input, Modal, Select } from '../../components/ui'
import { INDIAN_STATES } from '../../lib/invoice'

const EMPTY = { name: '', phone: '', email: '', gstin: '', address: '', city: '', state: 'Telangana', pincode: '' }

/** Used for both customers and suppliers (`kind`). */
export default function CustomerFormModal({ open, onClose, initial, onSaved, kind = 'customer' }) {
  const { saveCustomer, saveSupplier, data } = useData()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) { setForm(initial ? { ...EMPTY, ...initial } : { ...EMPTY, state: data.business.address.state }); setErrors({}) }
  }, [open, initial, data.business.address.state])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const label = kind === 'supplier' ? 'supplier' : 'customer'

  const submit = (e) => {
    e?.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.'
    if (form.phone && !/^[+\d\s-]{8,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.'
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(form.gstin.toUpperCase())) errs.gstin = 'GSTIN should be 15 characters, e.g. 36ABCDE1234F1Z5.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload = { ...form, name: form.name.trim(), gstin: form.gstin.toUpperCase() }
    const res = kind === 'supplier' ? saveSupplier(payload) : saveCustomer(payload)
    if (!res.ok) return toast(res.error, 'error')
    toast(initial?.id ? `${label[0].toUpperCase() + label.slice(1)} updated` : `${label[0].toUpperCase() + label.slice(1)} added`)
    onSaved?.(res.value)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? `Edit ${label}` : `New ${label}`} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save {label}</Button></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Name" required error={errors.name} className="sm:col-span-2"><Input autoFocus value={form.name} onChange={set('name')} error={errors.name} /></Field>
        <Field label="Phone" error={errors.phone}><Input value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+91" /></Field>
        <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} error={errors.email} /></Field>
        <Field label="GSTIN" error={errors.gstin} hint="Leave empty for unregistered (B2C)." className="sm:col-span-2"><Input value={form.gstin} onChange={set('gstin')} error={errors.gstin} className="uppercase" /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
        <Field label="State" hint="Used to decide CGST+SGST vs IGST."><Select value={form.state} onChange={set('state')}>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Pincode"><Input value={form.pincode} onChange={set('pincode')} /></Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
