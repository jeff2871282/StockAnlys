import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStockDataStore } from '@/stores/stockDataStore'
import {
  fetchLatestPrice,
  fetchPriceHistory,
  fetchPER,
  fetchPERHistory,
  fetchMonthRevenues,
  fetchFinancials,
  fetchShareholding,
  computeRevenueWithYoY,
} from '@/services/finmind'

export interface StockFetchState {
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useStockFetch(stockId: string): StockFetchState {
  const { finmindToken } = useSettingsStore()
  const { setStockData, isCacheStale } = useStockDataStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = finmindToken || undefined

  const fetchAll = useCallback(async () => {
    if (!stockId) return
    setLoading(true)
    setError(null)

    try {
      const [priceRaw, priceHistRaw, perRaw, perHistRaw, revenueRaw, financialRaw, shareholdingRaw] =
        await Promise.allSettled([
          fetchLatestPrice(stockId, token),
          fetchPriceHistory(stockId, token),
          fetchPER(stockId, token),
          fetchPERHistory(stockId, token),
          fetchMonthRevenues(stockId, token),
          fetchFinancials(stockId, token),
          fetchShareholding(stockId, token),
        ])

      const latestPrice = priceRaw.status === 'fulfilled' ? priceRaw.value : null
      const priceHistory = priceHistRaw.status === 'fulfilled' ? priceHistRaw.value : []
      const per = perRaw.status === 'fulfilled' ? perRaw.value : null
      const perHistory = perHistRaw.status === 'fulfilled' ? perHistRaw.value : []
      const revenueRows = revenueRaw.status === 'fulfilled' ? revenueRaw.value : []
      const financialRows = financialRaw.status === 'fulfilled' ? financialRaw.value : []
      const shareholding = shareholdingRaw.status === 'fulfilled' ? shareholdingRaw.value : null

      const revenuesWithYoY = computeRevenueWithYoY(revenueRows).slice(-24)

      const toStockPrice = (r: { date: string; close: number; open: number; max: number; min: number; spread: number; Trading_Volume: number }) => ({
        date: r.date,
        close: r.close,
        open: r.open,
        max: r.max,
        min: r.min,
        spread: r.spread,
        tradingVolume: r.Trading_Volume,
      })

      setStockData(stockId, {
        latestPrice: latestPrice ? toStockPrice(latestPrice) : undefined,
        priceHistory: priceHistory.map(toStockPrice),
        per: per
          ? { date: per.date, per: per.PER, pbr: per.PBR, dividendYield: per.dividend_yield }
          : undefined,
        perHistory: perHistory.map((p) => ({ date: p.date, per: p.PER, pbr: p.PBR })),
        revenues: revenuesWithYoY.map((r) => ({
          date: r.date,
          revenue: r.revenue,
          revenueMonth: r.revenue_month,
          revenueYear: r.revenue_year,
          yoy: r.yoy,
        })),
        financials: financialRows.map((f) => ({
          date: f.date,
          type: f.type,
          value: f.value,
          originName: f.origin_name,
        })),
        shareholding: shareholding
          ? {
              date: shareholding.date,
              foreignInvestmentSharesRatio: shareholding.ForeignInvestmentSharesRatio,
              foreignInvestmentRemainingShares: shareholding.ForeignInvestmentRemainingShares,
            }
          : undefined,
      })

      const allFailed =
        priceRaw.status === 'rejected' &&
        perRaw.status === 'rejected' &&
        revenueRaw.status === 'rejected'

      if (allFailed) {
        setError('無法取得股票資料，請確認股票代號是否正確，或稍後再試')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '資料載入失敗')
    } finally {
      setLoading(false)
    }
  }, [stockId, token, setStockData])

  useEffect(() => {
    if (isCacheStale(stockId)) {
      fetchAll()
    }
  }, [stockId, fetchAll, isCacheStale])

  return { loading, error, refresh: fetchAll }
}
