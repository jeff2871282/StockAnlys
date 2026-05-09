import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { formatLargeNumber } from '@/lib/utils'
import type { MonthRevenue } from '@/stores/stockDataStore'

interface Props {
  revenues: MonthRevenue[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as MonthRevenue & { label: string }
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">營收：NT$ {d.revenue.toLocaleString()} 元</p>
      {d.yoy != null && (
        <p className={d.yoy >= 0 ? 'text-profit' : 'text-loss'}>
          YoY：{d.yoy >= 0 ? '+' : ''}{d.yoy.toFixed(1)}%
        </p>
      )}
    </div>
  )
}

export function RevenueChart({ revenues }: Props) {
  const recent12 = revenues.slice(-12)

  const data = recent12.map((r) => ({
    ...r,
    label: `${r.revenueYear}/${String(r.revenueMonth).padStart(2, '0')}`,
  }))

  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-foreground mb-2">月營收（近12個月）</h3>
        <p className="text-sm text-muted-foreground">營收資料載入中...</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue))

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">月營收（近12個月）</h3>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-profit inline-block" />YoY 成長
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-loss inline-block" />YoY 衰退
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatLargeNumber(v)}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={32}>
            {data.map((d, idx) => (
              <Cell
                key={idx}
                fill={
                  d.yoy == null
                    ? 'hsl(var(--primary))'
                    : d.yoy >= 0
                    ? '#22c55e'
                    : '#ef4444'
                }
                fillOpacity={d.revenue === maxRevenue ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
