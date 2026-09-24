import Link from "next/link";
import { ArrowLeft, RefreshCw, Info, Home, Banknote, TrendingUp, Newspaper, AlertCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { calculatePivotLevels, determineSignal } from "@/lib/calculate-pivot";

export const revalidate = 0;

const fmtDate = (dStr: string) => {
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dStr;
  }
};

const fmtShortDate = (dStr: string) => {
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dStr;
  }
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export default async function AutomaticPivotPage() {
  let ohlcRows: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    symbol: string;
  }> = [];

  let queryErrorMsg = "";

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from("ohlc_data")
      .select("*")
      .eq("symbol", "XAUUSD")
      .order("date", { ascending: false })
      .limit(4);

    if (error) {
      console.error("Supabase query error:", error.message);
      queryErrorMsg = error.message;
    } else if (data && data.length > 0) {
      ohlcRows = data.map((r) => ({
        date: r.date,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        symbol: r.symbol,
      }));
    }
  } catch (err) {
    console.error("Supabase connection exception:", err);
    queryErrorMsg = (err as Error).message;
  }

  // Handle Empty Data or Error State
  if (ohlcRows.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-slate-900 pb-24 font-sans antialiased">
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
          <Link href="/" className="p-1 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
            <svg className="h-5 w-5 text-[#0292e3]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h5.5l2.5-5h8l2.5 5H22L12 2zm0 6.5L14.7 14H9.3L12 8.5z" />
            </svg>
            <span className="text-[#0292e3] font-extrabold tracking-tight">Auva</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">No historical market data available.</h1>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {queryErrorMsg
              ? `Database error: ${queryErrorMsg}`
              : "No records found for XAUUSD in the database. Please trigger the data scraping task or check Supabase records."}
          </p>
          <Link
            href="/pivot"
            className="mt-2 rounded-xl bg-[#241e52] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1a153e]"
          >
            Back to Pivot Options
          </Link>
        </main>
      </div>
    );
  }

  // Row 0 is the latest daily OHLC data
  const primaryOhlc = ohlcRows[0];
  const levels = calculatePivotLevels(primaryOhlc);

  // currentPrice is the close price of the latest OHLC row
  const currentPrice = primaryOhlc.close;
  const signal = determineSignal(currentPrice, levels);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 pb-24 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
        <Link href="/" className="p-1 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Brand Logo - A Auva */}
        <div className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
          <svg className="h-5 w-5 text-[#0292e3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h5.5l2.5-5h8l2.5 5H22L12 2zm0 6.5L14.7 14H9.3L12 8.5z" />
          </svg>
          <span className="text-[#0292e3] font-extrabold tracking-tight">Auva</span>
        </div>

        {/* Live Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#e6f4fe] px-3 py-1 text-xs font-semibold text-[#0292e3]">
          <span className="h-2 w-2 rounded-full bg-[#0292e3] animate-pulse" />
          <span>Live XAU/USD</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 sm:max-w-xl">
        {/* Title Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0292e3]">
            <span>📈 DIGITAL GOLD FORMULA</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Automatic Pivot Result
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Pivot Point levels and directional market signal calculated from historical data.
          </p>
        </div>

        {/* Card 1: MARKET SIGNAL */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0292e3]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                MARKET SIGNAL
              </span>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                signal.direction === "BUY"
                  ? "bg-[#e6f4fe] text-[#0292e3]"
                  : signal.direction === "SELL"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {signal.bias}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                DIRECTIONAL CALL
              </span>
              <div
                className={`mt-1 flex w-fit items-center gap-1.5 rounded-xl px-5 py-2.5 text-base font-extrabold text-white shadow-sm ${
                  signal.direction === "BUY"
                    ? "bg-linear-to-r from-[#241e52] to-[#0292e3]"
                    : signal.direction === "SELL"
                    ? "bg-linear-to-r from-rose-700 to-rose-500"
                    : "bg-slate-700"
                }`}
              >
                <span>{signal.direction === "BUY" ? "↑" : signal.direction === "SELL" ? "↓" : "•"}</span>
                <span>{signal.direction}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PRICE POSITION
              </span>
              <div className="mt-1 text-base font-extrabold text-[#241e52]">
                {signal.positionText}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="text-[10px] font-medium text-slate-400">Target Resistance / Support:</div>
              <div className="mt-0.5 text-xs font-bold text-slate-900">
                {signal.targetResistanceText}
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="text-[10px] font-medium text-slate-400">Nearest Invalidation:</div>
              <div className="mt-0.5 text-xs font-bold text-slate-900">
                {signal.nearestInvalidationText}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">Condition: </span>
            {signal.conditionText}
          </div>
        </div>

        {/* Card 2: Historical Data Applied (Scrollable Horizontal Table) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Historical Data Applied</h2>
              <span className="text-xs text-slate-400">Timeframe: Daily</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <span>📅 {fmtDate(primaryOhlc.date)}</span>
            </div>
          </div>

          {/* Horizontally Scrollable Table for All 5 Columns (Date, Open, High, Low, Close) */}
          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <table className="min-w-125 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-2.5 font-bold pl-1">DATE</th>
                  <th className="pb-2.5 text-right font-bold">OPEN</th>
                  <th className="pb-2.5 text-right font-bold">HIGH</th>
                  <th className="pb-2.5 text-right font-bold">LOW</th>
                  <th className="pb-2.5 text-right font-bold pr-1">CLOSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ohlcRows.map((row, idx) => (
                  <tr key={row.date + idx} className={idx === 0 ? "bg-[#eaf6ff]/40 text-slate-900" : "text-slate-800"}>
                    <td className="py-3 pr-3 pl-1">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="font-semibold">{fmtShortDate(row.date)}</span>
                        {idx === 0 && (
                          <span className="rounded bg-[#e6f4fe] border border-[#bce3fe] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0292e3]">
                            MARKET DATA USED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono font-medium whitespace-nowrap">{fmtMoney(row.open)}</td>
                    <td className="py-3 text-right font-mono font-medium whitespace-nowrap">{fmtMoney(row.high)}</td>
                    <td className="py-3 text-right font-mono font-medium whitespace-nowrap">{fmtMoney(row.low)}</td>
                    <td className="py-3 text-right font-mono font-bold whitespace-nowrap pr-1 text-[#241e52]">
                      {fmtMoney(row.close)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-right text-[10px] text-slate-400 italic">
            ← Scroll horizontally to inspect Low & Close →
          </div>
        </div>

        {/* Card 3: Calculated Pivot Levels (Styled EXACTLY matching Screenshot) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-base font-bold text-slate-900">Calculated Pivot Levels</h2>
            <span className="rounded-full bg-linear-to-r from-[#A80038] to-[#FD3A69] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
              Standard Floor Pivots
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* R4 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <span className="font-bold text-[#7888a3]">R4</span>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.r4)}</span>
            </div>

            {/* R3 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <span className="font-bold text-[#7888a3]">R3</span>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.r3)}</span>
            </div>

            {/* R2 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1e293b]">R2</span>
                {signal.nextTargetLevel === "R2" && (
                  <span className="rounded-md border border-[#bce3fe] bg-[#dff3ff] px-2 py-0.5 text-[10px] font-bold text-[#0292e3]">
                    Next Target
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.r2)}</span>
            </div>

            {/* R1 - Highlighted Active Box (Matching attached image) */}
            <div
              className={`relative flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
                signal.activeLevel === "R1"
                  ? "border-2 border-[#00a0e9] bg-[#eaf6ff] shadow-xs"
                  : "bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${signal.activeLevel === "R1" ? "text-[#00a0e9]" : "text-[#1e293b]"}`}>
                  R1
                </span>
                {signal.activeLevel === "R1" && (
                  <span className="rounded-md bg-linear-to-r from-[#241e52] to-[#0292e3] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                    CURRENT LEVEL
                  </span>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`font-mono font-extrabold text-sm sm:text-base ${
                    signal.activeLevel === "R1" ? "text-[#241e52]" : "text-[#1e293b]"
                  }`}
                >
                  {fmtMoney(levels.r1)}
                </div>
                {signal.activeLevel === "R1" && (
                  <div className="text-[10px] font-semibold text-[#0292e3]">
                    Last: {fmtMoney(primaryOhlc.close)}
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
            <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-[#8f5b00] via-[#c98905] to-[#f0c040] px-4 py-3.5 text-white shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#0292e3]">PP</span>
                <span className="font-bold text-xs text-white">Pivot Point</span>
              </div>
              <span className="font-mono font-extrabold text-base sm:text-lg text-white">
                {fmtMoney(levels.p)}
              </span>
            </div>

            {/* S1 */}
            <div
              className={`relative flex items-center justify-between rounded-2xl px-4 py-3 transition-all ${
                signal.activeLevel === "S1"
                  ? "border-2 border-rose-500 bg-rose-50/60 shadow-xs"
                  : "bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${signal.activeLevel === "S1" ? "text-rose-600" : "text-[#1e293b]"}`}>
                  S1
                </span>
                {signal.activeLevel === "S1" ? (
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
                    signal.activeLevel === "S1" ? "text-rose-600" : "text-[#1e293b]"
                  }`}
                >
                  {fmtMoney(levels.s1)}
                </div>
              </div>
            </div>

            {/* S2 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <span className="font-bold text-[#7888a3]">S2</span>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.s2)}</span>
            </div>

            {/* S3 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <span className="font-bold text-[#7888a3]">S3</span>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.s3)}</span>
            </div>

            {/* S4 */}
            <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] px-4 py-2.5 text-xs">
              <span className="font-bold text-[#7888a3]">S4</span>
              <span className="font-mono font-bold text-[#1e293b]">{fmtMoney(levels.s4)}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Card */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-[#e6f4fe]/50 p-4 text-xs text-slate-600">
          <Info className="h-4 w-4 shrink-0 text-[#0292e3] mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-slate-700">
              The market signal is generated based on the current price position relative to the Pivot Point, Resistance, and Support levels.
            </p>
            <p className="text-[11px] text-slate-400 leading-normal">
              Pivot signals are based on calculated market data and are not financial advice.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/pivot"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#241e52] to-[#0292e3] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.99]"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Recalculate / Change Timeframe</span>
        </Link>
      </main>

      {/* Persistent Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md">
        <Link href="/" className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600">
          <Home className="h-5 w-5 text-slate-400" />
          <span className="text-[11px] font-bold tracking-wider text-slate-400">HOME</span>
        </Link>
        <Link href="/gold" className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600">
          <Banknote className="h-5 w-5 text-slate-400" />
          <span className="text-[11px] font-bold tracking-wider text-slate-400">GOLD</span>
        </Link>
        <Link href="/pivot" className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[#0292e3]">
          <TrendingUp className="h-5 w-5 text-[#0292e3]" />
          <span className="text-[11px] font-bold tracking-wider text-[#0292e3]">PIVOT</span>
        </Link>
        <Link href="/news" className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-slate-400 hover:text-slate-600">
          <Newspaper className="h-5 w-5 text-slate-400" />
          <span className="text-[11px] font-bold tracking-wider text-slate-400">NEWS</span>
        </Link>
      </nav>
    </div>
  );
}
