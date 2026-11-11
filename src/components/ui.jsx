import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Search, Inbox } from 'lucide-react'

export const cx = (...c) => c.filter(Boolean).join(' ')

const BUTTON_VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}
const BUTTON_SIZES = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-sm' }

export function Button({ variant = 'primary', size = 'md', className, icon: Icon, to, children, ...props }) {
  const classes = cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap',
    BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className,
  )
  const content = <>{Icon && <Icon className="h-4 w-4" />}{children}</>
  if (to) return <Link to={to} className={classes} {...props}>{content}</Link>
  return <button type="button" className={classes} {...props}>{content}</button>
}

export function Card({ className, children, ...props }) {
  return <div className={cx('min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props}>{children}</div>
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const BADGE_COLORS = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
}

export function Badge({ color = 'slate', children, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', BADGE_COLORS[color], className)}>
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link to={back.to} className="mb-1 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-700">← {back.label}</Link>
        )}
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const inputBase = 'block rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-500'

export function Field({ label, error, hint, required, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Input({ className, error, ...props }) {
  return <input className={cx(inputBase, 'h-9', !/\bw-/.test(className || '') && 'w-full', error && 'border-red-400', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(inputBase, 'w-full py-2', className)} rows={3} {...props} />
}

export function Select({ className, children, ...props }) {
  return <select className={cx(inputBase, 'h-9 pr-8', !/\bw-/.test(className || '') && 'w-full', className)} {...props}>{children}</select>
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputBase, 'h-9 w-full pl-9')}
      />
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', widths[size])}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
      </>}
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3"><Icon className="h-6 w-6 text-slate-400" /></div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'indigo', to }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  }
  const body = (
    <Card className={cx('p-4 sm:p-5 h-full', to && 'transition hover:border-indigo-200 hover:shadow')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold text-slate-900 sm:text-2xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && <div className={cx('rounded-lg p-2', tones[tone])}><Icon className="h-5 w-5" /></div>}
      </div>
    </Card>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

/** Simple responsive table. columns: [{ key, header, render?, className?, align? }] */
export function Table({ columns, rows, onRowClick, empty, rowKey = 'id' }) {
  if (!rows.length) return empty || <EmptyState title="Nothing here yet" />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap', c.align === 'right' ? 'text-right' : 'text-left', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cx(onRowClick && 'cursor-pointer hover:bg-slate-50')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('px-4 py-3 text-slate-700 whitespace-nowrap', c.align === 'right' && 'text-right tabular-nums', c.className)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, pageCount, onChange, total, pageSize }) {
  if (pageCount <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>{from}–{to} of {total}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            value === t.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
