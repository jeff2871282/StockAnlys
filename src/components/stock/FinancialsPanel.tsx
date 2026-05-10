import type { FinancialItem } from '@/stores/stockDataStore'

interface Props {
  financials: FinancialItem[]
}

function findMetric(financials: FinancialItem[], ...keywords: string[]): FinancialItem | null {
  for (const kw of keywords) {
    const match = financials
      .filter((f) =>
        f.type.toLowerCase().includes(kw.toLowerCase()) ||
        f.originName.toLowerCase().includes(kw)
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (match) return match
  }
  return null
}

function MetricRow({ label, item, suffix = '', decimals = 2 }: {
  label: string
  item: FinancialItem | null
  suffix?: string
  decimals?: number
}) {
  if (!item) return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{item.date} 季報</p>
      </div>
      <p className="text-sm font-medium text-foreground">
        {item.value.toFixed(decimals)}{suffix}
      </p>
    </div>
  )
}

export function FinancialsPanel({ financials }: Props) {
  const eps = findMetric(financials, 'eps', 'EPS', '每股盈餘')
  const grossMargin = findMetric(financials, 'GrossProfit', 'gross_profit', '毛利率', 'gross')
  const operatingIncome = findMetric(financials, 'OperatingIncome', 'operating_income', '營業利益率', 'operating')
  const netIncome = findMetric(financials, 'NetIncome', 'net_income', '本期淨利', 'net')
  const revenue = findMetric(financials, 'OperatingRevenue', 'revenue', '營業收入')

  const hasData = !!(eps || grossMargin || operatingIncome || netIncome || revenue)

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">獲利能力（季報）</h3>

      {hasData ? (
        <div>
          <MetricRow label="每股盈餘 EPS" item={eps} suffix=" 元" />
          <MetricRow label="營業收入" item={revenue} suffix=" 千元" decimals={0} />
          <MetricRow label="毛利" item={grossMargin} suffix=" 千元" decimals={0} />
          <MetricRow label="營業利益" item={operatingIncome} suffix=" 千元" decimals={0} />
          <MetricRow label="本期淨利" item={netIncome} suffix=" 千元" decimals={0} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">財報資料載入中...</p>
      )}
    </div>
  )
}
