import type { StockPER } from '@/stores/stockDataStore'

interface Props {
  per?: StockPER
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-muted rounded-lg px-4 py-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}

function perLevel(per: number): string {
  if (per <= 0) return '虧損'
  if (per < 10) return '偏低'
  if (per < 20) return '合理'
  if (per < 30) return '偏高'
  return '過高'
}

export function ValuationPanel({ per }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">估值指標</h3>

      {per ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="本益比 P/E"
              value={per.per > 0 ? `${per.per.toFixed(1)} 倍` : 'N/A'}
              hint={per.per > 0 ? perLevel(per.per) : undefined}
            />
            <MetricCard
              label="淨值比 P/B"
              value={`${per.pbr.toFixed(2)} 倍`}
              hint={per.pbr < 1 ? '低於淨值' : undefined}
            />
            <MetricCard
              label="殖利率"
              value={`${per.dividendYield.toFixed(2)}%`}
              hint={per.dividendYield >= 5 ? '高殖利率' : undefined}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">資料日期：{per.date}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">估值資料載入中...</p>
      )}
    </div>
  )
}
