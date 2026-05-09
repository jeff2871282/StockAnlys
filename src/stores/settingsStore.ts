import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  claudeApiKey: string
  finmindToken: string
  setClaudeApiKey: (key: string) => void
  setFinmindToken: (token: string) => void
  clearAll: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      claudeApiKey: '',
      finmindToken: '',
      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setFinmindToken: (token) => set({ finmindToken: token }),
      clearAll: () => set({ claudeApiKey: '', finmindToken: '' }),
    }),
    { name: 'settings-storage' }
  )
)
