/**
 * Mock data for the UI phase.
 * Shapes mirror the tables in the system design doc (camelCase here; snake_case in the DB).
 * In step 2 these will come from the Node.js API instead.
 */
import { calcLine, calcTotals } from '../lib/invoice'
import { round2 } from '../lib/format'

// Small seeded RNG so the mock data is the same on every load
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
const rand = seeded(42)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min

const daysAgo = (n, hour = 11) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, between(0, 59), 0, 0)
  return d.toISOString()
}
const addDays = (iso, n) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export const business = {
  id: 'biz_1',
  name: 'Sri Sai Traders',
  legalName: 'Sri Sai Traders Pvt Ltd',
  gstin: '36ABCDE1234F1Z5',
  phone: '+91 98480 12345',
  email: 'accounts@srisaitraders.example',
  address: { line1: '12-4-56, Main Road', line2: 'Ameerpet', city: 'Hyderabad', state: 'Telangana', pincode: '500016' },
  currency: 'INR',
  invoicePrefix: 'INV',
  nextInvoiceNumber: 1,
  financialYearStart: 'April',
  defaultDueDays: 15,
  invoiceNotes: 'Thank you for your business!',
  invoiceTerms: 'Goods once sold will not be taken back. Payment due within 15 days.',
  bank: { name: 'State Bank of India', account: 'XXXXXXXX4321', ifsc: 'SBIN0001234', upi: 'srisaitraders@sbi' },
  plan: 'business',
}

export const currentUser = {
  id: 'user_1',
  name: 'Vinay Kumar',
  email: 'owner@srisaitraders.example',
  role: 'owner',
}

export const members = [
  { id: 'user_1', name: 'Vinay Kumar', email: 'owner@srisaitraders.example', role: 'owner', status: 'active', joinedAt: daysAgo(120) },
  { id: 'user_2', name: 'Priya Reddy', email: 'priya@srisaitraders.example', role: 'admin', status: 'active', joinedAt: daysAgo(90) },
  { id: 'user_3', name: 'Ravi Teja', email: 'ravi@srisaitraders.example', role: 'staff', status: 'active', joinedAt: daysAgo(45) },
  { id: 'user_4', name: 'Anita Shah', email: 'anita@ca-firm.example', role: 'viewer', status: 'invited', joinedAt: daysAgo(3) },
]

export const categories = [
  { id: 'cat_1', name: 'Groceries' },
  { id: 'cat_2', name: 'Beverages' },
  { id: 'cat_3', name: 'Personal Care' },
  { id: 'cat_4', name: 'Household' },
  { id: 'cat_5', name: 'Stationery' },
  { id: 'cat_6', name: 'Electronics' },
]

const productSeed = [
  ['Basmati Rice 5kg', 'GRC-001', 'cat_1', 'bag', 520, 649, 5, '1006'],
  ['Toor Dal 1kg', 'GRC-002', 'cat_1', 'pack', 118, 145, 5, '0713'],
  ['Sunflower Oil 1L', 'GRC-003', 'cat_1', 'ltr', 132, 165, 5, '1512'],
  ['Wheat Atta 10kg', 'GRC-004', 'cat_1', 'bag', 380, 465, 5, '1101'],
  ['Sugar 1kg', 'GRC-005', 'cat_1', 'kg', 40, 48, 5, '1701'],
  ['Green Tea 100 bags', 'BEV-001', 'cat_2', 'box', 210, 299, 5, '0902'],
  ['Instant Coffee 200g', 'BEV-002', 'cat_2', 'pack', 380, 499, 18, '2101'],
  ['Mango Juice 1L', 'BEV-003', 'cat_2', 'pcs', 72, 99, 12, '2009'],
  ['Mineral Water 1L (12)', 'BEV-004', 'cat_2', 'box', 120, 180, 18, '2201'],
  ['Herbal Shampoo 340ml', 'PC-001', 'cat_3', 'pcs', 165, 225, 18, '3305'],
  ['Toothpaste 150g', 'PC-002', 'cat_3', 'pcs', 72, 99, 18, '3306'],
  ['Bath Soap (Pack of 4)', 'PC-003', 'cat_3', 'pack', 120, 160, 18, '3401'],
  ['Hand Wash 750ml', 'PC-004', 'cat_3', 'pcs', 95, 139, 18, '3401'],
  ['Detergent Powder 2kg', 'HH-001', 'cat_4', 'pack', 210, 275, 18, '3402'],
  ['Dishwash Liquid 500ml', 'HH-002', 'cat_4', 'pcs', 78, 105, 18, '3402'],
  ['Floor Cleaner 1L', 'HH-003', 'cat_4', 'pcs', 135, 189, 18, '3808'],
  ['Garbage Bags (30)', 'HH-004', 'cat_4', 'pack', 60, 95, 18, '3923'],
  ['A4 Paper Ream 500', 'ST-001', 'cat_5', 'pack', 240, 310, 12, '4802'],
  ['Ball Pens (Box of 10)', 'ST-002', 'cat_5', 'box', 45, 70, 18, '9608'],
  ['Notebook 200 pages', 'ST-003', 'cat_5', 'pcs', 38, 60, 12, '4820'],
  ['LED Bulb 9W', 'EL-001', 'cat_6', 'pcs', 65, 110, 12, '8539'],
  ['Extension Board 4-way', 'EL-002', 'cat_6', 'pcs', 290, 449, 18, '8536'],
  ['AA Batteries (4)', 'EL-003', 'cat_6', 'pack', 85, 130, 18, '8506'],
  ['USB-C Cable 1m', 'EL-004', 'cat_6', 'pcs', 110, 249, 18, '8544'],
]

