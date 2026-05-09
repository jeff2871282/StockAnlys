import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import type { PERHistory } from '@/stores/stockDataStore'

interface Props {
  perHistory: PERHistory[]
  currentPER?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-sm shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}：{p.value.toFixed(2)} 倍
        </p>
      ))}
    </div>
  )
}

export function PERHistoryChart({ perHistory, currentPER }: Props) {
  if (!perHistory.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-foreground mb-2">本益比走勢（近6個月）</h3>
        <p className="text-sm text-muted-foreground">資料載入中...</p>
      </div>
    )
  }

  // Sample to avoid chart overload (max 60 points)
  const step = Math.max(1, Math.floor(perHistory.length / 60))
  const data = perHistory
    .filter((_, i) => i % step === 0)
    .map((p) => ({ date: p.date, 'P/E': +p.per.toFixed(2), 'P/B': +p.pbr.toFixed(2) }))

  const avgPER = data.reduce((s, d) => s + d['P/E'], 0) / data.length

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">本益比走勢（近6個月）</h3>
        {currentPER && currentPER > 0 && (
          <span className="text-xs text-muted-foreground">
            目前 P/E：<span className="text-foreground font-medium">{currentPER.toFixed(1)} 倍</span>
            ｜平均：<span className="text-foreground font-medium">{avgPER.toFixed(1)} 倍</span>
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}x`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
          />
          <ReferenceLine
            y={avgPER}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 2"
            label={{ value: `均${avgPER.toFixed(1)}x`, fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="P/E"
            stroke="hsl(var(--primary))"
            dot={false}
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="P/B"
            stroke="#8b5cf6"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
