const BASE = 'https://api.finmindtrade.com/api/v4/data'

function buildUrl(params: Record<string, string>) {
  const u = new URLSearchParams(params)
  return `${BASE}?${u.toString()}`
}

async function get<T>(params: Record<string, string>, token?: string): Promise<T[]> {
  // Token goes in the URL — sending custom headers on a GET causes a CORS preflight
  // that FinMind's server doesn't support from browser origins.
  const allParams = token ? { ...params, token } : params
  const res = await fetch(buildUrl(allParams))
  if (!res.ok) throw new Error(`FinMind API error: ${res.status}`)
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg ?? 'FinMind API error')
  return json.data as T[]
}

function dateMonthsAgo(months: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FMStockPrice {
  date: string
  stock_id: string
  open: number
  max: number
  min: number
  close: number
  spread: number
  Trading_Volume: number
}

export interface FMPER {
  date: string
  stock_id: string
  dividend_yield: number
  PER: number
  PBR: number
}

export interface FMMonthRevenue {
  date: string
  stock_id: string
  revenue: number
  revenue_month: number
  revenue_year: number
}

export interface FMFinancial {
  date: string
  stock_id: string
  type: string
  value: number
  origin_name: string
}

export interface FMShareholding {
  date: string
  stock_id: string
  ForeignInvestmentSharesRatio: number
  ForeignInvestmentRemainingShares: number
  NumberOfSharesIssued: number
}

export interface FMStockInfo {
  stock_id: string
  stock_name: string
  industry_category: string
  type: string
  date: string
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchLatestPrice(stockId: string, token?: string): Promise<FMStockPrice | null> {
  const rows = await get<FMStockPrice>(
    { dataset: 'TaiwanStockPrice', data_id: stockId, start_date: dateMonthsAgo(1), end_date: today() },
    token
  )
  if (!rows.length) return null
  return rows[rows.length - 1]
}

// 3-month daily OHLC for K-line chart
export async function fetchPriceHistory(stockId: string, token?: string): Promise<FMStockPrice[]> {
  return get<FMStockPrice>(
    { dataset: 'TaiwanStockPrice', data_id: stockId, start_date: dateMonthsAgo(3), end_date: today() },
    token
  )
}

export async function fetchPER(stockId: string, token?: string): Promise<FMPER | null> {
  const rows = await get<FMPER>(
    { dataset: 'TaiwanStockPER', data_id: stockId, start_date: dateMonthsAgo(1), end_date: today() },
    token
  )
  if (!rows.length) return null
  return rows[rows.length - 1]
}

// 6-month P/E history for trend chart
export async function fetchPERHistory(stockId: string, token?: string): Promise<FMPER[]> {
  return get<FMPER>(
    { dataset: 'TaiwanStockPER', data_id: stockId, start_date: dateMonthsAgo(6), end_date: today() },
    token
  )
}

// Fetches 24 months so we can compute YoY for the latest 12
export async function fetchMonthRevenues(stockId: string, token?: string): Promise<FMMonthRevenue[]> {
  return get<FMMonthRevenue>(
    { dataset: 'TaiwanStockMonthRevenue', data_id: stockId, start_date: dateMonthsAgo(25), end_date: today() },
    token
  )
}

export async function fetchFinancials(stockId: string, token?: string): Promise<FMFinancial[]> {
  return get<FMFinancial>(
    { dataset: 'TaiwanStockFinancialStatements', data_id: stockId, start_date: dateMonthsAgo(24), end_date: today() },
    token
  )
}

export async function fetchShareholding(stockId: string, token?: string): Promise<FMShareholding | null> {
  const rows = await get<FMShareholding>(
    { dataset: 'TaiwanStockShareholding', data_id: stockId, start_date: dateMonthsAgo(2), end_date: today() },
    token
  )
  if (!rows.length) return null
  return rows[rows.length - 1]
}

export async function fetchStockInfo(token?: string): Promise<FMStockInfo[]> {
  return get<FMStockInfo>({ dataset: 'TaiwanStockInfo' }, token)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeRevenueWithYoY(rows: FMMonthRevenue[]): (FMMonthRevenue & { yoy?: number })[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((r) => {
    const prev = sorted.find(
      (p) => p.revenue_month === r.revenue_month && p.revenue_year === r.revenue_year - 1
    )
    const yoy = prev ? ((r.revenue - prev.revenue) / prev.revenue) * 100 : undefined
    return { ...r, yoy }
  })
}

export function extractFinancialMetric(financials: FMFinancial[], typeKeyword: string): FMFinancial | null {
  const matches = financials.filter((f) =>
    f.type.toLowerCase().includes(typeKeyword.toLowerCase()) ||
    f.origin_name.toLowerCase().includes(typeKeyword.toLowerCase())
  )
  if (!matches.length) return null
  return matches[matches.length - 1]
}

export function extractFinancialMetrics(financials: FMFinancial[]) {
  const byType = new Map<string, FMFinancial[]>()
  for (const f of financials) {
    const key = f.type
    if (!byType.has(key)) byType.set(key, [])
    byType.get(key)!.push(f)
  }

  const latest = (keyword: string): FMFinancial | null => {
    for (const [type, items] of byType.entries()) {
      if (type.toLowerCase().includes(keyword.toLowerCase())) {
        const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date))
        return sorted[0] ?? null
      }
    }
    return null
  }

  return {
    eps: latest('eps'),
    grossProfit: latest('gross'),
    operatingIncome: latest('operating'),
    netIncome: latest('net'),
    revenue: latest('revenue') ?? latest('operating_revenue'),
  }
}
