import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 lg:pl-56">
        <div className="min-h-screen p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
