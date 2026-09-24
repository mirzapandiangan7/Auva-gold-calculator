export const dynamic = 'force-dynamic'

import { AppHeader } from '@/components/goldcalc/app-header'
import { BottomNavigation } from '@/components/goldcalc/bottom-navigation'
import { NewsFeed, type NewsArticle } from '@/components/news/NewsFeed'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export default async function NewsRoutePage() {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Failed to load news: ${error.message}`)
  }

  const initialArticles: NewsArticle[] = (data ?? []).map((item) => ({
    id: String(item.id),
    title: item.title ?? 'Untitled article',
    link: item.link ?? '#',
    image_url: item.image_url ?? null,
    description: item.description ?? null,
    source: item.source ?? 'Unknown',
    category: item.category ?? 'gold',
    published_at: item.published_at ?? new Date().toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-slate-900 antialiased">
      <AppHeader />

      <main className="mx-auto max-w-md px-4 pb-24 pt-5 sm:max-w-xl sm:px-6 lg:max-w-5xl lg:px-8">
        <header className="mb-6">
          <h1 className="text-[2.7rem] font-black leading-[0.98] tracking-[-0.06em] text-slate-900 sm:text-[4rem]">
            Fundamental News
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            Stay informed with important news related to global financial markets.
          </p>
        </header>

        <NewsFeed initialArticles={initialArticles} />
      </main>

      <BottomNavigation page="news" />
    </div>
  )
}