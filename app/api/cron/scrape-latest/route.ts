import { NextRequest, NextResponse } from "next/server";
import { scrapeAllInstruments } from "@/lib/scrape-ohlc";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const rows = await scrapeAllInstruments();

    const { error: upsertError } = await supabaseAdmin
      .from("ohlc_data")
      .upsert(rows, { onConflict: "symbol,date" });

    if (upsertError) throw upsertError;

    // Retention cleanup tetap sama, per simbol
    const retentionDays = 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    await supabaseAdmin.from("ohlc_data").delete().lt("date", cutoffDate);

    return NextResponse.json({ success: true, data: rows, retentionCutoff: cutoffDate });
  } catch (err) {
    console.error("Cron Scraping Error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}