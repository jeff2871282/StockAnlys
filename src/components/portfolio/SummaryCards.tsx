import { Wallet, BarChart2, TrendingUp } from 'lucide-react'
import { formatCurrency, formatLargeNumber } from '@/lib/utils'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  holdings: Holding[]
}

interface CardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}

function Card({ icon, label, value, sub }: CardProps) {
  return (
    <div className="bg-card border border-border rounded-lg px-5 py-4 flex items-start gap-4">
      <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function SummaryCards({ holdings }: Props) {
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)
  const totalShares = holdings.reduce((sum, h) => sum + h.shares, 0)
  const count = holdings.length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        icon={<Wallet className="w-4 h-4" />}
        label="總持倉成本"
        value={`NT$ ${formatLargeNumber(totalCost)}`}
        sub={count > 0 ? `${count} 支股票` : '尚無持倉'}
      />
      <Card
        icon={<BarChart2 className="w-4 h-4" />}
        label="持股數量"
        value={count > 0 ? `${count} 支` : '—'}
        sub={count > 0 ? `共 ${totalShares.toLocaleString('zh-TW')} 股` : ''}
      />
      <Card
        icon={<TrendingUp className="w-4 h-4" />}
        label="平均持倉成本"
        value={count > 0 ? formatCurrency(totalCost / count) : '—'}
        sub={count > 0 ? '每支股票平均成本' : ''}
      />
    </div>
  )
}
