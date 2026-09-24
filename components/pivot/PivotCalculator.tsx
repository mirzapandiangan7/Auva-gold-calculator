'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calculator,
  RefreshCw,
  SlidersHorizontal,
  Clock3,
  CalendarDays,
  Share2,
  Home,
  Banknote,
  TrendingUp,
  Newspaper,
} from 'lucide-react'
import { calculatePivotLevels, determineSignal } from '@/lib/calculate-pivot'
import type { InstrumentConfig } from '@/lib/instrument-config'

// ── Types ────────────────────────────────────────────────────────────────────

export interface OhlcRow {
  date: string
  open: number
  high: number
  low: number
  close: number
  symbol: string
}

interface PivotCalculatorProps {
  initialData: OhlcRow[]
  config: InstrumentConfig
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

const fmtShortDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

/** Midpoint between two price levels */
const midpoint = (a: number, b: number) => (a + b) / 2

const escapeSvg = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}[char] ?? char))

const createShareSvg = (
  config: InstrumentConfig,
  signal: NonNullable<ReturnType<typeof determineSignal>>,
  levels: ReturnType<typeof calculatePivotLevels>,
) => {
  const accent = config.accentColor
  const rows = [
    ['R4', levels.r4], ['R3', levels.r3], ['R2', levels.r2], ['R1', levels.r1],
    ['PP', levels.p], ['S1', levels.s1], ['S2', levels.s2], ['S3', levels.s3], ['S4', levels.s4],
  ]
  const rowMarkup = rows.map(([label, value], index) => {
    const y = 260 + index * 48
    const fill = label === 'PP' ? accent : '#f5f7fb'
    const text = label === 'PP' ? '#ffffff' : '#172033'
    return `<rect x="44" y="${y}" width="632" height="36" rx="8" fill="${fill}"/><text x="62" y="${y + 23}" fill="${text}" font-size="15" font-weight="700">${label}</text><text x="658" y="${y + 23}" text-anchor="end" fill="${text}" font-size="15" font-family="monospace" font-weight="700">${fmtMoney(Number(value))}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="760" viewBox="0 0 720 760"><rect width="720" height="760" fill="#f4f7fb"/><rect x="24" y="24" width="672" height="712" rx="22" fill="#ffffff" stroke="#e2e8f0"/><text x="44" y="65" fill="${accent}" font-size="14" font-weight="700" letter-spacing="1">${escapeSvg(config.analysisName)} FORMULA</text><text x="44" y="105" fill="#111827" font-size="28" font-weight="800">Pivot Point Result</text><text x="44" y="145" fill="#64748b" font-size="15">${escapeSvg(config.label)} | Standard Floor Pivots</text><rect x="44" y="174" width="632" height="62" rx="12" fill="${signal.direction === 'BUY' ? '#168343' : signal.direction === 'SELL' ? '#c6284d' : '#475569'}"/><text x="62" y="213" fill="#ffffff" font-size="24" font-weight="800">${signal.direction === 'BUY' ? '↑' : signal.direction === 'SELL' ? '↓' : '•'} ${signal.direction}</text><text x="658" y="211" text-anchor="end" fill="#ffffff" font-size="14" font-weight="700">${escapeSvg(signal.bias)}</text><text x="44" y="228" fill="#64748b" font-size="12">Signal from Pivot Point compared with the reference open</text>${rowMarkup}<text x="44" y="718" fill="#64748b" font-size="12">P = (High + Low + Close) / 3 | BUY: Pivot above reference open | SELL: Pivot below reference open</text></svg>`
}

async function sharePivotImage(config: InstrumentConfig, signal: NonNullable<ReturnType<typeof determineSignal>>, levels: ReturnType<typeof calculatePivotLevels>) {
  const svg = createShareSvg(config, signal, levels)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const imageUrl = URL.createObjectURL(blob)
  const image = new Image()
  image.src = imageUrl
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Unable to create share image'))
  })
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 760
  canvas.getContext('2d')?.drawImage(image, 0, 0)
  URL.revokeObjectURL(imageUrl)
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!png) throw new Error('Unable to export share image')

  const file = new File([png], `auva-${config.dbSymbol.toLowerCase()}-pivot.png`, { type: 'image/png' })
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title: `${config.label} Pivot Signal`, text: `${signal.direction} signal - ${signal.bias}`, files: [file] })
    return
  }

  const downloadUrl = URL.createObjectURL(png)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = file.name
  link.click()
  URL.revokeObjectURL(downloadUrl)
  window.open(`https://wa.me/?text=${encodeURIComponent(`${config.label} Pivot Signal: ${signal.direction} - ${signal.bias}`)}`, '_blank', 'noopener,noreferrer')
}

