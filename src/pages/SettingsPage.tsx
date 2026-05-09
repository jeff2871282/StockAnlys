import { useState } from 'react'
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'

function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 pr-10 rounded-md text-sm',
            'bg-input border border-border text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { claudeApiKey, finmindToken, setClaudeApiKey, setFinmindToken, clearAll } =
    useSettingsStore()

  const [claude, setClaude] = useState(claudeApiKey)
  const [finmind, setFinmind] = useState(finmindToken)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setClaudeApiKey(claude.trim())
    setFinmindToken(finmind.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    if (!confirm('確定要清除所有 API Key 設定嗎？')) return
    clearAll()
    setClaude('')
    setFinmind('')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">設定</h1>
      <p className="text-muted-foreground text-sm mb-8">
        所有 API Key 僅儲存於本機瀏覽器，不會傳送至任何伺服器。
      </p>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <ApiKeyInput
          label="Claude API Key"
          value={claude}
          onChange={setClaude}
          placeholder="sk-ant-..."
        />
        <ApiKeyInput
          label="FinMind Token（選填）"
          value={finmind}
          onChange={setFinmind}
          placeholder="填入後可提升至 600 次/小時"
        />

        <div className="pt-2 flex gap-3">
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              saved
                ? 'bg-profit/20 text-profit'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? '已儲存' : '儲存'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清除
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
        <p>· Claude API Key：前往 <strong className="text-foreground">console.anthropic.com</strong> 取得</p>
        <p>· FinMind Token：前往 <strong className="text-foreground">finmindtrade.com</strong> 註冊後取得</p>
        <p>· 無 FinMind Token 仍可使用，但每小時限 300 次請求</p>
      </div>
    </div>
  )
}
