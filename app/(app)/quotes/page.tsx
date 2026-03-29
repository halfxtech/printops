import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { QuoteList } from '@/components/quotes/quote-list'

export const dynamic = 'force-dynamic'

export default async function QuotesPage() {
  const supabase = await createServerClient()

  const [{ data: quotes }, { data: products }, { data: suppliers }] = await Promise.all([
    supabase
      .from('quotes')
      .select('*, quote_items(*)')
      .order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('status', 'active').order('name'),
    supabase.from('suppliers').select('*').order('name'),
  ])

  const safeQuotes = (quotes ?? []).map(q => ({
    ...q,
    quote_items: q.quote_items ?? [],
  }))

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        title="Quotes"
        subtitle={`${safeQuotes.filter(q => q.status === 'draft').length} draft`}
      />
      <QuoteList initialQuotes={safeQuotes} products={products ?? []} suppliers={suppliers ?? []} />
    </div>
  )
}