export const products = productSeed.map(([name, sku, categoryId, unit, costPrice, sellingPrice, taxRate, hsn], i) => ({
  id: `prod_${i + 1}`,
  name,
  sku,
  hsn,
  categoryId,
  unit,
  costPrice,
  sellingPrice,
  taxRate,
  stockQuantity: 0, // filled from movements below
  lowStockThreshold: between(8, 20),
  active: i !== 23 ? true : false,
  description: '',
  createdAt: daysAgo(100),
}))

export const customers = [
  { name: 'Walk-in Customer', phone: '', email: '', gstin: '', state: 'Telangana', city: 'Hyderabad' },
  { name: 'Annapurna Restaurant', phone: '+91 90000 11111', email: 'orders@annapurna.example', gstin: '36AAACA1111A1Z1', state: 'Telangana', city: 'Hyderabad' },
  { name: 'Green Valley School', phone: '+91 90000 22222', email: 'admin@greenvalley.example', gstin: '', state: 'Telangana', city: 'Secunderabad' },
  { name: 'Kumar Medicals', phone: '+91 90000 33333', email: 'kumar.med@example.com', gstin: '36AAACK3333K1Z3', state: 'Telangana', city: 'Hyderabad' },
  { name: 'Coastal Mart', phone: '+91 90000 44444', email: 'buy@coastalmart.example', gstin: '37AAACC4444C1Z4', state: 'Andhra Pradesh', city: 'Vijayawada' },
  { name: 'Sunrise Hostel', phone: '+91 90000 55555', email: '', gstin: '', state: 'Telangana', city: 'Hyderabad' },
  { name: 'TechPark Cafeteria', phone: '+91 90000 66666', email: 'cafe@techpark.example', gstin: '36AAACT6666T1Z6', state: 'Telangana', city: 'Gachibowli' },
  { name: 'Bengaluru Supplies Co', phone: '+91 90000 77777', email: 'po@blrsupplies.example', gstin: '29AAACB7777B1Z7', state: 'Karnataka', city: 'Bengaluru' },
  { name: 'Lakshmi Kirana', phone: '+91 90000 88888', email: '', gstin: '', state: 'Telangana', city: 'Warangal' },
  { name: 'Meera Iyer', phone: '+91 90000 99999', email: 'meera.iyer@example.com', gstin: '', state: 'Telangana', city: 'Hyderabad' },
].map((c, i) => ({
  id: `cust_${i + 1}`,
  ...c,
  address: c.name === 'Walk-in Customer' ? '' : `${between(1, 99)}, ${pick(['MG Road', 'Station Road', 'Market Street', 'Lake View Colony', 'Industrial Area'])}`,
  pincode: c.name === 'Walk-in Customer' ? '' : String(between(500001, 500099)),
  createdAt: daysAgo(110 - i * 5),
}))

export const suppliers = [
  { id: 'sup_1', name: 'Deccan Wholesale Foods', phone: '+91 91111 10001', email: 'sales@deccanfoods.example', gstin: '36AAADD1001D1Z1', state: 'Telangana', city: 'Hyderabad' },
  { id: 'sup_2', name: 'CleanHome Distributors', phone: '+91 91111 10002', email: 'orders@cleanhome.example', gstin: '36AAADC1002C1Z2', state: 'Telangana', city: 'Hyderabad' },
  { id: 'sup_3', name: 'BrightLite Electricals', phone: '+91 91111 10003', email: 'trade@brightlite.example', gstin: '27AAADB1003B1Z3', state: 'Maharashtra', city: 'Pune' },
  { id: 'sup_4', name: 'PaperWorks Stationers', phone: '+91 91111 10004', email: 'hello@paperworks.example', gstin: '36AAADP1004P1Z4', state: 'Telangana', city: 'Secunderabad' },
]

