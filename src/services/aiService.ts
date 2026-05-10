import type { FMPER, FMShareholding } from './finmind'
import type { FMMonthRevenue } from './finmind'
import { TAIWAN_STOCK_RESEARCH_CONTEXT } from './researchContext'

interface AnalysisInput {
  stockId: string
  stockName: string
  latestPrice?: number
  priceDate?: string
  myShares?: number
  myAvgCost?: number
  per?: FMPER | null
  revenues: (FMMonthRevenue & { yoy?: number })[]
  eps?: number | null
  grossMargin?: number | null
  operatingMargin?: number | null
  shareholding?: FMShareholding | null
}

function buildPrompt(input: AnalysisInput): string {
  const {
    stockId, stockName, latestPrice, priceDate,
    myShares, myAvgCost, per, revenues, eps,
    grossMargin, operatingMargin, shareholding,
  } = input

  const positionSection = myShares && myAvgCost
    ? `## 我的持倉
- 持有股數：${myShares.toLocaleString()} 股
- 平均成本：NT$ ${myAvgCost.toFixed(2)}
- 持倉成本：NT$ ${(myShares * myAvgCost).toLocaleString()}
${latestPrice ? `- 目前市值：NT$ ${(myShares * latestPrice).toLocaleString()}
- 未實現損益：NT$ ${((latestPrice - myAvgCost) * myShares).toLocaleString()}（${(((latestPrice - myAvgCost) / myAvgCost) * 100).toFixed(2)}%）` : ''}`
    : ''

  const priceSection = latestPrice
    ? `## 股價資訊（${priceDate ?? '最新'}）\n- 收盤價：NT$ ${latestPrice}`
    : ''

  const valuationSection = per
    ? `## 估值指標（${per.date}）
- 本益比（P/E）：${per.PER.toFixed(2)} 倍
- 淨值比（P/B）：${per.PBR.toFixed(2)} 倍
- 殖利率：${per.dividend_yield.toFixed(2)}%`
    : ''

  const financialSection = (eps != null || grossMargin != null || operatingMargin != null)
    ? `## 財務指標（近期季報）
${eps != null ? `- EPS：NT$ ${eps.toFixed(2)}` : ''}
${grossMargin != null ? `- 毛利率：${grossMargin.toFixed(2)}%` : ''}
${operatingMargin != null ? `- 營業利益率：${operatingMargin.toFixed(2)}%` : ''}`
    : ''

  const recent12 = revenues.slice(-12)
  const revenueSection = recent12.length
    ? `## 近12月營收
${recent12.map((r) =>
  `- ${r.revenue_year}/${String(r.revenue_month).padStart(2, '0')}：NT$ ${r.revenue.toLocaleString()} 元${r.yoy != null ? `（YoY ${r.yoy >= 0 ? '+' : ''}${r.yoy.toFixed(1)}%）` : ''}`
).join('\n')}`
    : ''

  const shareholdingSection = shareholding
    ? `## 外資持股（${shareholding.date}）
- 外資持股比例：${shareholding.ForeignInvestmentSharesRatio.toFixed(2)}%`
    : ''

  return `你是一位專業的台股分析師，請針對以下股票資料進行全面分析，並以繁體中文回覆。

# 分析標的：${stockName}（${stockId}）

${positionSection}

${priceSection}

${valuationSection}

${financialSection}

${revenueSection}

${shareholdingSection}

---

請依以下架構分析，**每個章節最多 3–4 個要點，不得使用 ASCII 圖表或長表格**：

## 1. 估值評估
根據 P/E、P/B、殖利率，用 2–3 句話判斷目前股價位置，說明與台股平均的差距。

## 2. 營收動能
用 2–3 個觀察句總結近12月趨勢（直接說數字與方向，不畫圖）。

## 3. 獲利能力
根據 EPS、毛利率、營業利益率，用 2–3 句話評估獲利品質。

## 4. 主要風險
條列 2–3 個最關鍵風險，每點一句話。

## 5. 布局建議
給出明確的操作結論（持有 / 加碼 / 減碼），並說明具體觸發條件。

**格式規範**：
- 禁止使用 ASCII 圖表（▓ 等字元）
- 禁止超過 4 欄的表格
- 全文嚴格控制在 800 個中文字以內，超過即停止並收尾
- 語言直接、實用，不重複已知數據`
}

export interface AIAnalysisResult {
  content: string
  summary: string
}

