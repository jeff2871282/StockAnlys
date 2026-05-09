import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StockPrice } from '@/stores/stockDataStore'

interface Props {
  stockId: string
  stockName: string
  price?: StockPrice
  loading: boolean
  onRefresh: () => void
}

export function StockHeader({ stockId, stockName, price, loading, onRefresh }: Props) {
  const isUp = price ? price.spread >= 0 : null
  const pctChange = price ? (price.spread / (price.close - price.spread)) * 100 : null

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{stockName}</h1>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">{stockId}</span>
        </div>

        {price ? (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-bold text-foreground">
              NT$ {price.close.toFixed(2)}
            </span>
            <div
              className={cn(
                'flex items-center gap-0.5 text-sm font-medium',
                isUp ? 'text-profit' : 'text-loss'
              )}
            >
              {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {price.spread >= 0 ? '+' : ''}{price.spread.toFixed(2)}
              {pctChange != null && ` (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%)`}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '載入股價中...' : '尚無股價資料'}
          </p>
        )}

        {price && (
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span>開 {price.open.toFixed(2)}</span>
            <span>高 {price.max.toFixed(2)}</span>
            <span>低 {price.min.toFixed(2)}</span>
            <span>資料日期 {price.date}</span>
          </div>
        )}
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        重新整理
      </button>
    </div>
  )
}
