import { NextRequest, NextResponse } from "next/server";
import { scrapeAllNews } from "@/lib/scrape-news";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const articles = await scrapeAllNews();

    if (articles.length === 0) {
      return NextResponse.json({ success: true, data: [], note: "Tidak ada artikel baru" });
    }

    const { error } = await supabaseAdmin
      .from("news_articles")
      .upsert(articles, { onConflict: "link" });

    if (error) throw error;

    return NextResponse.json({ success: true, count: articles.length, data: articles });
  } catch (err) {
    console.error("News Scraping Error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}