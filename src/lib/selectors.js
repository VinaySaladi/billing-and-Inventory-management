// Derived numbers used by dashboard and reports. Step 2 moves these to the API.
export const isRevenue = (inv) => ['issued', 'partially_paid', 'paid'].includes(inv.status)

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

export function dailySeries(invoices, days, from = null) {
  const start = from ? new Date(from) : new Date()
  if (!from) start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  const out = []
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dayInv = invoices.filter((inv) => isRevenue(inv) && sameDay(inv.issueDate, d))
    out.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      fullLabel: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      value: dayInv.reduce((s, x) => s + x.grandTotal, 0),
      count: dayInv.length,
    })
  }
  return out
}

export function customerBalances(data) {
  const map = {}
  data.invoices.filter((i) => ['issued', 'partially_paid'].includes(i.status)).forEach((i) => {
    map[i.customerId] = (map[i.customerId] || 0) + (i.grandTotal - i.amountPaid)
  })
  return map
}