// ── Component ────────────────────────────────────────────────────────────────

export function PivotCalculator({ initialData, config }: PivotCalculatorProps) {
  const primary = initialData[0] ?? { open: 0, high: 0, low: 0, close: 0, date: '', symbol: '' }

  // Form state — editable overrides (prefilled from latest DB row)
  const [open, setOpen] = useState(String(primary.open))
  const [high, setHigh] = useState(String(primary.high))
  const [low, setLow] = useState(String(primary.low))
  const [close, setClose] = useState(String(primary.close))
  const [openToday, setOpenToday] = useState(String(primary.open))

  // Calculated pivot levels (null = not yet calculated)
  const [levels, setLevels] = useState<ReturnType<typeof calculatePivotLevels> | null>(
    initialData.length > 0 ? calculatePivotLevels(primary) : null,
  )
  const [calcOpenToday, setCalcOpenToday] = useState<number | null>(
    initialData.length > 0 ? primary.open : null,
  )

  const handleCalculate = useCallback(() => {
    const o = parseFloat(open)
    const h = parseFloat(high)
    const l = parseFloat(low)
    const c = parseFloat(close)
    const ot = parseFloat(openToday)
    if ([o, h, l, c, ot].some(isNaN)) return

    setLevels(calculatePivotLevels({ open: o, high: h, low: l, close: c }))
    setCalcOpenToday(ot)
  }, [open, high, low, close, openToday])

  const handleUseHistoricalData = useCallback((row: OhlcRow) => {
    setOpen(String(row.open))
    setHigh(String(row.high))
    setLow(String(row.low))
    setClose(String(row.close))
    setOpenToday(String(row.open))
    setLevels(calculatePivotLevels(row))
    setCalcOpenToday(row.open)
  }, [])

  const handleReset = useCallback(() => {
    setOpen(String(primary.open))
    setHigh(String(primary.high))
    setLow(String(primary.low))
    setClose(String(primary.close))
    setOpenToday(String(primary.open))
    setLevels(null)
    setCalcOpenToday(null)
  }, [primary])

  const signal = levels !== null && calcOpenToday !== null
    ? determineSignal(calcOpenToday, levels)
    : null

  const handleQuickShare = useCallback(async () => {
    if (!levels || !signal) return
    try {
      await sharePivotImage(config, signal, levels)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Quick share failed:', error)
    }
  }, [config, levels, signal])

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans antialiased pb-24">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
        <Link href="/pivot" className="p-1 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Brand */}
        <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
          <svg className="h-5 w-5 text-[#0292e3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h5.5l2.5-5h8l2.5 5H22L12 2zm0 6.5L14.7 14H9.3L12 8.5z" />
          </svg>
          <span className="text-[#0292e3] font-extrabold tracking-tight">AUVA</span>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#e6f4fe] px-3 py-1 text-xs font-semibold text-[#0292e3]">
          <span className="h-2 w-2 rounded-full bg-[#0292e3] animate-pulse" />
          <span>{config.liveBadge}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 sm:max-w-xl">
        {/* ── Section Title ── */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            style={{ color: config.accentColor }}>
            <TrendingUp className="h-4 w-4" />
            {config.analysisName} FORMULA
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Pivot Point Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {config.subtitle}
          </p>
        </div>

        {/* ── Calculate Data Card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" style={{ color: config.accentColor }} />
              {initialData.length > 0 ? 'Calculate Data' : 'Manual Input Data'}
            </h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Daily Timeframe
            </span>
          </div>

          {/* 2-col OHLC grid */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: 'OPEN', value: open, setter: setOpen, id: 'field-open' },
                { label: 'HIGH', value: high, setter: setHigh, id: 'field-high' },
                { label: 'LOW', value: low, setter: setLow, id: 'field-low' },
                { label: 'CLOSE', value: close, setter: setClose, id: 'field-close' },
              ] as Array<{ label: string; value: string; setter: (v: string) => void; id: string }>
            ).map(({ label, value, setter, id }) => (
              <div key={label} className="flex flex-col gap-1">
                <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-[#0292e3] focus:outline-none focus:ring-2 focus:ring-[#0292e3]/20 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Open Today — full width, purely manual */}
          <div className="mt-3 flex flex-col gap-1">
            <label htmlFor="field-open-today" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              REFERENCE OPEN
            </label>
            <input
              id="field-open-today"
              type="number"
              value={openToday}
              onChange={(e) => setOpenToday(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-[#0292e3] focus:outline-none focus:ring-2 focus:ring-[#0292e3]/20 transition-colors"
            />
          </div>

          {/* Calculate button */}
          <button
            id="btn-calculate"
            onClick={handleCalculate}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r ${config.gradient} py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99]`}
          >
            <Calculator className="h-4 w-4" />
            <span>Calculate</span>
          </button>
          <button
            type="button"
            onClick={() => initialData[0] && handleUseHistoricalData(initialData[0])}
            className="mt-4 ml-auto flex items-center gap-1.5 text-xs font-bold transition-colors hover:opacity-75"
            style={{ color: config.accentColor }}
          >
            <Clock3 className="h-3.5 w-3.5" />
            Calculation History
          </button>
        </div>

        {/* ── Market Signal ── */}
        {levels !== null && calcOpenToday !== null && signal !== null && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: config.accentColor }} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">MARKET SIGNAL</span>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ color: config.accentColor, borderColor: config.accentColor, backgroundColor: config.softColor }}
              >
                {signal.bias}
              </span>
            </div>

            <div className="mt-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DIRECTIONAL CALL</span>
                <div className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xl font-extrabold text-white shadow-sm ${signal.direction === 'BUY' ? 'bg-[#168343]' : signal.direction === 'SELL' ? 'bg-[#c6284d]' : 'bg-slate-600'}`}>
                  <span className="text-2xl">{signal.direction === 'BUY' ? '↑' : signal.direction === 'SELL' ? '↓' : '•'}</span>
                  <span>{signal.direction}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="text-[10px] font-medium text-slate-400">Target Resistance:</div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">{signal.targetResistanceText}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="text-[10px] font-medium text-slate-400">Nearest Invalidation:</div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">{signal.nearestInvalidationText}</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl border p-3 text-xs leading-relaxed text-slate-600" style={{ borderColor: `${config.accentColor}30`, backgroundColor: config.softColor }}>
              <span className="font-semibold text-slate-800">Condition: </span>
              {signal.conditionText}
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">How to read it: </span>
              Pivot Point = (High + Low + Close) / 3. BUY means the Pivot Point is above the reference open; SELL means it is below the reference open. This is a directional calculation, not a live trading signal.
            </div>
            <button
              type="button"
              onClick={handleQuickShare}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r ${config.gradient} py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.99]`}
            >
              <Share2 className="h-4 w-4" />
              Quick Share Image
            </button>
          </div>
        )}

        {/* ── Historical Data Applied ── */}
        {initialData.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Historical Data Applied</h2>
                <span className="text-xs text-slate-400">Timeframe: Daily</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <CalendarDays className="h-3.5 w-3.5" style={{ color: config.accentColor }} />
                {fmtDate(initialData[0].date)}
              </div>
            </div>

            <div className="mt-4 overflow-x-auto scrollbar-thin">
              <table className="min-w-190 w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-2.5 font-bold pl-1">DATE</th>
                    <th className="pb-2.5 text-right font-bold">OPEN</th>
                    <th className="pb-2.5 text-right font-bold">HIGH</th>
                    <th className="pb-2.5 text-right font-bold">LOW</th>
                    <th className="pb-2.5 text-right font-bold">CLOSE</th>
                    <th className="pb-2.5 text-right font-bold pr-1">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {initialData.map((row, idx) => (
                    <tr
                      key={row.date + idx}
                      className={idx === 0 ? 'text-slate-900' : 'text-slate-800'}
                      style={idx === 0 ? { backgroundColor: config.softColor } : undefined}
                    >
                      <td className="py-3 pr-3 pl-1">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-semibold">{fmtShortDate(row.date)}</span>
                          {idx === 0 && (
                            <span className="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: config.accentColor, borderColor: `${config.accentColor}45`, backgroundColor: `${config.softColor}` }}>
                              MARKET DATA USED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono font-medium whitespace-nowrap">
                        {fmtMoney(row.open)}
                      </td>
                      <td className="py-3 text-right font-mono font-medium whitespace-nowrap">
                        {fmtMoney(row.high)}
                      </td>
                      <td className="py-3 text-right font-mono font-medium whitespace-nowrap">
                        {fmtMoney(row.low)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold whitespace-nowrap text-[#241e52]">
                        {fmtMoney(row.close)}
                      </td>
                      <td className="py-3 text-right pr-1">
                        <button
                          type="button"
                          onClick={() => handleUseHistoricalData(row)}
                          className="whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
                          style={{ backgroundColor: config.accentColor }}
                        >
                          Use this
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Calculated Pivot Levels (shown after clicking Calculate) ── */}
        {levels !== null && calcOpenToday !== null && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-base font-bold text-slate-900">Calculated Pivot Levels</h2>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold text-white shadow-sm bg-linear-to-r ${config.gradient}`}>
                Standard Floor Pivots
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {/* ── R4 ── */}
              <LevelRow label="R4" value={levels.r4} />
              <MidpointRow value={midpoint(levels.r4, levels.r3)} />

              {/* ── R3 ── */}
              <LevelRow label="R3" value={levels.r3} />
              <MidpointRow value={midpoint(levels.r3, levels.r2)} />

              {/* ── R2 ── */}
              <LevelRow label="R2" value={levels.r2} />
              <MidpointRow value={midpoint(levels.r2, levels.r1)} />

              {/* ── R1 ── */}
              <div className="relative flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#1e293b]">R1</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-sm text-[#1e293b]">{fmtMoney(levels.r1)}</div>
                </div>
              </div>

              {/* ── Midpoint R1 → PP ── */}
              <MidpointRow value={midpoint(levels.r1, levels.p)} />

              {/* ── Central Baseline divider ── */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
                  CENTRAL BASELINE
                </span>
              </div>

              {/* ── PP ── */}
              <div className={`flex items-center justify-between rounded-2xl bg-linear-to-r ${config.gradient} px-4 py-3.5 text-white shadow-sm`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white/70">PP</span>
                  <span className="font-bold text-xs text-white">Pivot Point</span>
                </div>
                <span className="font-mono font-extrabold text-base sm:text-lg text-white">
                  {fmtMoney(levels.p)}
                </span>
              </div>

              {/* ── Midpoint PP → S1 ── */}
              <MidpointRow value={midpoint(levels.p, levels.s1)} />

              {/* ── S1 ── */}
              <div className="relative flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#1e293b]">S1</span>
                  <span className="text-[10px] font-medium text-[#94a3b8]">Nearest Support</span>
                </div>
                <div className="font-mono font-extrabold text-sm text-[#1e293b]">
                  {fmtMoney(levels.s1)}
                </div>
              </div>

              {/* ── Midpoint S1 → S2 ── */}
              <MidpointRow value={midpoint(levels.s1, levels.s2)} />

              {/* ── S2 ── */}
              <LevelRow label="S2" value={levels.s2} />
              <MidpointRow value={midpoint(levels.s2, levels.s3)} />

              {/* ── S3 ── */}
              <LevelRow label="S3" value={levels.s3} />
              <MidpointRow value={midpoint(levels.s3, levels.s4)} />

              {/* ── S4 ── */}
              <LevelRow label="S4" value={levels.s4} />
            </div>
          </div>
        )}

        {/* ── New Calculation button ── */}
        <button
          id="btn-new-calculation"
          onClick={handleReset}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r ${config.gradient} py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99]`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>New Calculation</span>
        </button>
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600"
        >
          <Home className="h-5 w-5" />
          <span className="text-[11px] font-bold tracking-wider">HOME</span>
        </Link>
        <Link
          href="/gold"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600"
        >
          <Banknote className="h-5 w-5" />
          <span className="text-[11px] font-bold tracking-wider">GOLD</span>
        </Link>
        <Link
          href="/pivot"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[#0292e3]"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-[11px] font-bold tracking-wider">PIVOT</span>
        </Link>
        <Link
          href="/news"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600"
        >
          <Newspaper className="h-5 w-5" />
          <span className="text-[11px] font-bold tracking-wider">NEWS</span>
        </Link>
      </nav>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LevelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
      <span className="font-bold text-[#7888a3]">{label}</span>
      <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(value)}</span>
    </div>
  )
}

function MidpointRow({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-0.5">
      <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <span className="h-px w-3 bg-slate-300" />
        Midpoint
      </span>
      <span className="font-mono text-[11px] font-semibold text-slate-400">{fmtMoney(value)}</span>
    </div>
  )
}
