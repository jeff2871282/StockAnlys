import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  holdings: Holding[]
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#84cc16',
]

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  const _cx = cx as number
  const _cy = cy as number
  const _midAngle = midAngle as number
  const _innerRadius = innerRadius as number
  const _outerRadius = outerRadius as number
  const _percent = percent as number
  if (_percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = _innerRadius + (_outerRadius - _innerRadius) * 0.5
  const x = _cx + radius * Math.cos(-_midAngle * RADIAN)
  const y = _cy + radius * Math.sin(-_midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
      {`${(_percent * 100).toFixed(1)}%`}
    </text>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-muted-foreground">NT$ {value.toLocaleString('zh-TW')}</p>
    </div>
  )
}

export function AllocationChart({ holdings }: Props) {
  if (holdings.length === 0) return null

  const data = holdings.map((h) => ({
    name: h.stockName !== h.stockId ? `${h.stockName} (${h.stockId})` : h.stockId,
    value: Math.round(h.shares * h.avgCost),
  }))

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">持倉成本分配</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
