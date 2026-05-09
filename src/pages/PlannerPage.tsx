import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useStockDataStore } from '@/stores/stockDataStore'
import { cn, formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils'
import { PlannerAICard } from '@/components/planner/PlannerAICard'

type Action = 'buy' | 'sell'

interface Result {
  action: Action
  newAvgCost?: number
  newShares?: number
  newTotalCost?: number
  additionalInvestment?: number
  realizedPnl?: number
  remainingShares?: number
  remainingCost?: number
}

function InputField({
  label, value, onChange, placeholder, prefix, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-muted-foreground select-none">{prefix}</span>}
        <input
          type="number" min="0" step="any" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={cn(
            'w-full py-2.5 rounded-md text-sm bg-input border border-border text-foreground',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            prefix ? 'pl-9 pr-3' : suffix ? 'pl-3 pr-10' : 'px-3'
          )}
        />
        {suffix && <span className="absolute right-3 text-sm text-muted-foreground select-none">{suffix}</span>}
      </div>
    </div>
  )
}

function ResultRow({ label, value, highlight, valueClass }: {
  label: string; value: string; highlight?: boolean; valueClass?: string
}) {
  return (
    <div className={cn(
      'flex items-center justify-between py-2.5',
      highlight ? 'border-t-2 border-border mt-2 pt-3' : 'border-b border-border last:border-0'
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', valueClass ?? 'text-foreground')}>{value}</span>
    </div>
  )
}

export function PlannerPage() {
  const { holdings } = usePortfolioStore()
  const { getStockData } = useStockDataStore()

  const [selectedId, setSelectedId] = useState<string>(holdings[0]?.id ?? '')
  const [action, setAction] = useState<Action>('buy')
  const [tradeShares, setTradeShares] = useState('')
  const [tradePrice, setTradePrice] = useState('')

  const holding = holdings.find((h) => h.id === selectedId)
  const stockData = holding ? getStockData(holding.stockId) : null
  const currentPrice = stockData?.latestPrice?.close

  const handleSelectStock = (id: string) => {
    setSelectedId(id)
    setTradeShares('')
    setTradePrice('')
  }

  const result = useMemo<Result | null>(() => {
    if (!holding) return null
    const shares = Number(tradeShares)
    const price = Number(tradePrice)
    if (!shares || shares <= 0 || !price || price <= 0) return null

    if (action === 'buy') {
      const newShares = holding.shares + shares
      const newTotalCost = holding.shares * holding.avgCost + shares * price
      return { action, newShares, newAvgCost: newTotalCost / newShares, newTotalCost, additionalInvestment: shares * price }
    } else {
      if (shares > holding.shares) return null
      const remainingShares = holding.shares - shares
      return {
        action,
        realizedPnl: (price - holding.avgCost) * shares,
        remainingShares,
        remainingCost: remainingShares * holding.avgCost,
      }
    }
  }, [holding, action, tradeShares, tradePrice])

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Calculator className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">請先至「投資組合」頁面新增持倉</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">布局規劃試算</h1>
        <p className="text-sm text-muted-foreground mt-1">模擬加碼或減碼後的損益與持倉變化</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 左欄：輸入區 ── */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-6 space-y-5">
            <h2 className="text-sm font-medium text-foreground">設定條件</h2>

            {/* Stock selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">選擇股票</label>
              <select
                value={selectedId}
                onChange={(e) => handleSelectStock(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {holdings.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.stockName}（{h.stockId}）
                  </option>
                ))}
              </select>
            </div>

            {/* Current holding info */}
            {holding && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '持有股數', value: `${holding.shares.toLocaleString()} 股` },
                  { label: '均成本', value: `NT$ ${holding.avgCost.toFixed(2)}` },
                  { label: '目前股價', value: currentPrice ? `NT$ ${currentPrice.toFixed(2)}` : '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-muted rounded-md p-3 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action toggle */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">操作類型</label>
              <div className="grid grid-cols-2 gap-2">
                {(['buy', 'sell'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAction(a); setTradeShares(''); setTradePrice('') }}
                    className={cn(
                      'py-2.5 rounded-md text-sm font-medium transition-colors border',
                      action === a
                        ? a === 'buy'
                          ? 'bg-profit/15 text-profit border-profit/40'
                          : 'bg-loss/15 text-loss border-loss/40'
                        : 'bg-muted text-muted-foreground border-transparent hover:text-foreground'
                    )}
                  >
                    {a === 'buy' ? '買進（加碼）' : '賣出（減碼）'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label={action === 'buy' ? '買進股數' : '賣出股數'}
                value={tradeShares} onChange={setTradeShares}
                placeholder="例：1000" suffix="股"
              />
              <InputField
                label={action === 'buy' ? '買進價格' : '賣出價格'}
                value={tradePrice} onChange={setTradePrice}
                placeholder={currentPrice ? currentPrice.toFixed(2) : '例：850'} prefix="NT$"
              />
            </div>

            {currentPrice && !tradePrice && (
              <button onClick={() => setTradePrice(currentPrice.toFixed(2))} className="text-xs text-primary hover:underline">
                使用目前股價 NT$ {currentPrice.toFixed(2)}
              </button>
            )}
          </div>
        </div>

        {/* ── 右欄：結果 + AI 建議 ── */}
        <div className="space-y-5">
          {result && holding ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                {result.action === 'buy'
                  ? <TrendingUp className="w-4 h-4 text-profit" />
                  : <TrendingDown className="w-4 h-4 text-loss" />}
                <h3 className="text-sm font-medium text-foreground">
                  試算結果 — {result.action === 'buy' ? '加碼後' : '減碼後'}
                </h3>
              </div>

              {/* Current state banner */}
              <div className="mb-4 px-4 py-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-0.5">
                <p>目前持有 <span className="text-foreground font-medium">{holding.shares.toLocaleString()} 股</span>，均成本 <span className="text-foreground font-medium">NT$ {holding.avgCost.toFixed(2)}</span></p>
                <p>持倉成本合計 <span className="text-foreground font-medium">NT$ {formatLargeNumber(holding.shares * holding.avgCost)}</span></p>
                {currentPrice && (
                  <p>目前市值 <span className={cn('font-medium', currentPrice >= holding.avgCost ? 'text-profit' : 'text-loss')}>
                    NT$ {formatLargeNumber(holding.shares * currentPrice)}（{formatPercent(((currentPrice - holding.avgCost) / holding.avgCost) * 100)}）
                  </span></p>
                )}
              </div>

              {result.action === 'buy' ? (
                <>
                  <ResultRow label="買進股數" value={`${Number(tradeShares).toLocaleString()} 股`} />
                  <ResultRow label="本次投入成本" value={`NT$ ${formatLargeNumber(result.additionalInvestment!)}`} />
                  <ResultRow label="加碼後總股數" value={`${result.newShares!.toLocaleString()} 股`} />
                  <ResultRow label="加碼後持倉總成本" value={`NT$ ${formatLargeNumber(result.newTotalCost!)}`} />
                  <ResultRow
                    label="加碼後新均成本"
                    value={formatCurrency(result.newAvgCost!, 2)}
                    highlight valueClass="text-primary text-lg font-bold"
                  />
                  {currentPrice && (
                    <ResultRow
                      label="加碼後損益率"
                      value={formatPercent(((currentPrice - result.newAvgCost!) / result.newAvgCost!) * 100)}
                      valueClass={currentPrice >= result.newAvgCost! ? 'text-profit font-semibold' : 'text-loss font-semibold'}
                    />
                  )}
                </>
              ) : (
                <>
                  <ResultRow label="賣出股數" value={`${Number(tradeShares).toLocaleString()} 股`} />
                  <ResultRow label="賣出價格" value={`NT$ ${Number(tradePrice).toFixed(2)}`} />
                  <ResultRow
                    label="已實現損益"
                    value={`${result.realizedPnl! >= 0 ? '+' : ''}NT$ ${formatLargeNumber(result.realizedPnl!)}`}
                    highlight
                    valueClass={`${result.realizedPnl! >= 0 ? 'text-profit' : 'text-loss'} text-lg font-bold`}
                  />
                  <ResultRow
                    label="已實現損益率"
                    value={formatPercent(((Number(tradePrice) - holding.avgCost) / holding.avgCost) * 100)}
                    valueClass={Number(tradePrice) >= holding.avgCost ? 'text-profit' : 'text-loss'}
                  />
                  <ResultRow label="剩餘股數" value={`${result.remainingShares!.toLocaleString()} 股`} />
                  <ResultRow label="剩餘持倉成本" value={`NT$ ${formatLargeNumber(result.remainingCost!)}`} />
                </>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Calculator className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">輸入股數與價格後</p>
              <p className="text-sm text-muted-foreground">將即時顯示試算結果</p>
            </div>
          )}

          {/* AI recommendation — always visible once a holding is selected */}
          {holding && (
            <PlannerAICard
              holding={holding}
              action={action}
              tradeShares={Number(tradeShares) || 0}
              tradePrice={Number(tradePrice) || 0}
              newAvgCost={result?.action === 'buy' ? result.newAvgCost : undefined}
              realizedPnl={result?.action === 'sell' ? result.realizedPnl : undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}
