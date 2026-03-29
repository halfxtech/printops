import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { CalendarView } from '@/components/calendar/calendar-view'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createServerClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, quote_items(id)')
    .order('dateline', { ascending: true, nullsFirst: false })

  const allQuotes = quotes ?? []
  const deadlineCount = allQuotes.filter(q => q.dateline).length

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        title="Calendar"
        subtitle={`${deadlineCount} job deadline${deadlineCount !== 1 ? 's' : ''}`}
      />
      <CalendarView quotes={allQuotes as any} />
    </div>
  )
}
