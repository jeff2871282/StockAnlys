import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, ColorType } from 'lightweight-charts'
import type { StockPrice } from '@/stores/stockDataStore'

interface Props {
  priceHistory: StockPrice[]
}

// lightweight-charts only parses hex/rgb/rgba — not hsl()
const DARK_THEME = {
  background: { type: ColorType.Solid, color: '#151e32' },  // hsl(222,40%,14%)
  textColor: '#7589a3',                                       // hsl(215,20%,55%)
  grid: { vertLines: { color: '#24304c' }, horzLines: { color: '#24304c' } }, // hsl(222,35%,22%)
  crosshair: { vertLine: { color: '#3399ff' }, horzLine: { color: '#3399ff' } }, // hsl(210,100%,60%)
  timeScale: { borderColor: '#24304c' },
  rightPriceScale: { borderColor: '#24304c' },
}

export function KLineChart({ priceHistory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current || !priceHistory.length) return

    const chart = createChart(containerRef.current, {
      layout: DARK_THEME,
      grid: DARK_THEME.grid,
      crosshair: DARK_THEME.crosshair,
      timeScale: { ...DARK_THEME.timeScale, timeVisible: true, borderVisible: true },
      rightPriceScale: { ...DARK_THEME.rightPriceScale, borderVisible: true },
      width: containerRef.current.clientWidth,
      height: 300,
      handleScroll: true,
      handleScale: true,
    })
    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: 'hsl(210, 100%, 60%)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    const sorted = [...priceHistory].sort((a, b) => a.date.localeCompare(b.date))

    candleSeries.setData(
      sorted.map((p) => ({
        time: p.date as `${number}-${number}-${number}`,
        open: p.open,
        high: p.max,
        low: p.min,
        close: p.close,
      }))
    )

    volumeSeries.setData(
      sorted.map((p) => ({
        time: p.date as `${number}-${number}-${number}`,
        value: p.tradingVolume,
        color: p.close >= p.open ? '#22c55e44' : '#ef444444',
      }))
    )

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    const ro = new ResizeObserver(handleResize)
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [priceHistory])

  if (!priceHistory.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium text-foreground mb-2">K 線圖（近3個月）</h3>
        <p className="text-sm text-muted-foreground">股價資料載入中...</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-3">K 線圖（近3個月）</h3>
      <div ref={containerRef} className="w-full" />
    </div>
  )
}
