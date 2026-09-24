'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Edit3,
  ArrowRight,
  Keyboard,
  ChevronLeft,
  RefreshCw,
  Info,
} from 'lucide-react'
import {
  calculatePivotLevels,
  determineSignal,
  type PivotLevels,
  type MarketSignal,
} from '@/lib/calculate-pivot'
import { money, type PivotHistory } from '@/lib/goldcalc-data'

interface PivotCalculatorPageProps {
  addPivot?: (x: PivotHistory) => void
}

export function PivotCalculatorPage({ addPivot }: PivotCalculatorPageProps) {
  const [mode, setMode] = useState<'selection' | 'manual-input' | 'manual-result'>('selection')

 const [vals, setVals] = useState({
  open: 2735.4,
  high: 2758.6,
  low: 2722.1,
  close: 2748.9,
  currentPrice: 2750.0,
})

  const [error, setError] = useState('')
  const [computedLevels, setComputedLevels] = useState<PivotLevels | null>(null)
  const [computedSignal, setComputedSignal] = useState<MarketSignal | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)

  const update = (k: keyof typeof vals, v: string) => {
    setVals((x) => ({ ...x, [k]: parseFloat(v) || 0 }))
  }

  function handleCalculateManual() {
    const { open, high, low, close } = vals
   if (
    [open, high, low, close].some(
      (v) => !Number.isFinite(v) || v <= 0
    )
  ) {
    return setError(
      'Please enter positive numbers for Open, High, Low, and Close.'
    )
  }

  // High tidak boleh lebih rendah dari Low
  if (high < low) {
    return setError(
      'High cannot be lower than Low.'
    )
  }

  // Open dan Close kemarin harus berada
  // di antara High dan Low kemarin
  if (
    open > high ||
    open < low ||
    close > high ||
    close < low
  ) {
    return setError(
      'Open and Close values must be between Low and High.'
    )
  }

  setError('')

  // ===================================
  // HITUNG PIVOT
  // Data OHLC yang diinput = DATA KEMARIN
  // ===================================

  const levels = calculatePivotLevels({
    open,
    high,
    low,
    close,
  })

  

  const openToday = 4000.00

  

  setCurrentPrice(openToday)

 
  // ===================================

  const signal = determineSignal(
    openToday,
    levels
  )

  // SIMPAN HASIL PERHITUNGAN

  setComputedLevels(levels)
  setComputedSignal(signal)


  // TAMPILKAN HALAMAN HASIL
 

  setMode('manual-result')

  // SIMPAN RIWAYAT PIVOT

  if (addPivot) {
    addPivot({
      id: crypto.randomUUID(),

      type: 'Manual',

      ohlc: {
        open,
        high,
        low,
        close,
      },

      result: {
        p: levels.p,
        r1: levels.r1,
        r2: levels.r2,
        r3: levels.r3,
        r4: levels.r4,
        s1: levels.s1,
        s2: levels.s2,
        s3: levels.s3,
        s4: levels.s4,
      },

      date: new Date().toISOString(),
    })
  }
}

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 sm:max-w-xl sm:px-6 lg:max-w-4xl lg:px-8">
      {/* Title & Subtitle for Selection View */}
      {mode === 'selection' && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Digital Gold Pivot Point
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Calculate Classic Pivot Point using historical data or manual OHLC input.
          </p>
        </div>
      )}

      {/* Mode 1: Selection Cards */}
      {mode === 'selection' && (
        <div className="flex flex-col gap-5">
          {/* Automatic Pivot Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-slate-50/80" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-700">
                <Sparkles className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  AUTOMATIC PIVOT
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Calculate Pivot Point automatically using historical OHLC data.
                </p>
              </div>

              <Link
                href="/pivot/automatic"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#241e52] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a153e] active:scale-[0.99]"
              >
                <span>Automatic Pivot</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Manual Pivot Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-slate-50/80" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-slate-700">
                <Edit3 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  MANUAL PIVOT
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Enter Open, High, Low, and Close values manually.
                </p>
              </div>

              <button
                onClick={() => setMode('manual-input')}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#241e52] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a153e] active:scale-[0.99]"
              >
                <span>Manual Pivot</span>
                <Keyboard className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Manual Input Form */}
      {mode === 'manual-input' && (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => setMode('selection')}
            className="flex w-fit items-center gap-1.5 text-xs font-semibold text-[#0292e3] hover:underline"
          >
            <ChevronLeft className="h-4 w-4" /> Back to mode selection
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Manual OHLC Input</h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter valid Open, High, Low, and Close values for XAUUSD.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-600">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(['open', 'high', 'low', 'close'] as const).map((k) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {k}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={vals[k] || ''}
                    onChange={(e) => update(k, e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-mono font-medium text-slate-900 focus:border-[#0292e3] focus:bg-white focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleCalculateManual}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#241e52] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a153e]"
            >
              <span>Calculate Pivot Points</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Manual Pivot Result */}
      {mode === 'manual-result' && computedLevels && computedSignal && (
        <div className="flex flex-col gap-5">
          {/* Header Title Section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0292e3]">
              <span>📈 DIGITAL GOLD FORMULA</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Manual Pivot Result
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pivot Point levels and directional market signal calculated from manually entered data.
            </p>
          </div>

          {/* Card 1: Manual Input Data */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  ⚡ Manual Input Data
                </span>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Daily Timeframe
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  OPEN
                </span>
                <div className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                  {money(vals.open)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  HIGH
                </span>
                <div className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                  {money(vals.high)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LOW
                </span>
                <div className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                  {money(vals.low)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CLOSE
                </span>
                <div className="mt-1 text-base font-extrabold text-slate-900 font-mono">
                  {money(vals.close)}
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setMode('manual-input')}
                className="flex items-center gap-1 text-xs font-bold text-[#0292e3] hover:underline"
              >
                <span>✏ Edit Inputs</span>
              </button>
            </div>
          </div>

          {/* Card 2: MARKET SIGNAL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0292e3]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  MARKET SIGNAL
                </span>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                • {computedSignal.bias}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  DIRECTION
                </span>
                <div className="mt-0.5 text-2xl font-extrabold text-emerald-600 flex items-center gap-1">
                  <span>{computedSignal.direction}</span>
                  <span>{computedSignal.direction === 'BUY' ? '↗' : '↘'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400">Current Price</span>
                <div className="text-lg font-extrabold text-slate-900 font-mono">
                   {currentPrice !== null ? money(currentPrice)
                   : '-'}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="text-[10px] font-medium text-slate-400">Current Position</div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  {computedSignal.positionText}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="text-[10px] font-medium text-slate-400">Next Resistance</div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  {computedSignal.targetResistanceText}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600">
              <Info className="h-4 w-4 text-[#0292e3] shrink-0 mt-0.5" />
              <span>{computedSignal.conditionText}</span>
            </div>
          </div>

          {/* Card 3: Calculated Pivot Levels (Matching Attached Image) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-base font-bold text-slate-900">Calculated Pivot Levels</h2>
              <span className="text-xs text-slate-400">Standard Floor Pivots</span>
            </div>

            <div className="flex flex-col gap-2">
              {/* R4 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="font-bold text-[#7888a3]">R4</span>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.r4)}</span>
              </div>

              {/* R3 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="font-bold text-[#7888a3]">R3</span>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.r3)}</span>
              </div>

              {/* R2 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1e293b]">R2</span>
                  {computedSignal.nextTargetLevel === 'R2' && (
                    <span className="rounded-md border border-[#bce3fe] bg-[#dff3ff] px-2 py-0.5 text-[10px] font-bold text-[#0292e3]">
                      Next Target
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.r2)}</span>
              </div>

              {/* R1 - Highlighted Active Box (Matching attached image) */}
              <div
                className={`relative flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
                  computedSignal.activeLevel === 'R1'
                    ? 'border-2 border-[#00a0e9] bg-[#eaf6ff] shadow-xs'
                    : 'bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${computedSignal.activeLevel === 'R1' ? 'text-[#00a0e9]' : 'text-[#1e293b]'}`}>
                    R1
                  </span>
                  {computedSignal.activeLevel === 'R1' && (
                    <span className="rounded-md bg-linear-to-r from-[#241e52] to-[#0292e3] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                      CURRENT LEVEL
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-extrabold text-sm sm:text-base ${
                      computedSignal.activeLevel === 'R1' ? 'text-[#241e52]' : 'text-[#1e293b]'
                    }`}
                  >
                    {money(computedLevels.r1)}
                  </div>
                  {computedSignal.activeLevel === 'R1' && (
                    <div className="text-[10px] font-semibold text-[#0292e3]">
                      Last: {money(vals.close)}
                    </div>
                  )}
                </div>
              </div>

              {/* Central Baseline Divider */}
              <div className="relative my-2.5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
                  CENTRAL BASELINE
                </span>
              </div>

              {/* PP Pivot Point (Solid Navy Bar) */}
              <div className="flex items-center justify-between rounded-2xl bg-[#232066] px-4 py-3.5 text-white shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-[#0292e3]">PP</span>
                  <span className="font-bold text-xs text-white">Pivot Point</span>
                </div>
                <span className="font-mono font-extrabold text-base sm:text-lg text-white">
                  {money(computedLevels.p)}
                </span>
              </div>

              {/* S1 */}
              <div
                className={`relative flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
                  computedSignal.activeLevel === 'S1'
                    ? 'border-2 border-rose-500 bg-rose-50/60 shadow-xs'
                    : 'bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${computedSignal.activeLevel === 'S1' ? 'text-rose-600' : 'text-[#1e293b]'}`}>
                    S1
                  </span>
                  {computedSignal.activeLevel === 'S1' ? (
                    <span className="rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      Key Support
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#94a3b8]">Key Support</span>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-extrabold text-sm sm:text-base ${
                      computedSignal.activeLevel === 'S1' ? 'text-rose-600' : 'text-[#1e293b]'
                    }`}
                  >
                    {money(computedLevels.s1)}
                  </div>
                </div>
              </div>

              {/* S2 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="font-bold text-[#7888a3]">S2</span>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.s2)}</span>
              </div>

              {/* S3 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="font-bold text-[#7888a3]">S3</span>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.s3)}</span>
              </div>

              {/* S4 */}
              <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="font-bold text-[#7888a3]">S4</span>
                <span className="font-mono font-bold text-[#1e293b]">{money(computedLevels.s4)}</span>
              </div>
            </div>
          </div>

          {/* Disclaimer Box */}
          <div className="rounded-2xl border border-blue-100 bg-[#e6f4fe]/50 p-4 text-xs text-slate-600">
            <p className="font-medium text-slate-700">
              The market signal is generated based on the current price position relative to the Pivot Point, Resistance, and Support levels.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Pivot signals are based on calculated market data and are not financial advice.
            </p>
          </div>

          {/* New Calculation Button */}
          <button
            onClick={() => setMode('selection')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#241e52] to-[#0292e3] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            <span>New Calculation</span>
          </button>
        </div>
      )}
    </div>
  )
}
