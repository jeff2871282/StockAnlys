import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Holding {
  id: string
  stockId: string
  stockName: string
  shares: number
  avgCost: number
  note?: string
  createdAt: string
  updatedAt: string
}

interface PortfolioState {
  holdings: Holding[]
  addHolding: (holding: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateHolding: (id: string, updates: Partial<Omit<Holding, 'id' | 'createdAt'>>) => void
  removeHolding: (id: string) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      addHolding: (holding) =>
        set((state) => ({
          holdings: [
            ...state.holdings,
            {
              ...holding,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
          ),
        })),
      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),
    }),
    { name: 'portfolio-storage' }
  )
)