// ---- Stock movements, purchases and invoices ----
export const stockMovements = []
export const purchases = []
export const invoices = []

let mvCounter = 1
const addMovement = (productId, type, delta, createdAt, reference = null, note = '') => {
  stockMovements.push({
    id: `mv_${mvCounter++}`,
    productId,
    movementType: type,
    quantityDelta: delta,
    referenceType: reference?.type || null,
    referenceId: reference?.id || null,
    referenceLabel: reference?.label || null,
    note,
    actor: pick(['Vinay Kumar', 'Priya Reddy', 'Ravi Teja']),
    createdAt,
  })
  const p = products.find((x) => x.id === productId)
  p.stockQuantity += delta
}

// Opening stock
products.forEach((p) => addMovement(p.id, 'opening', between(40, 120), daysAgo(95, 9), null, 'Opening balance'))

// Purchases every ~10 days
const supplierFor = { cat_1: 'sup_1', cat_2: 'sup_1', cat_3: 'sup_2', cat_4: 'sup_2', cat_5: 'sup_4', cat_6: 'sup_3' }
for (let n = 0; n < 8; n++) {
  const supplierId = pick(suppliers).id
  const catIds = Object.entries(supplierFor).filter(([, s]) => s === supplierId).map(([c]) => c)
  const pool = products.filter((p) => catIds.includes(p.categoryId) && p.active)
  const chosen = [...pool].sort(() => rand() - 0.5).slice(0, between(2, Math.min(4, pool.length)))
  const date = daysAgo(85 - n * 10, 10)
  const items = chosen.map((p) => ({
    productId: p.id, productName: p.name, quantity: between(20, 60), unitCost: p.costPrice, taxRate: p.taxRate,
  }))
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitCost, 0)
  const tax = items.reduce((s, it) => s + (it.quantity * it.unitCost * it.taxRate) / 100, 0)
  const purchase = {
    id: `pur_${n + 1}`,
    billNumber: `SB-${2400 + n * 7}`,
    supplierId,
    date,
    items,
    subtotal: round2(subtotal),
    taxTotal: round2(tax),
    total: round2(subtotal + tax),
    status: n === 7 ? 'unpaid' : 'paid',
    notes: '',
  }
  purchases.push(purchase)
  items.forEach((it) => addMovement(it.productId, 'purchase', it.quantity, date, { type: 'purchase', id: purchase.id, label: purchase.billNumber }))
}

// Invoices over the last ~60 days
let invNo = 1
const activeProducts = products.filter((p) => p.active)
for (let day = 60; day >= 0; day--) {
  const count = day === 0 ? 3 : between(0, 2)
  for (let k = 0; k < count; k++) {
    const customer = rand() < 0.3 ? customers[0] : pick(customers.slice(1))
    const lineCount = between(1, 4)
    const chosen = [...activeProducts].sort(() => rand() - 0.5).slice(0, lineCount)
    const issueDate = daysAgo(day, 9 + k * 3 + between(0, 2))
    const items = chosen.map((p) => {
      const quantity = between(1, customer.id === 'cust_1' ? 3 : 8)
      const discount = rand() < 0.2 ? round2(p.sellingPrice * quantity * 0.05) : 0
      const line = calcLine({ quantity, unitPrice: p.sellingPrice, discount, taxRate: p.taxRate })
      return {
        id: `item_${invNo}_${p.id}`,
        productId: p.id, productName: p.name, sku: p.sku, hsn: p.hsn, unit: p.unit,
        quantity, unitPrice: p.sellingPrice, discount, taxRate: p.taxRate,
        taxAmount: line.taxAmount, lineTotal: line.lineTotal,
      }
    })
    const interState = customer.state !== business.address.state
    const totals = calcTotals(items, { interState })
    const number = `${business.invoicePrefix}-${String(invNo).padStart(4, '0')}`

    // Decide payment status
    let status = 'paid'
    const roll = rand()
    if (customer.id === 'cust_1') status = 'paid'
    else if (day < 3 && roll < 0.6) status = 'issued'
    else if (roll < 0.15) status = 'issued'
    else if (roll < 0.28) status = 'partially_paid'
    if (day > 5 && rand() < 0.04) status = 'void'

    const payments = []
    if (status === 'paid') {
      payments.push({ id: `pay_${invNo}_1`, amount: totals.grandTotal, method: customer.id === 'cust_1' ? pick(['cash', 'upi']) : pick(['upi', 'bank', 'cash', 'card']), reference: '', receivedAt: addDays(issueDate, customer.id === 'cust_1' ? 0 : between(0, 6)) })
    } else if (status === 'partially_paid') {
      const part = Math.round(totals.grandTotal * pick([0.3, 0.5, 0.6]))
      payments.push({ id: `pay_${invNo}_1`, amount: part, method: pick(['upi', 'bank', 'cash']), reference: '', receivedAt: addDays(issueDate, between(0, 3)) })
    }
    const amountPaid = payments.reduce((s, p) => s + p.amount, 0)

    const invoice = {
      id: `inv_${invNo}`,
      invoiceNumber: number,
      customerId: customer.id,
      customerSnapshot: { name: customer.name, gstin: customer.gstin, state: customer.state, city: customer.city, address: customer.address, phone: customer.phone },
      status,
      issueDate,
      dueDate: addDays(issueDate, customer.id === 'cust_1' ? 0 : business.defaultDueDays),
      placeOfSupply: customer.state,
      interState,
      items,
      ...totals,
      amountPaid,
      payments,
      notes: business.invoiceNotes,
      voidReason: status === 'void' ? 'Customer cancelled order' : '',
      createdBy: pick(['Vinay Kumar', 'Priya Reddy', 'Ravi Teja']),
      createdAt: issueDate,
    }
    invoices.push(invoice)
    if (status !== 'void') {
      items.forEach((it) => addMovement(it.productId, 'sale', -it.quantity, issueDate, { type: 'invoice', id: invoice.id, label: number }))
    }
    invNo++
  }
}

