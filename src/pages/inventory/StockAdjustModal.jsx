import { useEffect, useState } from 'react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Field, Input, Modal, Select, Textarea, cx } from '../../components/ui'

const REASONS = ['Stock count correction', 'Damaged goods', 'Expired goods', 'Lost / theft', 'Customer return', 'Returned to supplier', 'Other']

/** Manual stock change. Always asks for a reason (design doc 10.4). */
export default function StockAdjustModal({ open, onClose, product: fixedProduct }) {
  const { data, adjustStock } = useData()
  const toast = useToast()
  const [productId, setProductId] = useState('')
  const [direction, setDirection] = useState('add')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setProductId(fixedProduct?.id || ''); setDirection('add'); setQty(''); setReason(REASONS[0]); setNote(''); setError('') }
  }, [open, fixedProduct])

  const product = data.products.find((p) => p.id === productId)
  const delta = (direction === 'add' ? 1 : -1) * (Number(qty) || 0)

  const submit = () => {
    if (!product) return setError('Select a product.')
    if (!(Number(qty) > 0)) return setError('Enter a quantity above 0.')
    const type = reason === 'Customer return' ? 'sale_return' : reason === 'Returned to supplier' ? 'purchase_return' : 'adjustment'
    const res = adjustStock(product.id, delta, note ? `${reason}: ${note}` : reason, type)
    if (!res.ok) return setError(res.error)
    toast(`Stock updated for ${product.name}`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Adjust stock"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save adjustment</Button></>}>
      <div className="space-y-4">
        {!fixedProduct && (
          <Field label="Product" required>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product</option>
              {data.products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stockQuantity} {p.unit})</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-2">
          {[['add', 'Add stock'], ['remove', 'Remove stock']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setDirection(v)}
              className={cx('rounded-lg border px-3 py-2 text-sm font-medium', direction === v
                ? (v === 'add' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700')
                : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>{l}</button>
          ))}
        </div>
        <Field label="Quantity" required><Input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Reason" required><Select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Note"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional details" /></Field>
        {product && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Stock: <span className="font-medium">{product.stockQuantity}</span> → <span className={cx('font-semibold', product.stockQuantity + delta < 0 ? 'text-red-600' : 'text-slate-900')}>{product.stockQuantity + delta}</span> {product.unit}
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
