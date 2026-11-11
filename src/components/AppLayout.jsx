import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, FileText, Boxes, ShoppingCart, BarChart3, Settings,
  LogOut, Menu, X, Plus, Bell, ChevronDown, Truck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { cx } from './ui'
import { initials } from '../lib/format'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  {
    label: 'Reports', icon: BarChart3, children: [
      { to: '/reports/sales', label: 'Sales report' },
      { to: '/reports/stock', label: 'Stock report' },
    ],
  },
  {
    label: 'Settings', icon: Settings, children: [
      { to: '/settings/business', label: 'Business' },
      { to: '/settings/users', label: 'Users & roles' },
      { to: '/settings/subscription', label: 'Subscription' },
    ],
  },
]

function NavItems({ onNavigate }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(() => NAV.filter((n) => n.children?.some((c) => pathname.startsWith(c.to))).map((n) => n.label))
  const linkClass = ({ isActive }) => cx(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => item.children ? (
        <div key={item.label}>
          <button
            onClick={() => setOpen((o) => o.includes(item.label) ? o.filter((x) => x !== item.label) : [...o, item.label])}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={cx('h-4 w-4 transition-transform', open.includes(item.label) && 'rotate-180')} />
          </button>
          {open.includes(item.label) && (
            <div className="ml-7 mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2">
              {item.children.map((c) => (
                <NavLink key={c.to} to={c.to} onClick={onNavigate} className={linkClass}>{c.label}</NavLink>
              ))}
            </div>
          )}
        </div>
      ) : (
        <NavLink key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
          <item.icon className="h-4 w-4" />{item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand({ name }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">B</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">BillStock</p>
        <p className="truncate text-xs text-slate-500">{name}</p>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()

  const lowStock = data.products.filter((p) => p.active && p.stockQuantity <= p.lowStockThreshold).length

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-3"><Brand name={data.business.name} /></div>
        <div className="flex-1 overflow-y-auto p-3"><NavItems /></div>
        <div className="border-t border-slate-100 p-3 text-xs text-slate-500">
          Plan: <span className="font-medium capitalize text-slate-700">{data.business.plan}</span>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-3">
              <Brand name={data.business.name} />
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3"><NavItems onNavigate={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      <div className="lg:pl-60 print:pl-0">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/invoices/new')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">New invoice</span>
          </button>
          <button
            onClick={() => navigate('/inventory?filter=low')}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`${lowStock} low stock alerts`}
            title="Low stock alerts"
          >
            <Bell className="h-5 w-5" />
            {lowStock > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{lowStock}</span>}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{initials(user?.name)}</span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-slate-800">{user?.name}</span>
                <span className="block text-xs capitalize leading-tight text-slate-500">{user?.role}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button onClick={() => { setMenuOpen(false); navigate('/settings/business') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="h-4 w-4" />Settings
                  </button>
                  <button onClick={() => { logout(); navigate('/login') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