// A couple of drafts
;[['cust_3', ['prod_18', 'prod_19', 'prod_20']], ['cust_7', ['prod_7', 'prod_9']]].forEach(([custId, prodIds], idx) => {
  const customer = customers.find((c) => c.id === custId)
  const items = prodIds.map((pid) => {
    const p = products.find((x) => x.id === pid)
    const quantity = between(5, 20)
    const line = calcLine({ quantity, unitPrice: p.sellingPrice, discount: 0, taxRate: p.taxRate })
    return { id: `item_d${idx}_${pid}`, productId: p.id, productName: p.name, sku: p.sku, hsn: p.hsn, unit: p.unit, quantity, unitPrice: p.sellingPrice, discount: 0, taxRate: p.taxRate, taxAmount: line.taxAmount, lineTotal: line.lineTotal }
  })
  const totals = calcTotals(items, { interState: false })
  invoices.push({
    id: `inv_draft_${idx + 1}`,
    invoiceNumber: '',
    customerId: customer.id,
    customerSnapshot: { name: customer.name, gstin: customer.gstin, state: customer.state, city: customer.city, address: customer.address, phone: customer.phone },
    status: 'draft',
    issueDate: daysAgo(idx),
    dueDate: addDays(daysAgo(idx), business.defaultDueDays),
    placeOfSupply: customer.state,
    interState: false,
    items,
    ...totals,
    amountPaid: 0,
    payments: [],
    notes: business.invoiceNotes,
    voidReason: '',
    createdBy: 'Ravi Teja',
    createdAt: daysAgo(idx),
  })
})

// Force a few products low / out of stock so alerts show up
;[['prod_3', 4], ['prod_11', 0], ['prod_21', 6], ['prod_14', 3]].forEach(([pid, target]) => {
  const p = products.find((x) => x.id === pid)
  const delta = target - p.stockQuantity
  if (delta !== 0) addMovement(pid, 'adjustment', delta, daysAgo(1, 18), null, delta < 0 ? 'Damaged / expired stock written off' : 'Stock count correction')
})

business.nextInvoiceNumber = invNo

export const plans = [
  { key: 'free', name: 'Free', price: 0, features: ['50 invoices / month', '100 products', '1 user', 'Core billing'] },
  { key: 'starter', name: 'Starter', price: 299, features: ['500 invoices / month', '1,000 products', '2 users', 'PDF invoices', 'Basic reports'] },
  { key: 'business', name: 'Business', price: 699, features: ['Unlimited invoices', '10,000 products', '5 users', 'Advanced inventory', 'Exports'] },
  { key: 'premium', name: 'Premium', price: 1499, features: ['Everything in Business', 'Multiple branches', 'Advanced reporting', 'Priority support'] },
]

export function buildInitialData() {
  // Deep copy so resets always start fresh
  return JSON.parse(JSON.stringify({
    business, currentUser, members, categories, products, customers, suppliers,
    invoices, purchases, stockMovements,
  }))
}
