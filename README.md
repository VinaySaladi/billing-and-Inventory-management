# BillStock: Billing & Inventory UI (Step 1)

React + JavaScript + Tailwind CSS frontend for the Billing & Inventory Management app.
All data is mock data in the browser (saved to localStorage). Step 2 swaps it for the Node.js API.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
```

Sign in with any email and a password of 6+ characters (demo mode).
To start fresh: Settings → Business → Reset demo data.

## Tech

- Vite 6, React 19, React Router 7
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Recharts (charts), lucide-react (icons)

## Screens (routes follow the system design doc)

| Area | Routes |
|---|---|
| Auth | `/login`, `/register`, `/forgot-password`, `/onboarding/business` |
| Dashboard | `/dashboard`: sales today/month, outstanding, low stock, sales chart, top products |
| Products | `/products`, `/products/new`, `/products/:id`, `/products/:id/edit` |
| Customers | `/customers`, `/customers/:id` |
| Invoices | `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit` (drafts only) |
| Inventory | `/inventory`: stock levels, movement ledger, manual adjustments with reason |
| Purchases | `/purchases`, `/purchases/new`, `/suppliers` |
| Reports | `/reports/sales`, `/reports/stock` (CSV export) |
| Settings | `/settings/business`, `/settings/users`, `/settings/subscription` |

## Behaviour already modelled in the UI

- Invoice lifecycle: draft → issued → partially paid → paid, plus void (with reason and optional restock).
- Issuing assigns the next invoice number, locks the invoice and deducts stock; it is blocked if stock is short.
- GST split: CGST + SGST when the customer is in the business's state, IGST otherwise. Rate-wise tax summary on the invoice.
- Payments: cash / UPI / card / bank / other, partial payments, no overpayment.
- Every stock change (opening, purchase, sale, return, adjustment) is a row in the movement ledger.
- Print / PDF via the browser's print dialog on the invoice page.

## Folder structure

```
src/
  App.jsx                 routes + auth guards
  main.jsx                providers
  components/             AppLayout, ui.jsx (Button, Card, Table, Modal…), charts, InvoiceDocument
  context/
    DataContext.jsx       mock "backend": all reads and actions (each maps to an API endpoint)
    AuthContext.jsx       mock auth (Supabase Auth later)
    ToastContext.jsx
  data/mockData.js        sample business, products, customers, invoices, purchases, stock movements
  lib/                    formatters, invoice/GST calculations, selectors, CSV export
  pages/                  one folder per module
```

## Next step (Node.js API)

Each action in `src/context/DataContext.jsx` has a comment naming the endpoint it stands in for
(for example `POST /api/v1/invoices/:id/payments`). Replace the body of each action with a `fetch`
call to the API and keep the same return shape (`{ ok, value }` or `{ ok: false, error }`), and the pages
won't need to change. Totals are calculated in the browser only for the preview; the API must recalculate them.
