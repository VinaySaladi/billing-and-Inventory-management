import { Badge } from './ui'
import { STATUS_META, isOverdue } from '../lib/invoice'

export default function StatusBadge({ invoice }) {
  if (isOverdue(invoice)) return <Badge color="red">Overdue</Badge>
  const meta = STATUS_META[invoice.status] || STATUS_META.draft
  return <Badge color={meta.color}>{meta.label}</Badge>
}

export function StockBadge({ product }) {
  if (!product.active) return <Badge color="slate">Archived</Badge>
  if (product.stockQuantity <= 0) return <Badge color="red">Out of stock</Badge>
  if (product.stockQuantity <= product.lowStockThreshold) return <Badge color="amber">Low stock</Badge>
  return <Badge color="green">In stock</Badge>
}
