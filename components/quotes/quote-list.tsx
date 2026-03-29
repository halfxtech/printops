'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { QuoteBuilder } from './quote-builder'
import type { Quote, QuoteItem, Product, Supplier } from '@/lib/types'

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

interface QuoteListProps {
  initialQuotes: QuoteWithItems[]
  products: Product[]
  suppliers: Supplier[]
}

export function QuoteList({ initialQuotes, products, suppliers }: QuoteListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [quotes, setQuotes] = useState(initialQuotes)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editQuote, setEditQuote] = useState<QuoteWithItems | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('quotes-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        startTransition(() => router.refresh())
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  useEffect(() => { setQuotes(initialQuotes) }, [initialQuotes])

  async function handleDelete(id: string) {
    await supabase.from('quotes').delete().eq('id', id)
    router.refresh()
  }

  async function handleExportPdf(id: string, quoteNumber: string | null) {
    setExportingId(id)
    try {
      const res = await fetch(`/api/quotes/${id}/pdf`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quoteNumber ?? 'quote'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportingId(null)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-foreground">No quotes yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">Tap + to build your first quote</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {quotes.map((quote) => {
                const isExpanded = !!expanded[quote.id]
                const margin = quote.total_sell > 0
                  ? Math.round(((quote.total_sell - quote.total_cost) / quote.total_sell) * 100)
                  : 0

                const primaryName = quote.customer_company || quote.customer_name
                const secondaryName = quote.customer_company ? quote.customer_name : (quote.description ?? `${quote.quote_items.length} item${quote.quote_items.length !== 1 ? 's' : ''}`)

                return (
                  <div key={quote.id}>
                    <button
                      className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] transition-colors"
                      onClick={() => setExpanded(e => ({ ...e, [quote.id]: !e[quote.id] }))}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT[quote.status])} />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{primaryName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {quote.quote_number && (
                              <span className="font-mono mr-1.5">{quote.quote_number}</span>
                            )}
                            {secondaryName}
                            {quote.dateline && (
                              <span className="text-orange-500 font-medium ml-1">
                                · Due {new Date(quote.dateline + 'T12:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3 flex-wrap justify-end">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_BADGE[quote.status])}>
                          {quote.status}
                        </span>
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          margin >= 60 ? 'bg-green-100 text-green-700' :
                          margin >= 30 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {formatCurrency(quote.total_sell)}
                        </span>
                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isExpanded && 'rotate-180')} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="apple-detail-panel space-y-4">
                        {/* Bill to */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Bill to</p>
                          <div className="space-y-0.5">
                            {quote.customer_company && (
                              <p className="text-sm font-semibold text-foreground">{quote.customer_company}</p>
                            )}
                            <p className="text-[13px] text-foreground">{quote.customer_name}</p>
                            {quote.customer_contact && (
                              <p className="text-xs text-muted-foreground">{quote.customer_contact}</p>
                            )}
                            {quote.customer_address && (
                              <p className="text-xs text-muted-foreground">{quote.customer_address}</p>
                            )}
                          </div>
                        </div>

                        {/* Job deadline */}
                        {quote.dateline && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Job deadline</p>
                            <p className="text-sm font-semibold text-foreground">
                              {new Date(quote.dateline + 'T12:00:00').toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        )}

                        {/* Line items */}
                        {quote.quote_items.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                              Line items
                            </p>
                            <div className="space-y-1.5">
                              {quote.quote_items.map(item => (
                                <div key={item.id} className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                                    <div>
                                      <p className="text-sm text-foreground">{item.product_name}</p>
                                      {item.supplier_name && (
                                        <p className="text-xs text-muted-foreground">via {item.supplier_name}</p>
                                      )}
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
                            <p className={cn(
                              'text-sm font-semibold',
                              margin >= 60 ? 'text-green-700' : margin >= 30 ? 'text-orange-600' : 'text-red-600'
                            )}>
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

                        <div className="flex gap-2 pt-1">
                          <Button
                            onClick={() => { setEditQuote(quote); setBuilderOpen(true) }}
                            className="flex-1 h-10"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-10"
                            onClick={() => handleExportPdf(quote.id, quote.quote_number)}
                            disabled={exportingId === quote.id}
                          >
                            {exportingId === quote.id ? 'Generating…' : 'Export PDF'}
                          </Button>
                          {confirmDeleteId === quote.id ? (
                            <>
                              <Button
                                onClick={() => { handleDelete(quote.id); setConfirmDeleteId(null) }}
                                variant="destructive"
                                className="flex-1 h-10 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => setConfirmDeleteId(null)}
                                variant="outline"
                                className="flex-1 h-10 text-xs"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => setConfirmDeleteId(quote.id)}
                              variant="destructive"
                              className="flex-1 h-10"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditQuote(null); setBuilderOpen(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
        aria-label="New quote"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <QuoteBuilder
        open={builderOpen}
        onClose={() => { setBuilderOpen(false); setEditQuote(null) }}
        onSaved={() => router.refresh()}
        quote={editQuote}
        products={products}
        suppliers={suppliers}
      />
    </>
  )
}
