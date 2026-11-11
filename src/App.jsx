import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Onboarding from './pages/auth/Onboarding'
import Dashboard from './pages/Dashboard'
import ProductList from './pages/products/ProductList'
import ProductForm from './pages/products/ProductForm'
import ProductDetail from './pages/products/ProductDetail'
import CustomerList from './pages/customers/CustomerList'
import CustomerDetail from './pages/customers/CustomerDetail'
import InvoiceList from './pages/invoices/InvoiceList'
import InvoiceForm from './pages/invoices/InvoiceForm'
import InvoiceDetail from './pages/invoices/InvoiceDetail'
import Inventory from './pages/inventory/Inventory'
import PurchaseList from './pages/purchases/PurchaseList'
import PurchaseForm from './pages/purchases/PurchaseForm'
import Suppliers from './pages/purchases/Suppliers'
import SalesReport from './pages/reports/SalesReport'
import StockReport from './pages/reports/StockReport'
import BusinessSettings from './pages/settings/BusinessSettings'
import UsersSettings from './pages/settings/UsersSettings'
import SubscriptionSettings from './pages/settings/SubscriptionSettings'
import NotFound from './pages/NotFound'

function RequireAuth({ children }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!session.onboarded) return <Navigate to="/onboarding/business" replace />
  return children
}

function PublicOnly({ children }) {
  const { session } = useAuth()
  if (session?.onboarded) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding/business" element={<Onboarding />} />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/products/:id/edit" element={<ProductForm />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/new" element={<InvoiceForm />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/purchases" element={<PurchaseList />} />
        <Route path="/purchases/new" element={<PurchaseForm />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/reports/stock" element={<StockReport />} />
        <Route path="/settings" element={<Navigate to="/settings/business" replace />} />
        <Route path="/settings/business" element={<BusinessSettings />} />
        <Route path="/settings/users" element={<UsersSettings />} />
        <Route path="/settings/subscription" element={<SubscriptionSettings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
