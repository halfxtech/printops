'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatCurrency } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { Quote, QuoteItem } from '@/lib/types'

type QuoteWithItems = Quote & { quote_items: QuoteItem[] }

const STATUS_DOT: Record<Quote['status'], string> = {
  draft: 'bg-gray-400',
  sent: 'bg-blue-500',
  accepted: 'bg-green-500',
  declined: 'bg-red-500',
}

const STATUS_BADGE: Record<Quote['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

function deadlineColor(dateline: string, today: string): string {
  const diff = Math.ceil((new Date(dateline + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000)
  if (diff <= 2) return 'text-red-600'
  if (diff <= 7) return 'text-orange-500'
  return 'text-muted-foreground'
}

function OrderCard({ quote }: { quote: QuoteWithItems }) {
  const [expanded, setExpanded] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const margin = quote.total_sell > 0
    ? Math.round(((quote.total_sell - quote.total_cost) / quote.total_sell) * 100)
    : 0
  const primaryName = quote.customer_company || quote.customer_name
  const secondaryName = quote.customer_company ? quote.customer_name : (quote.description ?? `${quote.quote_items.length} item${quote.quote_items.length !== 1 ? 's' : ''}`)

  return (
    <div>
      <button
        className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT[quote.status])} />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{primaryName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {quote.quote_number && <span className="font-mono mr-1.5">{quote.quote_number}</span>}
              {secondaryName}
              {quote.dateline && (
                <span className={cn('font-medium ml-1', deadlineColor(quote.dateline, today))}>
                  · Due {new Date(quote.dateline + 'T12:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_BADGE[quote.status])}>
            {quote.status}
          </span>
          <span className="text-xs font-semibold text-foreground">{formatCurrency(quote.total_sell)}</span>
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="apple-detail-panel space-y-4">
          {/* Bill to */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Bill to</p>
            <div className="space-y-0.5">
              {quote.customer_company && <p className="text-sm font-semibold text-foreground">{quote.customer_company}</p>}
              <p className="text-[13px] text-foreground">{quote.customer_name}</p>
              {quote.customer_contact && <p className="text-xs text-muted-foreground">{quote.customer_contact}</p>}
              {quote.customer_address && <p className="text-xs text-muted-foreground">{quote.customer_address}</p>}
            </div>
          </div>

          {/* Deadline */}
          {quote.dateline && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Job deadline</p>
              <p className={cn('text-sm font-semibold', deadlineColor(quote.dateline, new Date().toISOString().slice(0, 10)))}>
                {new Date(quote.dateline + 'T12:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Line items */}
          {quote.quote_items.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Line items</p>
              <div className="space-y-1.5">
                {quote.quote_items.map(item => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                      <div>
                        <p className="text-sm text-foreground">{item.product_name}</p>
                        {item.supplier_name && <p className="text-xs text-muted-foreground">via {item.supplier_name}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {item.qty}× {formatCurrency(item.unit_sell)} = {formatCurrency(item.qty * item.unit_sell)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Total sell</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(quote.total_sell)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Est. cost</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(quote.total_cost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Margin</p>
              <p className={cn('text-sm font-semibold', margin >= 60 ? 'text-green-700' : margin >= 30 ? 'text-orange-600' : 'text-red-600')}>
                {margin}%
              </p>
            </div>
          </div>

          {quote.notes && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
              <p className="text-sm text-foreground leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderGroup({ orders, emptyMessage }: { orders: QuoteWithItems[]; emptyMessage: string }) {
  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
      {orders.map(q => <OrderCard key={q.id} quote={q} />)}
    </div>
  )
}

export function OrdersList({ initialQuotes }: { initialQuotes: QuoteWithItems[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [quotes, setQuotes] = useState(initialQuotes)

  useEffect(() => {
    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        startTransition(() => router.refresh())
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  useEffect(() => { setQuotes(initialQuotes) }, [initialQuotes])

  const today = new Date().toISOString().slice(0, 10)

  const upcoming = quotes.filter(q =>
    (q.status === 'sent' || q.status === 'accepted') &&
    q.dateline !== null && q.dateline > today
  )
  const current = quotes.filter(q =>
    (q.status === 'sent' || q.status === 'accepted') &&
    (q.dateline === null || q.dateline === today)
  )
  const past = quotes.filter(q =>
    q.status === 'declined' ||
    (q.dateline !== null && q.dateline < today)
  )

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-10">
      <Tabs defaultValue="current">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="current">Current ({current.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <OrderGroup orders={upcoming} emptyMessage="No upcoming jobs" />
        </TabsContent>
        <TabsContent value="current">
          <OrderGroup orders={current} emptyMessage="No active jobs right now" />
        </TabsContent>
        <TabsContent value="past">
          <OrderGroup orders={past} emptyMessage="No past jobs yet" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
