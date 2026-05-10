import { useEffect } from 'react'
import { useStockListStore } from '@/stores/stockListStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { fetchStockInfo } from '@/services/finmind'

export function useStockListFetch() {
  const { setStocks, isStale } = useStockListStore()
  const { finmindToken } = useSettingsStore()

  useEffect(() => {
    if (!isStale()) return
    const token = finmindToken || undefined
    fetchStockInfo(token)
      .then((rows) => {
        const seen = new Set<string>()
        const items = rows
          .filter((r) => r.stock_id && r.stock_name)
          .map((r) => ({ stockId: r.stock_id, stockName: r.stock_name, type: r.type }))
          .filter((item) => { if (seen.has(item.stockId)) return false; seen.add(item.stockId); return true })
          .sort((a, b) => a.stockId.localeCompare(b.stockId))
        setStocks(items)
      })
      .catch(() => { /* silent — not critical */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
