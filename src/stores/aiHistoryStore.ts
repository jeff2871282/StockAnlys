import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AIAnalysisRecord {
  id: string
  stockId: string
  stockName: string
  analysis: string
  summary: string
  createdAt: string
  stockPrice?: number
}

interface AIHistoryState {
  records: AIAnalysisRecord[]
  addRecord: (record: Omit<AIAnalysisRecord, 'id' | 'createdAt'>) => string
  removeRecord: (id: string) => void
  clearAll: () => void
}

export const useAIHistoryStore = create<AIHistoryState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => {
        const id = crypto.randomUUID()
        set((state) => ({
          records: [
            { ...record, id, createdAt: new Date().toISOString() },
            ...state.records,
          ],
        }))
        return id
      },
      removeRecord: (id) =>
        set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
      clearAll: () => set({ records: [] }),
    }),
    { name: 'ai-history-storage' }
  )
)
