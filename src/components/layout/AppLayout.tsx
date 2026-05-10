import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useStockListFetch } from '@/hooks/useStockListFetch'

export function AppLayout() {
  useStockListFetch()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 lg:pl-56">
        <div className="min-h-screen p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
