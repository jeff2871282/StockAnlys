import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'
import type { Holding } from '@/stores/portfolioStore'
import type { StockPrice } from '@/stores/stockDataStore'

interface Props {
  holding: Holding
  price?: StockPrice
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-foreground', className)}>{value}</span>
    </div>
  )
}

export function MyPositionCard({ holding, price }: Props) {
  const totalCost = holding.shares * holding.avgCost
  const marketValue = price ? holding.shares * price.close : null
  const pnl = marketValue ? marketValue - totalCost : null
  const pnlPct = pnl ? (pnl / totalCost) * 100 : null
  const isProfit = pnl != null && pnl >= 0

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        {pnl != null ? (
          isProfit
            ? <TrendingUp className="w-4 h-4 text-profit" />
            : <TrendingDown className="w-4 h-4 text-loss" />
        ) : null}
        <h3 className="text-sm font-medium text-foreground">我的持倉</h3>
      </div>

      <div className="divide-y divide-border">
        <Row label="持有股數" value={`${holding.shares.toLocaleString('zh-TW')} 股`} />
        <Row label="平均成本" value={formatCurrency(holding.avgCost, 2)} />
        <Row label="持倉成本" value={`NT$ ${formatLargeNumber(totalCost)}`} />

        {price && (
          <>
            <Row label="目前市值" value={`NT$ ${formatLargeNumber(marketValue!)}`} />
            <Row
              label="未實現損益"
              value={`${pnl! >= 0 ? '+' : ''}NT$ ${formatLargeNumber(pnl!)} (${formatPercent(pnlPct!)})`}
              className={isProfit ? 'text-profit' : 'text-loss'}
            />
          </>
        )}
      </div>

      {holding.note && (
        <p className="mt-3 text-xs text-muted-foreground bg-muted rounded px-3 py-2">
          {holding.note}
        </p>
      )}
    </div>
  )
}
