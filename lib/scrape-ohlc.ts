import * as cheerio from "cheerio";

export interface OhlcRow {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const SYMBOL_MAP: Record<string, string> = {
  XUL10: "XAUUSD",
  HKK50_BBJ: "HSI",
  JPK50_BBJ: "NIKKEI",
};

function parseNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

// Ambil tanggal PALING BENAR dari baris pertama tabel historical-data.
// Pakai selector spesifik (bukan regex ke seluruh HTML) biar gak salah tangkap.
async function getGroundTruthDate(): Promise<string> {
  const res = await fetch("https://www.newsmaker.id/id/tools/historical-data", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Gagal fetch historical-data, status: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const firstDataRow = $("table").first().find("tr").eq(1);
  const dateStr = firstDataRow.find("td, th").first().text().trim();

  if (!dateStr || dateStr.length < 6) {
    throw new Error(`Gagal menemukan tanggal valid di tabel. Got: "${dateStr}"`);
  }

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Format tanggal tidak bisa di-parse: "${dateStr}"`);
  }

  return d.toISOString().split("T")[0];
}

export async function scrapeAllInstruments(): Promise<OhlcRow[]> {
  const [date, quotesRes] = await Promise.all([
    getGroundTruthDate(),
    fetch("https://www.newsmaker.id/api/live-quotes", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      cache: "no-store",
    }),
  ]);

  if (!quotesRes.ok) throw new Error(`Gagal fetch live-quotes, status: ${quotesRes.status}`);

  const json = await quotesRes.json();
  if (json.status !== "success") throw new Error("Response status bukan success");

  const results: OhlcRow[] = [];

  for (const item of json.data) {
    const mappedSymbol = SYMBOL_MAP[item.symbol];
    if (!mappedSymbol) continue;

    const open = typeof item.open === "number" ? item.open : parseNumber(item.open);
    const high = typeof item.high === "number" ? item.high : parseNumber(item.high);
    const low = typeof item.low === "number" ? item.low : parseNumber(item.low);
    const close = typeof item.last === "number" ? item.last : parseNumber(item.last);

    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
      console.warn(`Skip ${mappedSymbol}: nilai OHLC tidak valid`, { open, high, low, close });
      continue;
    }
    if (high < low) {
      console.warn(`Skip ${mappedSymbol}: High (${high}) < Low (${low})`);
      continue;
    }

    results.push({ symbol: mappedSymbol, date, open, high, low, close });
  }

  return results;
}