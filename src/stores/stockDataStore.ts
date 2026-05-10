import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StockPrice {
  date: string
  close: number
  open: number
  max: number
  min: number
  spread: number
  tradingVolume: number
}

export interface StockPER {
  date: string
  per: number
  pbr: number
  dividendYield: number
}

export interface MonthRevenue {
  date: string
  revenue: number
  revenueMonth: number
  revenueYear: number
  yoy?: number
}

export interface FinancialItem {
  date: string
  type: string
  value: number
  originName: string
}

export interface ForeignShareholding {
  date: string
  foreignInvestmentSharesRatio: number
  foreignInvestmentRemainingShares: number
}

export interface StockInfo {
  stockId: string
  stockName: string
  industryCategory: string
}

export interface PERHistory {
  date: string
  per: number
  pbr: number
}

export interface StockData {
  info?: StockInfo
  latestPrice?: StockPrice
  priceHistory: StockPrice[]   // 3-month daily OHLC for K-line
  per?: StockPER
  perHistory: PERHistory[]     // 3-month P/E history
  revenues: MonthRevenue[]
  financials: FinancialItem[]
  shareholding?: ForeignShareholding
  fetchedAt: string
}

interface StockDataState {
  cache: Record<string, StockData>
  setStockData: (stockId: string, data: Partial<StockData>) => void
  getStockData: (stockId: string) => StockData | undefined
  isCacheStale: (stockId: string, maxAgeMinutes?: number) => boolean
  clearCache: (stockId?: string) => void
}

const EMPTY_STOCK_DATA = (): StockData => ({
  priceHistory: [],
  perHistory: [],
  revenues: [],
  financials: [],
  fetchedAt: '',
})

export const useStockDataStore = create<StockDataState>()(
  persist(
    (set, get) => ({
      cache: {},
      setStockData: (stockId, data) =>
        set((state) => ({
          cache: {
            ...state.cache,
            [stockId]: {
              ...(state.cache[stockId] ?? EMPTY_STOCK_DATA()),
              ...data,
              fetchedAt: new Date().toISOString(),
            },
          },
        })),
      getStockData: (stockId) => get().cache[stockId],
      isCacheStale: (stockId, maxAgeMinutes = 30) => {
        const data = get().cache[stockId]
        if (!data?.fetchedAt) return true
        const age = (Date.now() - new Date(data.fetchedAt).getTime()) / 60000
        return age > maxAgeMinutes
      },
      clearCache: (stockId) =>
        set((state) => {
          if (stockId) {
            const { [stockId]: _, ...rest } = state.cache
            return { cache: rest }
          }
          return { cache: {} }
        }),
    }),
    { name: 'stock-data-cache' }
  )
)
