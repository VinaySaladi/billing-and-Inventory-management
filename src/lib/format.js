const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const inrShort = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatCurrency = (value) => inr.format(Number(value) || 0)
export const formatCurrencyShort = (value) => inrShort.format(Number(value) || 0)

export const formatCompactCurrency = (value) => {
  const n = Number(value) || 0
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0)

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// yyyy-mm-dd in local time, for <input type="date">
export const toDateInput = (date = new Date()) => {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
