import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { StockDetailPage } from '@/pages/StockDetailPage'
import { PlannerPage } from '@/pages/PlannerPage'
import { AIHistoryPage } from '@/pages/AIHistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/stock/:symbol" element={<StockDetailPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/ai-history" element={<AIHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}
