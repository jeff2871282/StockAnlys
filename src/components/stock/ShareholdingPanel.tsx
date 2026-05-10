import type { ForeignShareholding } from '@/stores/stockDataStore'

interface Props {
  shareholding?: ForeignShareholding
}

function GaugeBar({ pct }: { pct: number }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>0%</span>
        <span className="font-medium text-foreground">{pct.toFixed(2)}%</span>
        <span>100%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {pct >= 40 ? '外資高持股' : pct >= 20 ? '外資中等持股' : '外資低持股'}
      </p>
    </div>
  )
}

export function ShareholdingPanel({ shareholding }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">外資持股</h3>

      {shareholding ? (
        <>
          <GaugeBar pct={shareholding.foreignInvestmentSharesRatio} />
          <p className="text-xs text-muted-foreground mt-3">資料日期：{shareholding.date}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">外資持股資料載入中...</p>
      )}

      <div className="mt-3 px-3 py-2 bg-muted rounded text-xs text-muted-foreground">
        分析師目標價：此功能需付費資料，未來版本支援
      </div>
    </div>
  )
}
