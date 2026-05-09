import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ChevronRight } from 'lucide-react'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import { useStockDataStore } from '@/stores/stockDataStore'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  holdings: Holding[]
  onEdit: (holding: Holding) => void
  onDelete: (id: string) => void
}

export function HoldingsTable({ holdings, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const { getStockData } = useStockDataStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-sm">尚無持倉，點擊「新增持倉」開始建立你的投資組合</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">股票</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">股數</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">均成本</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">目前股價</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">持倉成本</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">目前市值</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">未實現損益</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">備註</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, idx) => {
              const stockData = getStockData(h.stockId)
              const currentPrice = stockData?.latestPrice?.close
              const totalCost = h.shares * h.avgCost
              const marketValue = currentPrice != null ? h.shares * currentPrice : null
              const unrealizedPnl = currentPrice != null ? (currentPrice - h.avgCost) * h.shares : null
              const pnlPct = currentPrice != null ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : null
              const isProfit = pnlPct != null && pnlPct >= 0

              return (
                <tr
                  key={h.id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                  }`}
                >
                  {/* 股票名稱 + 代號 */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/stock/${h.stockId}`)}
                      className="flex items-center gap-1.5 group text-left"
                    >
                      <div>
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                          {h.stockName !== h.stockId ? h.stockName : h.stockId}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {h.stockName !== h.stockId && (
                          <div className="text-xs text-muted-foreground">{h.stockId}</div>
                        )}
                      </div>
                    </button>
                  </td>

                  {/* 股數 */}
                  <td className="px-4 py-3 text-right text-foreground">
                    {h.shares.toLocaleString('zh-TW')}
                  </td>

                  {/* 均成本 */}
                  <td className="px-4 py-3 text-right text-foreground">
                    {formatCurrency(h.avgCost, 2)}
                  </td>

                  {/* 目前股價 */}
                  <td className="px-4 py-3 text-right text-foreground">
                    {currentPrice != null ? formatCurrency(currentPrice, 2) : <span className="text-muted-foreground">—</span>}
                  </td>

                  {/* 持倉成本 */}
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {formatCurrency(totalCost)}
                  </td>

                  {/* 目前市值 */}
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {marketValue != null ? formatCurrency(marketValue) : <span className="text-muted-foreground">—</span>}
                  </td>

                  {/* 未實現損益 */}
                  <td className="px-4 py-3 text-right">
                    {unrealizedPnl != null && pnlPct != null ? (
                      <div className={cn('font-medium', isProfit ? 'text-profit' : 'text-loss')}>
                        <div>{unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}</div>
                        <div className="text-xs">{formatPercent(pnlPct)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 備註 */}
                  <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">
                    {h.note || '—'}
                  </td>

                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(h)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="編輯"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className={`p-1.5 rounded transition-colors ${
                          confirmDeleteId === h.id
                            ? 'text-loss bg-loss/10'
                            : 'text-muted-foreground hover:text-loss hover:bg-loss/10'
                        }`}
                        title={confirmDeleteId === h.id ? '再按一次確認刪除' : '刪除'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
