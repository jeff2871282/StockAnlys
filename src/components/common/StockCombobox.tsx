import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  stockId: string
  stockName: string
}

interface Props {
  heldOptions: ComboboxOption[]
  allOptions: ComboboxOption[]
  value: string
  onChange: (stockId: string) => void
  isLoading?: boolean
}

const ITEM_H = 36   // px per row
const LABEL_H = 30  // px per group label
const BUFFER = 5    // extra items above/below visible window

function OptionRow({
  option, highlighted, onSelect, dataIdx,
}: {
  option: ComboboxOption
  highlighted: boolean
  onSelect: (id: string) => void
  dataIdx: number
}) {
  return (
    <button
      type="button"
      data-idx={dataIdx}
      onMouseDown={(e) => { e.preventDefault(); onSelect(option.stockId) }}
      style={{ height: ITEM_H }}
      className={cn(
        'w-full flex items-center justify-between px-3 text-sm text-left transition-colors shrink-0',
        highlighted ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-accent'
      )}
    >
      <span className="truncate">{option.stockName}</span>
      <span className="text-xs text-muted-foreground ml-3 shrink-0 tabular-nums">{option.stockId}</span>
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ height: LABEL_H }}
      className="flex items-center px-3 text-xs font-medium text-muted-foreground bg-muted/60 sticky top-0 border-b border-border z-10"
    >
      {children}
    </div>
  )
}

/** Virtual list — renders only the rows near the visible area. */
function VirtualList({
  items, highlighted, onSelect, idxOffset, scrollTop, topOffset,
}: {
  items: ComboboxOption[]
  highlighted: number
  onSelect: (id: string) => void
  idxOffset: number   // highlighted index = idxOffset + local index
  scrollTop: number   // scroll position of outer container
  topOffset: number   // px of content above this virtual section
}) {
  const relScroll = Math.max(0, scrollTop - topOffset)
  const visibleRows = Math.ceil(288 / ITEM_H)  // 288 = max-h-72
  const start = Math.max(0, Math.floor(relScroll / ITEM_H) - BUFFER)
  const end = Math.min(items.length, start + visibleRows + BUFFER * 2)
  const totalH = items.length * ITEM_H

  return (
    <div style={{ position: 'relative', height: totalH }}>
      {items.slice(start, end).map((o, i) => {
        const absIdx = start + i
        return (
          <div
            key={o.stockId}
            style={{ position: 'absolute', top: absIdx * ITEM_H, left: 0, right: 0, height: ITEM_H }}
          >
            <OptionRow
              option={o}
              highlighted={(idxOffset + absIdx) === highlighted}
              onSelect={onSelect}
              dataIdx={idxOffset + absIdx}
            />
          </div>
        )
      })}
    </div>
  )
}

export function StockCombobox({ heldOptions, allOptions, value, onChange, isLoading }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Deduplicate allOptions by stockId (guards against stale cache duplicates)
  const dedupedAll = useMemo(() => {
    const seen = new Set<string>(heldOptions.map((o) => o.stockId))
    return allOptions.filter((o) => { if (seen.has(o.stockId)) return false; seen.add(o.stockId); return true })
  }, [heldOptions, allOptions])

  const allMap = useMemo(() => {
    const m = new Map<string, ComboboxOption>()
    heldOptions.forEach((o) => m.set(o.stockId, o))
    dedupedAll.forEach((o) => m.set(o.stockId, o))
    return m
  }, [heldOptions, dedupedAll])

  const selected = allMap.get(value)
  const displayLabel = selected ? `${selected.stockName}（${selected.stockId}）` : ''

  // ── Filtered results (search mode) ────────────────────────────
  const { filteredHeld, filteredOther } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { filteredHeld: heldOptions, filteredOther: [] }
    const matches = (o: ComboboxOption) =>
      o.stockId.includes(q) || o.stockName.toLowerCase().includes(q)
    return {
      filteredHeld: heldOptions.filter(matches),
      filteredOther: dedupedAll.filter(matches).slice(0, 80),
    }
  }, [query, heldOptions, dedupedAll])

  const isSearching = query.trim().length > 0

  // flatList for keyboard navigation
  const flatList: ComboboxOption[] = isSearching
    ? [...filteredHeld, ...filteredOther]
    : [...heldOptions, ...dedupedAll]

  // topOffset for the virtual "全部台股" section (in default mode)
  const defaultTopOffset = useMemo(() => {
    if (heldOptions.length === 0) return LABEL_H
    return LABEL_H + heldOptions.length * ITEM_H + LABEL_H
  }, [heldOptions.length])

  // ── Scroll highlighted item into view ─────────────────────────
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  // ── Click outside ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const close = () => { setOpen(false); setQuery(''); setScrollTop(0) }

  const openDropdown = () => {
    setOpen(true)
    setHighlighted(0)
    setScrollTop(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (stockId: string) => {
    onChange(stockId)
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); openDropdown() }
      return
    }
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, flatList.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); if (flatList[highlighted]) handleSelect(flatList[highlighted].stockId) }
  }

  const handleScroll = () => {
    if (listRef.current) setScrollTop(listRef.current.scrollTop)
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* ── Trigger button ── */}
      {!open && (
        <button
          type="button"
          onClick={openDropdown}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-left"
        >
          <span className={displayLabel ? 'text-foreground' : 'text-muted-foreground'}>
            {displayLabel || '選擇或搜尋股票...'}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
        </button>
      )}

      {/* ── Search input ── */}
      {open && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0) }}
            placeholder="輸入股票代號或名稱..."
            className="w-full pl-9 pr-8 py-2.5 rounded-md text-sm bg-input border border-ring ring-2 ring-ring text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); close() }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Dropdown ── */}
      {open && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-xl max-h-72 overflow-y-auto"
        >
          {isSearching ? (
            /* ── Search results ── */
            filteredHeld.length === 0 && filteredOther.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">找不到符合的股票</div>
            ) : (
              <>
                {filteredHeld.length > 0 && (
                  <>
                    <GroupLabel>我的持倉</GroupLabel>
                    {filteredHeld.map((o, i) => (
                      <OptionRow key={o.stockId} option={o} highlighted={i === highlighted} onSelect={handleSelect} dataIdx={i} />
                    ))}
                  </>
                )}
                {filteredOther.length > 0 && (
                  <>
                    <GroupLabel>全部台股</GroupLabel>
                    {filteredOther.map((o, i) => {
                      const idx = filteredHeld.length + i
                      return (
                        <OptionRow key={o.stockId} option={o} highlighted={idx === highlighted} onSelect={handleSelect} dataIdx={idx} />
                      )
                    })}
                    {filteredOther.length >= 80 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border">
                        顯示前 80 筆，請輸入更精確的關鍵字
                      </div>
                    )}
                  </>
                )}
              </>
            )
          ) : (
            /* ── Default: held + all stocks (virtualized) ── */
            <>
              {heldOptions.length > 0 && (
                <>
                  <GroupLabel>我的持倉（{heldOptions.length} 檔）</GroupLabel>
                  {heldOptions.map((o, i) => (
                    <OptionRow key={o.stockId} option={o} highlighted={i === highlighted} onSelect={handleSelect} dataIdx={i} />
                  ))}
                </>
              )}
              <GroupLabel>
                {isLoading ? '台股清單載入中...' : `全部台股（${dedupedAll.length.toLocaleString()} 支）`}
              </GroupLabel>
              <VirtualList
                items={dedupedAll}
                highlighted={highlighted}
                onSelect={handleSelect}
                idxOffset={heldOptions.length}
                scrollTop={scrollTop}
                topOffset={defaultTopOffset}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
