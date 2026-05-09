import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Holding } from '@/stores/portfolioStore'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: { stockId: string; stockName: string; shares: number; avgCost: number; note: string }) => void
  initial?: Holding
}

interface FormData {
  stockId: string
  stockName: string
  shares: string
  avgCost: string
  note: string
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 rounded-md text-sm',
        'bg-input border border-border text-foreground',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    />
  )
}

export function HoldingFormModal({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = !!initial

  const [form, setForm] = useState<FormData>({
    stockId: '',
    stockName: '',
    shares: '',
    avgCost: '',
    note: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              stockId: initial.stockId,
              stockName: initial.stockName,
              shares: String(initial.shares),
              avgCost: String(initial.avgCost),
              note: initial.note ?? '',
            }
          : { stockId: '', stockName: '', shares: '', avgCost: '', note: '' }
      )
      setErrors({})
    }
  }, [open, initial])

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = (): boolean => {
    const errs: Partial<FormData> = {}
    if (!form.stockId.trim()) errs.stockId = '請輸入股票代號'
    if (!form.shares || isNaN(Number(form.shares)) || Number(form.shares) <= 0)
      errs.shares = '請輸入有效股數'
    if (!form.avgCost || isNaN(Number(form.avgCost)) || Number(form.avgCost) <= 0)
      errs.avgCost = '請輸入有效成本'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      stockId: form.stockId.trim().toUpperCase(),
      stockName: form.stockName.trim() || form.stockId.trim().toUpperCase(),
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      note: form.note.trim(),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? '編輯持倉' : '新增持倉'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="股票代號 *" error={errors.stockId}>
              <Input
                value={form.stockId}
                onChange={set('stockId')}
                placeholder="例：2330"
                disabled={isEdit}
                className={isEdit ? 'opacity-60 cursor-not-allowed' : ''}
              />
            </Field>
            <Field label="股票名稱">
              <Input
                value={form.stockName}
                onChange={set('stockName')}
                placeholder="例：台積電（選填）"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="持有股數 *" error={errors.shares}>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.shares}
                onChange={set('shares')}
                placeholder="例：1000"
              />
            </Field>
            <Field label="平均成本（元）*" error={errors.avgCost}>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.avgCost}
                onChange={set('avgCost')}
                placeholder="例：850.00"
              />
            </Field>
          </div>

          <Field label="備註">
            <textarea
              value={form.note}
              onChange={set('note')}
              placeholder="可記錄買進原因、策略等..."
              rows={2}
              className={cn(
                'w-full px-3 py-2 rounded-md text-sm resize-none',
                'bg-input border border-border text-foreground',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </Field>

          {/* 成本試算 */}
          {form.shares && form.avgCost && Number(form.shares) > 0 && Number(form.avgCost) > 0 && (
            <div className="px-3 py-2.5 bg-muted rounded-md text-sm">
              <span className="text-muted-foreground">持倉成本：</span>
              <span className="text-foreground font-medium">
                NT$ {(Number(form.shares) * Number(form.avgCost)).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-muted-foreground ml-2">（{Number(form.shares).toLocaleString()} 股 × {Number(form.avgCost).toLocaleString()} 元）</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isEdit ? '儲存變更' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
