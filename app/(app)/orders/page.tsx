import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { OrdersList } from '@/components/orders/orders-list'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = createServerClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .in('status', ['sent', 'accepted', 'declined'])
    .order('dateline', { ascending: true, nullsFirst: false })

  const safeQuotes = (quotes ?? []).map(q => ({
    ...q,
    quote_items: q.quote_items ?? [],
  }))

  const activeCount = safeQuotes.filter(q =>
    q.status === 'sent' || q.status === 'accepted'
  ).length

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        title="Orders"
        subtitle={`${activeCount} active job${activeCount !== 1 ? 's' : ''}`}
      />
      <OrdersList initialQuotes={safeQuotes as any} />
    </div>
  )
}
