import { NavLink } from 'react-router-dom'
import { cx } from '../../components/ui'

const TABS = [
  { to: '/settings/business', label: 'Business' },
  { to: '/settings/users', label: 'Users & roles' },
  { to: '/settings/subscription', label: 'Subscription' },
]

export default function SettingsTabs() {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium',
          isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>{t.label}</NavLink>
      ))}
    </div>
  )
}
