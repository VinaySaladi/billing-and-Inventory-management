import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { buildInitialData } from '../data/mockData'
import { calcLine, calcTotals } from '../lib/invoice'
import { round2, uid } from '../lib/format'

/**
 * In-memory "backend" for the UI phase.
 * Every action here maps to an API endpoint from the design doc (noted in comments),
 * so step 2 can swap these functions for real fetch calls.
 * Data is saved to localStorage so changes survive a refresh.
 */
const DataContext = createContext(null)
const STORAGE_KEY = 'billstock-data-v1'

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return buildInitialData()
}

const now = () => new Date().toISOString()
const ok = (value) => ({ ok: true, value })
const fail = (error) => ({ ok: false, error })

export function DataProvider({ children }) {
  const [data, setData] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data])

  const actions = useMemo(() => {
    const actor = () => data.currentUser.name

    const movement = (productId, movementType, quantityDelta, reference = null, note = '') => ({
      id: uid('mv'), productId, movementType, quantityDelta,
      referenceType: reference?.type || null, referenceId: reference?.id || null, referenceLabel: reference?.label || null,
      note, actor: actor(), createdAt: now(),
    })

    const applyMovements = (products, movements) =>
      products.map((p) => {
        const delta = movements.filter((m) => m.productId === p.id).reduce((s, m) => s + m.quantityDelta, 0)
        return delta ? { ...p, stockQuantity: round2(p.stockQuantity + delta) } : p
      })

    const buildInvoiceBody = (input, existing = {}) => {
      const customer = data.customers.find((c) => c.id === input.customerId)
      const interState = customer ? customer.state !== data.business.address.state : false
      const items = input.items.map((it) => {
        const p = data.products.find((x) => x.id === it.productId)
        const line = calcLine(it)
        return {
          id: it.id || uid('item'),
          productId: it.productId, productName: p?.name || it.productName, sku: p?.sku, hsn: p?.hsn, unit: p?.unit,
          quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), discount: Number(it.discount) || 0,
          taxRate: Number(it.taxRate), taxAmount: line.taxAmount, lineTotal: line.lineTotal,
        }
      })
      return {
        ...existing,
        customerId: input.customerId,
        customerSnapshot: customer
          ? { name: customer.name, gstin: customer.gstin, state: customer.state, city: customer.city, address: customer.address, phone: customer.phone }
          : null,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        placeOfSupply: customer?.state || data.business.address.state,
        interState,
        items,
        ...calcTotals(items, { interState }),
        notes: input.notes || '',
      }
    }

    const checkStock = (items) => {
      const need = {}
      items.forEach((it) => { need[it.productId] = (need[it.productId] || 0) + Number(it.quantity) })
      const short = Object.entries(need)
        .map(([pid, qty]) => ({ p: data.products.find((x) => x.id === pid), qty }))
        .filter(({ p, qty }) => p && p.stockQuantity < qty)
      if (short.length) {
        return `Not enough stock for: ${short.map(({ p }) => `${p.name} (available ${p.stockQuantity})`).join(', ')}`
      }
      return null
    }

    const paymentStatus = (grandTotal, amountPaid) =>
      amountPaid <= 0 ? 'issued' : amountPaid >= grandTotal ? 'paid' : 'partially_paid'

    const api = {
      // POST/PATCH /api/v1/invoices (+ /issue when issue=true)
      saveInvoice(input, { issue = false, payment = null } = {}) {
        if (!input.customerId) return fail('Please select a customer.')
        if (!input.items.length) return fail('Add at least one item.')
        if (input.items.some((it) => !it.productId || Number(it.quantity) <= 0)) return fail('Every line needs a product and a quantity above 0.')

        const existing = input.id ? data.invoices.find((i) => i.id === input.id) : null
        if (existing && existing.status !== 'draft') return fail('Only draft invoices can be edited.')

        let invoice = buildInvoiceBody(input, existing || {
          id: uid('inv'), invoiceNumber: '', status: 'draft', amountPaid: 0, payments: [], voidReason: '',
          createdBy: actor(), createdAt: now(),
        })

        let movements = []
        let business = data.business
        if (issue) {
          const stockError = checkStock(invoice.items)
          if (stockError) return fail(stockError)
          const number = `${business.invoicePrefix}-${String(business.nextInvoiceNumber).padStart(4, '0')}`
          business = { ...business, nextInvoiceNumber: business.nextInvoiceNumber + 1 }
          invoice = { ...invoice, invoiceNumber: number, status: 'issued' }
          movements = invoice.items.map((it) =>
            movement(it.productId, 'sale', -it.quantity, { type: 'invoice', id: invoice.id, label: number }))
          if (payment && Number(payment.amount) > 0) {
            const amount = Math.min(Number(payment.amount), invoice.grandTotal)
            invoice.payments = [{ id: uid('pay'), amount, method: payment.method, reference: payment.reference || '', receivedAt: now() }]
            invoice.amountPaid = amount
            invoice.status = paymentStatus(invoice.grandTotal, amount)
          }
        }

        setData((d) => ({
          ...d,
          business,
          invoices: existing ? d.invoices.map((i) => (i.id === invoice.id ? invoice : i)) : [invoice, ...d.invoices],
          products: applyMovements(d.products, movements),
          stockMovements: [...movements, ...d.stockMovements],
        }))
        return ok(invoice)
      },

      // POST /api/v1/invoices/:id/issue
      issueInvoice(id) {
        const inv = data.invoices.find((i) => i.id === id)
        if (!inv || inv.status !== 'draft') return fail('Only drafts can be issued.')
        return api.saveInvoice({ ...inv }, { issue: true })
      },

      deleteDraft(id) {
        setData((d) => ({ ...d, invoices: d.invoices.filter((i) => !(i.id === id && i.status === 'draft')) }))
        return ok()
      },

      // POST /api/v1/invoices/:id/payments
      recordPayment(invoiceId, { amount, method, reference, receivedAt }) {
        const inv = data.invoices.find((i) => i.id === invoiceId)
        if (!inv || !['issued', 'partially_paid'].includes(inv.status)) return fail('This invoice cannot take payments.')
        const amt = round2(Number(amount))
        const due = round2(inv.grandTotal - inv.amountPaid)
        if (!(amt > 0)) return fail('Enter an amount above 0.')
        if (amt > due) return fail(`Amount is more than the balance due (₹${due}).`)
        const pay = { id: uid('pay'), amount: amt, method, reference: reference || '', receivedAt: receivedAt ? new Date(`${receivedAt}T${new Date().toTimeString().slice(0, 8)}`).toISOString() : now() }
        const amountPaid = round2(inv.amountPaid + amt)
        const updated = { ...inv, payments: [...inv.payments, pay], amountPaid, status: paymentStatus(inv.grandTotal, amountPaid) }
        setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === invoiceId ? updated : i)) }))
        return ok(updated)
      },

      // POST /api/v1/invoices/:id/void
      voidInvoice(id, reason, restock = true) {
        const inv = data.invoices.find((i) => i.id === id)
        if (!inv || ['draft', 'void'].includes(inv.status)) return fail('This invoice cannot be voided.')
        if (!reason?.trim()) return fail('Please give a reason.')
        const movements = restock
          ? inv.items.map((it) => movement(it.productId, 'sale_return', it.quantity, { type: 'invoice', id: inv.id, label: inv.invoiceNumber }, `Void: ${reason}`))
          : []
        setData((d) => ({
          ...d,
          invoices: d.invoices.map((i) => (i.id === id ? { ...i, status: 'void', voidReason: reason } : i)),
          products: applyMovements(d.products, movements),
          stockMovements: [...movements, ...d.stockMovements],
        }))
        return ok()
      },

      // POST /api/v1/products
      addProduct(input) {
        if (input.sku && data.products.some((p) => p.sku?.toLowerCase() === input.sku.toLowerCase())) {
          return fail('A product with this SKU already exists.')
        }
        const product = {
          id: uid('prod'), ...input, stockQuantity: 0, active: true, createdAt: now(),
        }
        const opening = Number(input.openingStock) || 0
        delete product.openingStock
        const movements = opening > 0 ? [movement(product.id, 'opening', opening, null, 'Opening balance')] : []
        setData((d) => ({
          ...d,
          products: applyMovements([product, ...d.products], movements),
          stockMovements: [...movements, ...d.stockMovements],
        }))
        return ok(product)
      },

      // PATCH /api/v1/products/:id
      updateProduct(id, input) {
        if (input.sku && data.products.some((p) => p.id !== id && p.sku?.toLowerCase() === input.sku.toLowerCase())) {
          return fail('A product with this SKU already exists.')
        }
        // eslint-disable-next-line no-unused-vars
        const { openingStock, stockQuantity, ...rest } = input
        setData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...rest } : p)) }))
        return ok()
      },

      // DELETE /api/v1/products/:id (archive)
      setProductActive(id, active) {
        setData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, active } : p)) }))
        return ok()
      },

      addCategory(name) {
        if (data.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) return fail('Category already exists.')
        const cat = { id: uid('cat'), name: name.trim() }
        setData((d) => ({ ...d, categories: [...d.categories, cat] }))
        return ok(cat)
      },

      // Manual stock adjustment (needs a reason, recorded in the ledger)
      adjustStock(productId, delta, note, movementType = 'adjustment') {
        const p = data.products.find((x) => x.id === productId)
        const d0 = Number(delta)
        if (!p || !d0) return fail('Enter a quantity.')
        if (!note?.trim()) return fail('Please give a reason for this adjustment.')
        if (p.stockQuantity + d0 < 0) return fail(`Stock cannot go below 0 (current: ${p.stockQuantity}).`)
        const mv = movement(productId, movementType, d0, null, note)
        setData((d) => ({ ...d, products: applyMovements(d.products, [mv]), stockMovements: [mv, ...d.stockMovements] }))
        return ok()
      },

      // POST/PATCH /api/v1/customers
      saveCustomer(input) {
        if (!input.name?.trim()) return fail('Name is required.')
        if (input.id) {
          setData((d) => ({ ...d, customers: d.customers.map((c) => (c.id === input.id ? { ...c, ...input } : c)) }))
          return ok(input)
        }
        const customer = { ...input, id: uid('cust'), createdAt: now() }
        setData((d) => ({ ...d, customers: [customer, ...d.customers] }))
        return ok(customer)
      },

      saveSupplier(input) {
        if (!input.name?.trim()) return fail('Name is required.')
        if (input.id) {
          setData((d) => ({ ...d, suppliers: d.suppliers.map((s) => (s.id === input.id ? { ...s, ...input } : s)) }))
          return ok(input)
        }
        const supplier = { ...input, id: uid('sup') }
        setData((d) => ({ ...d, suppliers: [supplier, ...d.suppliers] }))
        return ok(supplier)
      },

      // POST /api/v1/purchases  (purchase + stock increase together)
      createPurchase(input) {
        if (!input.supplierId) return fail('Select a supplier.')
        if (!input.items.length || input.items.some((i) => !i.productId || Number(i.quantity) <= 0)) return fail('Every line needs a product and quantity.')
        const items = input.items.map((it) => {
          const p = data.products.find((x) => x.id === it.productId)
          return { productId: it.productId, productName: p.name, quantity: Number(it.quantity), unitCost: Number(it.unitCost), taxRate: Number(it.taxRate) }
        })
        const subtotal = items.reduce((s, it) => s + it.quantity * it.unitCost, 0)
        const tax = items.reduce((s, it) => s + (it.quantity * it.unitCost * it.taxRate) / 100, 0)
        const purchase = {
          id: uid('pur'), billNumber: input.billNumber, supplierId: input.supplierId,
          date: new Date(input.date).toISOString(), items,
          subtotal: round2(subtotal), taxTotal: round2(tax), total: round2(subtotal + tax),
          status: input.status, notes: input.notes || '',
        }
        const movements = items.map((it) => movement(it.productId, 'purchase', it.quantity, { type: 'purchase', id: purchase.id, label: purchase.billNumber }))
        setData((d) => ({
          ...d,
          purchases: [purchase, ...d.purchases],
          products: applyMovements(d.products, movements),
          stockMovements: [...movements, ...d.stockMovements],
        }))
        return ok(purchase)
      },

      markPurchasePaid(id) {
        setData((d) => ({ ...d, purchases: d.purchases.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)) }))
        return ok()
      },

      // PATCH /api/v1/businesses/:id
      updateBusiness(input) {
        setData((d) => ({ ...d, business: { ...d.business, ...input } }))
        return ok()
      },

      // /api/v1/members
      inviteMember({ name, email, role }) {
        if (data.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) return fail('This person is already a member.')
        const m = { id: uid('user'), name, email, role, status: 'invited', joinedAt: now() }
        setData((d) => ({ ...d, members: [...d.members, m] }))
        return ok(m)
      },
      updateMemberRole(id, role) {
        setData((d) => ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, role } : m)) }))
        return ok()
      },
      removeMember(id) {
        setData((d) => ({ ...d, members: d.members.filter((m) => m.id !== id) }))
        return ok()
      },

      setPlan(plan) {
        setData((d) => ({ ...d, business: { ...d.business, plan } }))
        return ok()
      },

      resetDemoData() {
        setData(buildInitialData())
        return ok()
      },
    }
    return api
  }, [data])

  return <DataContext.Provider value={{ data, ...actions }}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
