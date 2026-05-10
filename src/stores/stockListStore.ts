import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StockListItem {
  stockId: string
  stockName: string
  type: string
}

interface StockListState {
  stocks: StockListItem[]
  fetchedAt: string
  setStocks: (stocks: StockListItem[]) => void
  isStale: () => boolean
}

export const useStockListStore = create<StockListState>()(
  persist(
    (set, get) => ({
      stocks: [],
      fetchedAt: '',
      setStocks: (stocks) => set({ stocks, fetchedAt: new Date().toISOString() }),
      isStale: () => {
        const { fetchedAt } = get()
        if (!fetchedAt) return true
        const ageDays = (Date.now() - new Date(fetchedAt).getTime()) / 86400000
        return ageDays > 7
      },
    }),
    { name: 'stock-list-cache' }
  )
)
