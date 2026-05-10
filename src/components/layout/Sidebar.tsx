import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Calculator, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '投資組合' },
  { to: '/planner', icon: Calculator, label: '布局試算' },
  { to: '/ai-history', icon: History, label: 'AI 記錄' },
  { to: '/settings', icon: Settings, label: '設定' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-56 bg-card border-r border-border flex flex-col z-10">
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <TrendingUp className="w-5 h-5 text-primary shrink-0" />
        <span className="hidden lg:block ml-2 font-semibold text-foreground text-sm">
          台股分析器
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4">
        <p className="hidden lg:block text-xs text-muted-foreground px-3 py-2">
          v1.0.0
        </p>
      </div>
    </aside>
  )
}
