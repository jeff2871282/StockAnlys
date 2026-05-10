import { useState } from 'react'
import { Bot, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAIHistoryStore } from '@/stores/aiHistoryStore'
import { useStockDataStore } from '@/stores/stockDataStore'
import { runPlannerRecommendation } from '@/services/aiService'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  holding: Holding
  action: 'buy' | 'sell'
  tradeShares: number
  tradePrice: number
  newAvgCost?: number
  realizedPnl?: number
}

export function PlannerAICard({ holding, action, tradeShares, tradePrice, newAvgCost, realizedPnl }: Props) {
  const { claudeApiKey } = useSettingsStore()
  const { records } = useAIHistoryStore()
  const { getStockData } = useStockDataStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  // Find the most recent AI analysis record for this stock
  const latestRecord = records.find((r) => r.stockId === holding.stockId)
  const stockData = getStockData(holding.stockId)
  const currentPrice = stockData?.latestPrice?.close

  const handleRecommend = async () => {
    if (!claudeApiKey) {
      setError('請先至「設定」頁面填入 Claude API Key')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const content = await runPlannerRecommendation(claudeApiKey, {
        stockId: holding.stockId,
        stockName: holding.stockName,
        action,
        tradeShares,
        tradePrice,
        currentShares: holding.shares,
        avgCost: holding.avgCost,
        currentPrice,
        priceDate: stockData?.latestPrice?.date,
        previousAnalysis: latestRecord?.analysis,
        analysisDate: latestRecord
          ? new Date(latestRecord.createdAt).toLocaleDateString('zh-TW')
          : undefined,
        newAvgCost,
        realizedPnl,
      })
      setResult(content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 建議失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">AI 操作建議</h3>
        </div>
        {!claudeApiKey && (
          <span className="text-xs text-muted-foreground">需設定 Claude API Key</span>
        )}
      </div>

      {/* Reference info */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {latestRecord ? (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>
              參考分析：{new Date(latestRecord.createdAt).toLocaleDateString('zh-TW')}
              {latestRecord.stockPrice && `（當時股價 NT$ ${latestRecord.stockPrice.toFixed(2)}）`}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground/70">尚無此股票的 AI 分析記錄，將依現有資料判斷</p>
        )}
        {currentPrice && (
          <p>最新股價：NT$ {currentPrice.toFixed(2)}{stockData?.latestPrice?.date && ` （${stockData.latestPrice.date}）`}</p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-loss/10 border border-loss/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
          <p className="text-sm text-loss">{error}</p>
        </div>
      )}

      {!result ? (
        <button
          onClick={handleRecommend}
          disabled={loading || !claudeApiKey}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
            loading || !claudeApiKey
              ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Bot className={cn('w-4 h-4', loading && 'animate-pulse')} />
          {loading ? '分析中，請稍候...' : '取得 AI 操作建議'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-muted rounded-lg p-4">
            <MarkdownRenderer content={result} />
          </div>
          <button
            onClick={handleRecommend}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            重新分析
          </button>
        </div>
      )}
    </div>
  )
}
