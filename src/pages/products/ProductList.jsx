import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { Button, Card, PageHeader, SearchInput, Select, Table, Pagination, EmptyState } from '../../components/ui'
import { StockBadge } from '../../components/StatusBadge'
import { formatCurrency } from '../../lib/format'
import { usePagination } from '../../lib/usePagination'

export default function ProductList() {
  const { data } = useData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('active')
  const [sort, setSort] = useState('name')

  const catName = (id) => data.categories.find((c) => c.id === id)?.name || '—'

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.products
      .filter((p) => (status === 'all' ? true : status === 'active' ? p.active : status === 'archived' ? !p.active
        : status === 'low' ? p.active && p.stockQuantity <= p.lowStockThreshold : true))
      .filter((p) => !category || p.categoryId === category)
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term))
      .sort((a, b) => {
        if (sort === 'stock') return a.stockQuantity - b.stockQuantity
        if (sort === 'price') return b.sellingPrice - a.sellingPrice
        return a.name.localeCompare(b.name)
      })
  }, [data.products, q, category, status, sort])

  const pg = usePagination(rows, 12, `${q}|${category}|${status}|${sort}`)

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${data.products.filter((p) => p.active).length} active products`}
        actions={<Button icon={Plus} to="/products/new">Add product</Button>}
      />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or SKU" className="lg:col-span-1" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="active">Active</option>
            <option value="low">Low stock</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock (low first)</option>
            <option value="price">Sort: Price (high first)</option>
          </Select>
        </div>
        <Table
          rows={pg.pageRows}
          onRowClick={(r) => navigate(`/products/${r.id}`)}
          empty={<EmptyState icon={Package} title="No products found" message="Try a different search or add a new product." action={<Button icon={Plus} to="/products/new">Add product</Button>} />}
          columns={[
            { key: 'name', header: 'Product', render: (r) => (
              <div><p className="font-medium text-slate-900">{r.name}</p><p className="text-xs text-slate-500">{r.sku || 'No SKU'}</p></div>
            ) },
            { key: 'category', header: 'Category', render: (r) => catName(r.categoryId) },
            { key: 'sellingPrice', header: 'Price', align: 'right', render: (r) => formatCurrency(r.sellingPrice) },
            { key: 'taxRate', header: 'GST', align: 'right', render: (r) => `${r.taxRate}%` },
            { key: 'stockQuantity', header: 'Stock', align: 'right', render: (r) => <span className="font-medium">{r.stockQuantity} <span className="text-xs font-normal text-slate-500">{r.unit}</span></span> },
            { key: 'status', header: 'Status', render: (r) => <StockBadge product={r} /> },
          ]}
        />
        <Pagination {...pg} onChange={pg.setPage} />
      </Card>
    </div>
  )
}
