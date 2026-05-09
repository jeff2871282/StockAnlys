import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useStockDataStore } from '@/stores/stockDataStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useStockFetch } from '@/hooks/useStockFetch'
import { StockHeader } from '@/components/stock/StockHeader'
import { MyPositionCard } from '@/components/stock/MyPositionCard'
import { KLineChart } from '@/components/stock/KLineChart'
import { PERHistoryChart } from '@/components/stock/PERHistoryChart'
import { ValuationPanel } from '@/components/stock/ValuationPanel'
import { RevenueChart } from '@/components/stock/RevenueChart'
import { FinancialsPanel } from '@/components/stock/FinancialsPanel'
import { ShareholdingPanel } from '@/components/stock/ShareholdingPanel'
import { AIAnalysisPanel } from '@/components/stock/AIAnalysisPanel'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export function StockDetailPage() {
  const { symbol = '' } = useParams<{ symbol: string }>()
  const stockId = symbol.toUpperCase()

  const { getStockData } = useStockDataStore()
  const { holdings } = usePortfolioStore()
  const { loading, error, refresh } = useStockFetch(stockId)

  const stockData = getStockData(stockId)
  const holding = holdings.find((h) => h.stockId === stockId)
  const stockName = holding?.stockName ?? stockId

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        回到投資組合
      </Link>

      {/* Header */}
      <StockHeader
        stockId={stockId}
        stockName={stockName}
        price={stockData?.latestPrice}
        loading={loading}
        onRefresh={refresh}
      />

      {error && (
        <div className="flex items-start gap-2 p-4 bg-loss/10 border border-loss/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
          <p className="text-sm text-loss">{error}</p>
        </div>
      )}

      {/* K-line chart — full width */}
      <ErrorBoundary>
        <KLineChart priceHistory={stockData?.priceHistory ?? []} />
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <ErrorBoundary>
            <PERHistoryChart
              perHistory={stockData?.perHistory ?? []}
              currentPER={stockData?.per?.per}
            />
          </ErrorBoundary>
          <ValuationPanel per={stockData?.per} />
          <RevenueChart revenues={stockData?.revenues ?? []} />
          <FinancialsPanel financials={stockData?.financials ?? []} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {holding && (
            <MyPositionCard holding={holding} price={stockData?.latestPrice} />
          )}
          <ShareholdingPanel shareholding={stockData?.shareholding} />
          <AIAnalysisPanel
            stockId={stockId}
            stockName={stockName}
            holding={holding}
          />
        </div>
      </div>
    </div>
  )
}
