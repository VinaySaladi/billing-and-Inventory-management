import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea, Modal } from '../../components/ui'
import { GST_RATES, UNITS } from '../../lib/invoice'
import { formatCurrency } from '../../lib/format'

const EMPTY = {
  name: '', sku: '', hsn: '', categoryId: '', unit: 'pcs', costPrice: '', sellingPrice: '',
  taxRate: 18, lowStockThreshold: 10, openingStock: '', description: '',
}

export default function ProductForm() {
  const { id } = useParams()
  const { data, addProduct, updateProduct, addCategory } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const existing = id ? data.products.find((p) => p.id === id) : null
  const [form, setForm] = useState(existing ? { ...EMPTY, ...existing } : EMPTY)
  const [errors, setErrors] = useState({})
  const [catOpen, setCatOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (id && !existing) return <p className="text-sm text-slate-500">Product not found.</p>

  const margin = Number(form.sellingPrice) - Number(form.costPrice)
  const marginPct = Number(form.sellingPrice) > 0 ? (margin / Number(form.sellingPrice)) * 100 : 0

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) errs.sellingPrice = 'Enter a selling price.'
    if (Number(form.costPrice) < 0) errs.costPrice = 'Cannot be negative.'
    if (Number(form.lowStockThreshold) < 0) errs.lowStockThreshold = 'Cannot be negative.'
    if (Number(form.openingStock) < 0) errs.openingStock = 'Cannot be negative.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const payload = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice),
      taxRate: Number(form.taxRate),
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
    }
    const res = existing ? updateProduct(existing.id, payload) : addProduct(payload)
    if (!res.ok) { setErrors({ sku: res.error }); return toast(res.error, 'error') }
    toast(existing ? 'Product updated' : 'Product added')
    navigate(existing ? `/products/${existing.id}` : `/products/${res.value.id}`)
  }

  const saveCategory = () => {
    if (!newCat.trim()) return
    const res = addCategory(newCat)
    if (!res.ok) return toast(res.error, 'error')
    setForm({ ...form, categoryId: res.value.id })
    setNewCat(''); setCatOpen(false)
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={existing ? `Edit ${existing.name}` : 'Add product'}
        back={{ to: existing ? `/products/${existing.id}` : '/products', label: existing ? 'Back to product' : 'Products' }}
        actions={<>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit">{existing ? 'Save changes' : 'Save product'}</Button>
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Basic details" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Product name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={set('name')} error={errors.name} /></Field>
              <Field label="SKU" error={errors.sku} hint="Must be unique."><Input value={form.sku} onChange={set('sku')} error={errors.sku} /></Field>
              <Field label="HSN / SAC code"><Input value={form.hsn} onChange={set('hsn')} /></Field>
              <Field label="Category">
                <div className="flex gap-2">
                  <Select value={form.categoryId} onChange={set('categoryId')}>
                    <option value="">Uncategorised</option>
                    {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Button variant="secondary" onClick={() => setCatOpen(true)}>New</Button>
                </div>
              </Field>
              <Field label="Unit"><Select value={form.unit} onChange={set('unit')}>{[...new Set([...UNITS, form.unit])].map((u) => <option key={u}>{u}</option>)}</Select></Field>
              <Field label="Description" className="sm:col-span-2"><Textarea value={form.description} onChange={set('description')} /></Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Pricing & tax" />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Cost price (₹)" error={errors.costPrice}><Input type="number" min="0" step="0.01" value={form.costPrice} onChange={set('costPrice')} /></Field>
              <Field label="Selling price (₹)" required error={errors.sellingPrice}><Input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} error={errors.sellingPrice} /></Field>
              <Field label="GST rate"><Select value={form.taxRate} onChange={set('taxRate')}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</Select></Field>
            </div>
            {Number(form.sellingPrice) > 0 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                Margin: <span className={margin < 0 ? 'font-medium text-red-600' : 'font-medium text-slate-800'}>{formatCurrency(margin)} ({marginPct.toFixed(1)}%)</span>
                {' · '}Price incl. GST: <span className="font-medium text-slate-800">{formatCurrency(Number(form.sellingPrice) * (1 + Number(form.taxRate) / 100))}</span>
              </p>
            )}
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader title="Inventory" />
          <div className="space-y-4 p-5">
            {existing ? (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Current stock</p>
                <p className="text-lg font-semibold text-slate-900">{existing.stockQuantity} {existing.unit}</p>
                <p className="mt-1 text-xs text-slate-500">Change stock from the Inventory page so every change is recorded.</p>
              </div>
            ) : (
              <Field label="Opening stock" error={errors.openingStock} hint="Recorded as an opening-balance movement."><Input type="number" min="0" value={form.openingStock} onChange={set('openingStock')} /></Field>
            )}
            <Field label="Low stock alert at" error={errors.lowStockThreshold}><Input type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} /></Field>
          </div>
        </Card>
      </div>

      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="New category" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCatOpen(false)}>Cancel</Button><Button onClick={saveCategory}>Add category</Button></>}>
        <Field label="Category name"><Input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveCategory() } }} /></Field>
      </Modal>
    </form>
  )
}
