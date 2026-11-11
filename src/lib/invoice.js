import { round2 } from './format'

/**
 * Calculates a single invoice line.
 * NOTE: In the real app the server recalculates all totals; this is for UI preview only.
 */
export function calcLine({ quantity, unitPrice, discount = 0, taxRate = 0 }) {
  const qty = Number(quantity) || 0
  const price = Number(unitPrice) || 0
  const disc = Math.min(Number(discount) || 0, qty * price)
  const taxable = round2(qty * price - disc)
  const taxAmount = round2((taxable * (Number(taxRate) || 0)) / 100)
  return { taxable, taxAmount, lineTotal: round2(taxable + taxAmount), discount: disc }
}

/**
 * Totals for a list of items. `interState` decides IGST vs CGST+SGST split.
 */
export function calcTotals(items, { interState = false } = {}) {
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0
  const taxBreakup = {}

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    const line = calcLine(item)
    subtotal += qty * price
    discountTotal += line.discount
    taxTotal += line.taxAmount
    const rate = Number(item.taxRate) || 0
    if (!taxBreakup[rate]) taxBreakup[rate] = { rate, taxable: 0, tax: 0 }
    taxBreakup[rate].taxable += line.taxable
    taxBreakup[rate].tax += line.taxAmount
  })

  const raw = subtotal - discountTotal + taxTotal
  const grandTotal = Math.round(raw)
  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxableTotal: round2(subtotal - discountTotal),
    taxTotal: round2(taxTotal),
    cgst: interState ? 0 : round2(taxTotal / 2),
    sgst: interState ? 0 : round2(taxTotal / 2),
    igst: interState ? round2(taxTotal) : 0,
    roundOff: round2(grandTotal - raw),
    grandTotal,
    taxBreakup: Object.values(taxBreakup)
      .filter((b) => b.rate > 0)
      .map((b) => ({ ...b, taxable: round2(b.taxable), tax: round2(b.tax) })),
  }
}

export const balanceDue = (invoice) => round2((invoice.grandTotal || 0) - (invoice.amountPaid || 0))

export const STATUS_META = {
  draft: { label: 'Draft', color: 'slate' },
  issued: { label: 'Unpaid', color: 'amber' },
  partially_paid: { label: 'Partially paid', color: 'blue' },
  paid: { label: 'Paid', color: 'green' },
  void: { label: 'Void', color: 'red' },
}

export const isOverdue = (invoice) =>
  ['issued', 'partially_paid'].includes(invoice.status) &&
  invoice.dueDate && new Date(invoice.dueDate) < new Date(new Date().toDateString())

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

export const MOVEMENT_META = {
  opening: { label: 'Opening stock', color: 'slate' },
  purchase: { label: 'Purchase', color: 'green' },
  sale: { label: 'Sale', color: 'blue' },
  sale_return: { label: 'Sale return', color: 'teal' },
  purchase_return: { label: 'Purchase return', color: 'orange' },
  adjustment: { label: 'Adjustment', color: 'purple' },
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export const GST_RATES = [0, 5, 12, 18, 28]
export const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'dozen', 'm']
