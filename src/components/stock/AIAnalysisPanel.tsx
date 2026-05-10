import { useState } from 'react'
import { Bot, Save, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { runAIAnalysis } from '@/services/aiService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAIHistoryStore } from '@/stores/aiHistoryStore'
import { useStockDataStore } from '@/stores/stockDataStore'
import { computeRevenueWithYoY, extractFinancialMetrics } from '@/services/finmind'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import type { FMMonthRevenue } from '@/services/finmind'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  stockId: string
  stockName: string
  holding?: Holding
}


export function AIAnalysisPanel({ stockId, stockName, holding }: Props) {
  const { claudeApiKey } = useSettingsStore()
  const { addRecord } = useAIHistoryStore()
  const { getStockData } = useStockDataStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [resultSummary, setResultSummary] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleAnalyze = async () => {
    if (!claudeApiKey) {
      setError('請先至「設定」頁面填入 Claude API Key')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)

    try {
      const stockData = getStockData(stockId)

      // Convert stored revenues back to FM format for YoY computation
      const fmRevenues: FMMonthRevenue[] = (stockData?.revenues ?? []).map((r) => ({
        date: r.date,
        stock_id: stockId,
        revenue: r.revenue,
        revenue_month: r.revenueMonth,
        revenue_year: r.revenueYear,
      }))
      const revenuesWithYoY = computeRevenueWithYoY(fmRevenues)

      // Extract financials
      const fmFinancials = (stockData?.financials ?? []).map((f) => ({
        date: f.date,
        stock_id: stockId,
        type: f.type,
        value: f.value,
        origin_name: f.originName,
      }))
      const metrics = extractFinancialMetrics(fmFinancials)

      // Convert absolute NT$ amounts to margin percentages by dividing by revenue
      const revenueVal = metrics.revenue?.value ?? null
      const grossProfitVal = metrics.grossProfit?.value ?? null
      const operatingIncomeVal = metrics.operatingIncome?.value ?? null
      const grossMarginPct = revenueVal && grossProfitVal ? (grossProfitVal / revenueVal) * 100 : null
      const operatingMarginPct = revenueVal && operatingIncomeVal ? (operatingIncomeVal / revenueVal) * 100 : null

      const { content, summary } = await runAIAnalysis(claudeApiKey, {
        stockId,
        stockName,
        latestPrice: stockData?.latestPrice?.close,
        priceDate: stockData?.latestPrice?.date,
        myShares: holding?.shares,
        myAvgCost: holding?.avgCost,
        per: stockData?.per
          ? { date: stockData.per.date, stock_id: stockId, PER: stockData.per.per, PBR: stockData.per.pbr, dividend_yield: stockData.per.dividendYield }
          : null,
        revenues: revenuesWithYoY,
        eps: metrics.eps?.value ?? null,
        grossMargin: grossMarginPct,
        operatingMargin: operatingMarginPct,
        shareholding: stockData?.shareholding
          ? {
              date: stockData.shareholding.date,
              stock_id: stockId,
              ForeignInvestmentSharesRatio: stockData.shareholding.foreignInvestmentSharesRatio,
              ForeignInvestmentRemainingShares: stockData.shareholding.foreignInvestmentRemainingShares,
              NumberOfSharesIssued: 0,
            }
          : null,
      })

      setResult(content)
      setResultSummary(summary)
      setExpanded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 分析失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    if (!result) return
    const stockData = getStockData(stockId)
    addRecord({
      stockId,
      stockName,
      analysis: result,
      summary: resultSummary,
      stockPrice: stockData?.latestPrice?.close,
    })
    setSaved(true)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">AI 分析</h3>
        </div>
        {!claudeApiKey && (
          <span className="text-xs text-muted-foreground">需設定 Claude API Key</span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-loss/10 border border-loss/20 rounded-md mb-4">
          <AlertCircle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
          <p className="text-sm text-loss">{error}</p>
        </div>
      )}

      {!result && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors',
            loading
              ? 'bg-primary/50 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Bot className={cn('w-4 h-4', loading && 'animate-pulse')} />
          {loading ? '分析中，請稍候...' : '開始 AI 分析'}
        </button>
      )}

      {result && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? '收起' : '展開'}分析結果
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              >
                重新分析
              </button>
              <button
                onClick={handleSave}
                disabled={saved}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
                  saved
                    ? 'text-profit bg-profit/10'
                    : 'text-primary hover:bg-primary/10'
                )}
              >
                <Save className="w-3 h-3" />
                {saved ? '已儲存' : '儲存記錄'}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="bg-muted rounded-lg p-4">
              <MarkdownRenderer content={result} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
