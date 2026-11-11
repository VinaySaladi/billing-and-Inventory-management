import { formatCurrency, formatDate } from '../lib/format'

/** The printable invoice. Used for preview before issue and on the invoice page. */
export default function InvoiceDocument({ invoice, business, draft = false }) {
  const c = invoice.customerSnapshot || {}
  const a = business.address
  return (
    <div className="print-area relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:p-10">
      {(draft || invoice.status === 'draft') && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="-rotate-12 text-8xl font-black uppercase tracking-widest text-slate-900/[0.04]">Draft</span></div>
      )}
      {invoice.status === 'void' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="-rotate-12 text-8xl font-black uppercase tracking-widest text-red-600/[0.07]">Void</span></div>
      )}
      <div className="flex flex-col justify-between gap-6 sm:flex-row">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">{business.name[0]}</div>
          <p className="text-base font-semibold text-slate-900">{business.legalName || business.name}</p>
          <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
          <p>{a.city}, {a.state} {a.pincode}</p>
          {business.gstin && <p>GSTIN: <span className="font-medium">{business.gstin}</span></p>}
          <p>{business.phone}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xl font-semibold uppercase tracking-wide text-slate-900">Tax invoice</p>
          <p className="mt-2"><span className="text-slate-500">Invoice #</span> <span className="font-medium text-slate-900">{invoice.invoiceNumber || '(assigned on issue)'}</span></p>
          <p><span className="text-slate-500">Date</span> {formatDate(invoice.issueDate)}</p>
          <p><span className="text-slate-500">Due</span> {formatDate(invoice.dueDate)}</p>
          <p><span className="text-slate-500">Place of supply</span> {invoice.placeOfSupply}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bill to</p>
        <p className="mt-1 font-semibold text-slate-900">{c.name}</p>
        {c.address && <p>{c.address}</p>}
        {(c.city || c.state) && <p>{[c.city, c.state].filter(Boolean).join(', ')}</p>}
        {c.gstin && <p>GSTIN: {c.gstin}</p>}
        {c.phone && <p>{c.phone}</p>}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2">HSN</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Rate</th>
              <th className="py-2 pr-2 text-right">Disc.</th>
              <th className="py-2 pr-2 text-right">GST</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={it.id || i} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2 text-slate-500">{i + 1}</td>
                <td className="py-2 pr-2 font-medium text-slate-900">{it.productName}</td>
                <td className="py-2 pr-2 text-slate-500">{it.hsn || '—'}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{it.quantity} {it.unit}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{formatCurrency(it.unitPrice)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{it.discount ? formatCurrency(it.discount) : '—'}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{it.taxRate}%</td>
                <td className="py-2 text-right font-medium tabular-nums text-slate-900">{formatCurrency(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col-reverse justify-between gap-6 sm:flex-row">
        <div className="max-w-sm space-y-3 text-xs text-slate-500">
          {invoice.taxBreakup?.length > 0 && (
            <table className="w-full">
              <thead><tr className="text-left"><th className="pr-2 font-medium">GST %</th><th className="pr-2 text-right font-medium">Taxable</th>{invoice.interState ? <th className="text-right font-medium">IGST</th> : <><th className="pr-2 text-right font-medium">CGST</th><th className="text-right font-medium">SGST</th></>}</tr></thead>
              <tbody>
                {invoice.taxBreakup.map((b) => (
                  <tr key={b.rate}><td className="pr-2">{b.rate}%</td><td className="pr-2 text-right">{formatCurrency(b.taxable)}</td>
                    {invoice.interState ? <td className="text-right">{formatCurrency(b.tax)}</td> : <><td className="pr-2 text-right">{formatCurrency(b.tax / 2)}</td><td className="text-right">{formatCurrency(b.tax / 2)}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {invoice.notes && <p><span className="font-medium text-slate-700">Notes:</span> {invoice.notes}</p>}
          {business.invoiceTerms && <p><span className="font-medium text-slate-700">Terms:</span> {business.invoiceTerms}</p>}
          {business.bank && <p><span className="font-medium text-slate-700">Pay to:</span> {business.bank.name} · A/c {business.bank.account} · IFSC {business.bank.ifsc}{business.bank.upi && <> · UPI {business.bank.upi}</>}</p>}
        </div>
        <dl className="w-full space-y-1.5 sm:w-72">
          <Row label="Subtotal" value={invoice.subtotal} />
          {invoice.discountTotal > 0 && <Row label="Discount" value={-invoice.discountTotal} />}
          <Row label="Taxable amount" value={invoice.taxableTotal} />
          {invoice.interState
            ? <Row label="IGST" value={invoice.igst} />
            : <><Row label="CGST" value={invoice.cgst} /><Row label="SGST" value={invoice.sgst} /></>}
          {invoice.roundOff !== 0 && <Row label="Round off" value={invoice.roundOff} />}
          <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-base font-semibold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{formatCurrency(invoice.grandTotal)}</dd></div>
          {invoice.amountPaid > 0 && <>
            <Row label="Paid" value={-invoice.amountPaid} />
            <div className="flex justify-between font-semibold text-slate-900"><dt>Balance due</dt><dd className="tabular-nums">{formatCurrency(invoice.grandTotal - invoice.amountPaid)}</dd></div>
          </>}
        </dl>
      </div>
      <div className="mt-10 flex justify-end">
        <div className="text-center text-xs text-slate-500">
          <div className="mb-1 h-10" />
          <p className="border-t border-slate-300 pt-1">For {business.name}<br />Authorised signatory</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{label}</dt><dd className="tabular-nums">{formatCurrency(value)}</dd></div>
}
