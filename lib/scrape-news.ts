export interface NewsArticle {
  title: string;
  link: string;
  image_url: string | null;
  source: string;
  category: string;
  published_at: string;
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  gold: "gold OR XAUUSD",
  hangseng: '"Hang Seng Index"',
  nikkei: '"Nikkei 225"',
};

async function fetchNewsForCategory(category: string): Promise<NewsArticle[]> {
  const keyword = CATEGORY_KEYWORDS[category];
  if (!keyword) throw new Error(`Kategori tidak dikenal: ${category}`);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const url = new URL("https://api.marketaux.com/v1/news/all");
  url.searchParams.set("search", keyword);
  url.searchParams.set("published_after", sevenDaysAgo);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "10");
  url.searchParams.set("api_token", process.env.MARKETAUX_API_KEY!);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Marketaux error untuk ${category}: ${res.status}`);

  const json = await res.json();
  const articles = json.data ?? [];

  return articles
    .filter((item: any) => item.title && item.url)
    .map((item: any) => ({
      title: item.title,
      link: item.url,
      image_url: item.image_url ?? null,
      description: item.description ?? item.snippet ?? null,
      source: item.source ?? "unknown",
      category,
      published_at: item.published_at,
    }));
}

export async function scrapeAllNews(): Promise<NewsArticle[]> {
  const categories = Object.keys(CATEGORY_KEYWORDS);

  const results = await Promise.allSettled(
    categories.map((category) => fetchNewsForCategory(category))
  );

  const allArticles: NewsArticle[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    } else {
      console.error("Gagal fetch kategori:", result.reason);
    }
  }

  return allArticles;
}