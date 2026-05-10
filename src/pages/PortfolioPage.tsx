import { useState } from 'react'
import { Plus } from 'lucide-react'
import { usePortfolioStore, type Holding } from '@/stores/portfolioStore'
import { HoldingFormModal } from '@/components/portfolio/HoldingFormModal'
import { HoldingsTable } from '@/components/portfolio/HoldingsTable'
import { SummaryCards } from '@/components/portfolio/SummaryCards'
import { AllocationChart } from '@/components/portfolio/AllocationChart'

export function PortfolioPage() {
  const { holdings, addHolding, updateHolding, removeHolding } = usePortfolioStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Holding | undefined>()

  const openAdd = () => {
    setEditTarget(undefined)
    setModalOpen(true)
  }

  const openEdit = (holding: Holding) => {
    setEditTarget(holding)
    setModalOpen(true)
  }

  const handleSubmit = (data: {
    stockId: string
    stockName: string
    shares: number
    avgCost: number
    note: string
  }) => {
    if (editTarget) {
      updateHolding(editTarget.id, {
        stockName: data.stockName,
        shares: data.shares,
        avgCost: data.avgCost,
        note: data.note,
      })
    } else {
      addHolding(data)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">投資組合總覽</h1>
          <p className="text-sm text-muted-foreground mt-1">管理你的台股持倉</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增持倉
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards holdings={holdings} />

      {/* Main content */}
      {holdings.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Holdings Table — takes 3/4 on xl */}
          <div className="xl:col-span-3">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">持倉清單</h2>
            <HoldingsTable
              holdings={holdings}
              onEdit={openEdit}
              onDelete={removeHolding}
            />
          </div>

          {/* Pie Chart — takes 1/3 */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">成本佔比</h2>
            <AllocationChart holdings={holdings} />
          </div>
        </div>
      ) : (
        <HoldingsTable holdings={[]} onEdit={openEdit} onDelete={removeHolding} />
      )}

      {/* Modal */}
      <HoldingFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editTarget}
      />
    </div>
  )
}