export async function runAIAnalysis(
  apiKey: string,
  input: AnalysisInput
): Promise<AIAnalysisResult> {
  const prompt = buildPrompt(input)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: TAIWAN_STOCK_RESEARCH_CONTEXT,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`)
  }

  const data = await res.json() as {
    content: { type: string; text: string }[]
  }
  const content = data.content.find((c) => c.type === 'text')?.text ?? ''

  // Extract summary from first non-empty line after the title
  const lines = content.split('\n').filter((l) => l.trim())
  const summary = lines.find((l) => !l.startsWith('#'))?.slice(0, 80) ?? `${input.stockName} AI 分析`

  return { content, summary }
}

export interface PlannerRecommendationInput {
  stockId: string
  stockName: string
  action: 'buy' | 'sell'
  tradeShares: number
  tradePrice: number
  currentShares: number
  avgCost: number
  currentPrice?: number
  priceDate?: string
  previousAnalysis?: string   // full text from AI history record
  analysisDate?: string
  newAvgCost?: number         // for buy: post-trade avg cost
  realizedPnl?: number        // for sell: realized P&L
}

function buildPlannerPrompt(input: PlannerRecommendationInput): string {
  const {
    stockId, stockName, action, tradeShares, tradePrice,
    currentShares, avgCost, currentPrice, priceDate,
    previousAnalysis, analysisDate, newAvgCost, realizedPnl,
  } = input

  const actionLabel = action === 'buy' ? '買進（加碼）' : '賣出（減碼）'
  const today = new Date().toLocaleDateString('zh-TW')

  const positionSection = `## 目前持倉
- 股票：${stockName}（${stockId}）
- 持有股數：${currentShares.toLocaleString()} 股
- 平均成本：NT$ ${avgCost.toFixed(2)}
- 持倉總成本：NT$ ${(currentShares * avgCost).toLocaleString()}`

  const priceSection = currentPrice
    ? `## 最新股價（${priceDate ?? '最新'}）
- 收盤價：NT$ ${currentPrice.toFixed(2)}
- 與均成本差異：${currentPrice >= avgCost ? '+' : ''}${(((currentPrice - avgCost) / avgCost) * 100).toFixed(2)}%`
    : ''

  const tradeSection = `## 計畫操作（${today}）
- 操作方向：${actionLabel}
- 計畫股數：${tradeShares.toLocaleString()} 股
- 計畫價格：NT$ ${tradePrice.toFixed(2)}
${action === 'buy' && newAvgCost
    ? `- 加碼後新均成本：NT$ ${newAvgCost.toFixed(2)}
- 加碼後總股數：${(currentShares + tradeShares).toLocaleString()} 股`
    : action === 'sell' && realizedPnl !== undefined
    ? `- 預計已實現損益：${realizedPnl >= 0 ? '+' : ''}NT$ ${realizedPnl.toLocaleString()}
- 賣出後剩餘股數：${(currentShares - tradeShares).toLocaleString()} 股`
    : ''}`

  const historySection = previousAnalysis
    ? `## 前次 AI 分析參考（分析日期：${analysisDate ?? '不詳'}）
${previousAnalysis}`
    : '## 前次 AI 分析\n（無歷史分析記錄，請依現有資訊判斷）'

  return `你是一位台股操作顧問。使用者正在規劃對以下股票執行操作，請給予簡潔明確的操作建議。

${positionSection}

${priceSection}

${tradeSection}

${historySection}

---

請依以下架構給出建議（繁體中文，簡潔實用）：

## 操作時機評估
根據目前股價位置、估值與前次分析的判斷，說明現在是否為適合${action === 'buy' ? '加碼' : '減碼'}的時機。

## 計畫操作的利弊
- 支持此操作的理由（2點）
- 反對或需謹慎的理由（1-2點）

## 具體建議
給出明確結論：**建議執行 / 建議觀望 / 建議避免**，並說明執行條件或停損點。

請直接切入重點，不需要重複描述數據。`
}

export async function runPlannerRecommendation(
  apiKey: string,
  input: PlannerRecommendationInput
): Promise<string> {
  const prompt = buildPlannerPrompt(input)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: TAIWAN_STOCK_RESEARCH_CONTEXT,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${res.status}`)
  }

  const data = await res.json() as { content: { type: string; text: string }[] }
  return data.content.find((c) => c.type === 'text')?.text ?? ''
}
