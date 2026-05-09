import { useState } from 'react'
import { Trash2, X, Bot, ChevronRight } from 'lucide-react'
import { useAIHistoryStore, type AIAnalysisRecord } from '@/stores/aiHistoryStore'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { cn } from '@/lib/utils'

function DetailDrawer({ record, onClose }: { record: AIAnalysisRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border-l border-border flex flex-col h-full shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                {record.stockName}（{record.stockId}）
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(record.createdAt).toLocaleString('zh-TW')}
              {record.stockPrice && ` · 分析時股價 NT$ ${record.stockPrice.toFixed(2)}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <MarkdownRenderer content={record.analysis} />
        </div>
      </div>
    </div>
  )
}

export function AIHistoryPage() {
  const { records, removeRecord, clearAll } = useAIHistoryStore()
  const [selected, setSelected] = useState<AIAnalysisRecord | null>(null)

  const handleClearAll = () => {
    if (!confirm(`確定要刪除全部 ${records.length} 筆 AI 分析記錄嗎？`)) return
    clearAll()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI 分析記錄</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {records.length} 筆記錄</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-loss transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            全部刪除
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">尚無 AI 分析記錄</p>
          <p className="text-muted-foreground text-xs mt-1">前往個股詳細頁進行分析後，點擊「儲存記錄」即可在此查看</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => setSelected(record)}
            >
              <Bot className="w-4 h-4 text-primary shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{record.stockName}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{record.stockId}</span>
                  {record.stockPrice && (
                    <span className="text-xs text-muted-foreground">NT$ {record.stockPrice.toFixed(2)}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{record.summary}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {new Date(record.createdAt).toLocaleString('zh-TW')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); removeRecord(record.id) }}
                  className={cn(
                    'p-1.5 rounded text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors',
                    'opacity-0 group-hover:opacity-100'
                  )}
                  title="刪除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailDrawer record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
