import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Archive, ArchiveRestore, SlidersHorizontal } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, CardHeader, PageHeader, Table, Badge, ConfirmDialog, EmptyState } from '../../components/ui'
import { StockBadge } from '../../components/StatusBadge'
import StockAdjustModal from '../inventory/StockAdjustModal'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { MOVEMENT_META } from '../../lib/invoice'
import { isRevenue } from '../../lib/selectors'

export default function ProductDetail() {
  const { id } = useParams()
  const { data, setProductActive } = useData()
  const toast = useToast()
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const product = data.products.find((p) => p.id === id)

  const movements = useMemo(() => data.stockMovements.filter((m) => m.productId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [data.stockMovements, id])

  const sales = useMemo(() => {
    let qty = 0, value = 0
    data.invoices.filter(isRevenue).forEach((inv) => inv.items.forEach((it) => {
      if (it.productId === id) { qty += it.quantity; value += it.lineTotal }
    }))
    return { qty, value }
  }, [data.invoices, id])

  if (!product) return <EmptyState title="Product not found" action={<Button to="/products">Back to products</Button>} />

  const category = data.categories.find((c) => c.id === product.categoryId)?.name || 'Uncategorised'

  const toggleArchive = () => {
    setProductActive(product.id, !product.active)
    toast(product.active ? 'Product archived' : 'Product restored')
    setArchiveOpen(false)
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`${product.sku || 'No SKU'} · ${category}`}
        back={{ to: '/products', label: 'Products' }}
        actions={<>
          <Button variant="secondary" icon={product.active ? Archive : ArchiveRestore} onClick={() => setArchiveOpen(true)}>{product.active ? 'Archive' : 'Restore'}</Button>
          <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setAdjustOpen(true)} disabled={!product.active}>Adjust stock</Button>
          <Button icon={Pencil} to={`/products/${product.id}/edit`}>Edit</Button>
        </>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">In stock</p><p className="mt-2 text-2xl font-semibold">{product.stockQuantity} <span className="text-sm font-normal text-slate-500">{product.unit}</span></p><div className="mt-1"><StockBadge product={product} /></div></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Selling price</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(product.sellingPrice)}</p><p className="mt-1 text-xs text-slate-500">+ {product.taxRate}% GST</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Cost price</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(product.costPrice)}</p><p className="mt-1 text-xs text-slate-500">Stock value {formatCurrency(product.costPrice * product.stockQuantity)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Total sold</p><p className="mt-2 text-2xl font-semibold">{sales.qty} <span className="text-sm font-normal text-slate-500">{product.unit}</span></p><p className="mt-1 text-xs text-slate-500">{formatCurrency(sales.value)} revenue</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title="Details" />
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['HSN / SAC', product.hsn || '—'],
              ['Unit', product.unit],
              ['GST rate', `${product.taxRate}%`],
              ['Low stock alert at', `${product.lowStockThreshold} ${product.unit}`],
              ['Status', product.active ? 'Active' : 'Archived'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-5 py-3"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v}</dd></div>
            ))}
          </dl>
          {product.description && <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">{product.description}</p>}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Stock history" subtitle="Every change to this product's stock" />
          <Table
            rows={movements.slice(0, 25)}
            columns={[
              { key: 'createdAt', header: 'Date', render: (r) => formatDateTime(r.createdAt) },
              { key: 'type', header: 'Type', render: (r) => <Badge color={MOVEMENT_META[r.movementType]?.color}>{MOVEMENT_META[r.movementType]?.label}</Badge> },
              { key: 'ref', header: 'Reference', render: (r) => r.referenceLabel || r.note || '—' },
              { key: 'delta', header: 'Change', align: 'right', render: (r) => <span className={r.quantityDelta > 0 ? 'font-medium text-emerald-600' : 'font-medium text-red-600'}>{r.quantityDelta > 0 ? '+' : ''}{r.quantityDelta}</span> },
            ]}
          />
        </Card>
      </div>

      <StockAdjustModal open={adjustOpen} onClose={() => setAdjustOpen(false)} product={product} />
      <ConfirmDialog
        open={archiveOpen} onClose={() => setArchiveOpen(false)} onConfirm={toggleArchive}
        title={product.active ? 'Archive product?' : 'Restore product?'}
        message={product.active
          ? 'Archived products are hidden from new invoices but stay on past invoices and reports.'
          : 'This product will be available on new invoices again.'}
        confirmLabel={product.active ? 'Archive' : 'Restore'}
        variant={product.active ? 'danger' : 'primary'}
      />
    </div>
  )
}
