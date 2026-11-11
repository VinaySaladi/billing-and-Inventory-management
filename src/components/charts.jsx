import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../lib/format'

const AXIS = { fontSize: 11, fill: '#64748b' }
export const SERIES_COLOR = '#4f46e5' // one series, one hue

function MoneyTooltip({ active, payload, label, valueLabel = 'Sales' }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-900">{row.fullLabel || label}</p>
      <p className="mt-0.5 text-slate-600">{valueLabel}: <span className="font-semibold text-slate-900">{formatCurrency(payload[0].value)}</span></p>
      {row.count !== undefined && <p className="text-slate-500">{row.count} invoice{row.count === 1 ? '' : 's'}</p>}
    </div>
  )
}

/** Vertical bars over time. data: [{ label, value, fullLabel?, count? }] */
export function TimeBarChart({ data, height = 260, valueLabel }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} width={56} />
        <Tooltip content={<MoneyTooltip valueLabel={valueLabel} />} cursor={{ fill: '#eef2ff' }} />
        <Bar dataKey="value" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Horizontal ranked bars with direct labels. data: [{ label, value }] */
export function RankedBars({ data, format = formatCurrency }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex justify-between gap-2 text-xs">
            <span className="truncate text-slate-700">{d.label}</span>
            <span className="font-medium tabular-nums text-slate-900">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: SERIES_COLOR }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
