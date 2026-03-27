'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn, getCategoryColor, getCategoryLabel, formatCurrency } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Quote, QuoteItem, Product, Supplier } from '@/lib/types'

interface LineItem {
  productId: string | null
  productName: string
  qty: number
  unit_cost: number
  unit_sell: number
  supplierName: string | null
  supplierAddress: string | null
  supplierEmail: string | null
  supplierContact: string | null
}

interface QuoteBuilderProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  quote: (Quote & { quote_items: QuoteItem[] }) | null
  products: Product[]
  suppliers: Supplier[]
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

async function generateQuoteNumber(): Promise<string> {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)
  const prefix = `QX-${mm}${yy}-`
  const { count } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .like('quote_number', `${prefix}%`)
  return `${prefix}${String((count ?? 0) + 1).padStart(3, '0')}`
}

export function QuoteBuilder({ open, onClose, onSaved, quote, products, suppliers }: QuoteBuilderProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Quote['status']>('draft')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (quote) {
        setCustomerName(quote.customer_name)
        setCustomerCompany(quote.customer_company ?? '')
        setCustomerContact(quote.customer_contact ?? '')
        setCustomerAddress(quote.customer_address ?? '')
        setDescription(quote.description ?? '')
        setNotes(quote.notes ?? '')
        setStatus(quote.status)
        setLineItems(quote.quote_items.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          qty: item.qty,
          unit_cost: item.unit_cost,
          unit_sell: item.unit_sell,
          supplierName: item.supplier_name ?? null,
          supplierAddress: item.supplier_address ?? null,
          supplierEmail: item.supplier_email ?? null,
          supplierContact: item.supplier_contact ?? null,
        })))
      } else {
        setCustomerName('')
        setCustomerCompany('')
        setCustomerContact('')
        setCustomerAddress('')
        setDescription('')
        setNotes('')
        setStatus('draft')
        setLineItems([])
      }
    }
  }, [quote, open])

  const totalSell = lineItems.reduce((s, i) => s + i.qty * i.unit_sell, 0)
  const totalCost = lineItems.reduce((s, i) => s + i.qty * i.unit_cost, 0)
  const margin = totalSell > 0 ? Math.round(((totalSell - totalCost) / totalSell) * 100) : 0

  function addProduct(product: Product) {
    if (lineItems.find(i => i.productId === product.id)) return
    const supplier = suppliers.find(s => s.id === product.supplier_id) ?? null
    setLineItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      qty: 1,
      unit_cost: product.cost_price,
      unit_sell: product.sell_price,
      supplierName: supplier?.name ?? null,
      supplierAddress: supplier?.location ?? null,
      supplierEmail: supplier?.email ?? null,
      supplierContact: supplier?.contact ?? null,
    }])
  }

  function removeItem(idx: number) {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateQty(idx: number, delta: number) {
    setLineItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  async function handleSave() {
    if (!customerName.trim()) return
    setSaving(true)
    try {
      let quoteId = quote?.id ?? null

      if (quoteId) {
        await supabase.from('quotes').update({
          customer_name: customerName.trim(),
          customer_company: customerCompany.trim() || null,
          customer_contact: customerContact.trim() || null,
          customer_address: customerAddress.trim() || null,
          description: description.trim() || null,
          notes: notes.trim() || null,
          status,
          total_sell: totalSell,
          total_cost: totalCost,
          updated_at: new Date().toISOString(),
        }).eq('id', quoteId)
        await supabase.from('quote_items').delete().eq('quote_id', quoteId)
      } else {
        const quoteNumber = await generateQuoteNumber()
        const { data } = await supabase.from('quotes').insert({
          quote_number: quoteNumber,
          customer_name: customerName.trim(),
          customer_company: customerCompany.trim() || null,
          customer_contact: customerContact.trim() || null,
          customer_address: customerAddress.trim() || null,
          description: description.trim() || null,
          notes: notes.trim() || null,
          status,
          total_sell: totalSell,
          total_cost: totalCost,
        }).select('id').single()
        quoteId = data?.id ?? null
      }

      if (quoteId && lineItems.length > 0) {
        await supabase.from('quote_items').insert(
          lineItems.map(item => ({
            quote_id: quoteId,
            product_id: item.productId,
            product_name: item.productName,
            qty: item.qty,
            unit_cost: item.unit_cost,
            unit_sell: item.unit_sell,
            supplier_name: item.supplierName,
            supplier_address: item.supplierAddress,
            supplier_email: item.supplierEmail,
            supplier_contact: item.supplierContact,
          }))
        )
      }

      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const addedIds = new Set(lineItems.map(i => i.productId))
  const availableProducts = products.filter(p => p.status === 'active' && !addedIds.has(p.id))

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">
            {quote ? 'Edit quote' : 'New quote'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Customer info */}
          <div className="space-y-3">
            <FormField label="Company / Business name">
              <Input
                placeholder="e.g. Kak Nurul's Boutique"
                value={customerCompany}
                onChange={e => setCustomerCompany(e.target.value)}
              />
            </FormField>
            <FormField label="Contact person *">
              <Input
                placeholder="e.g. Kak Nurul"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </FormField>
            <FormField label="Phone / WhatsApp">
              <Input
                placeholder="+60 12-345 6789"
                value={customerContact}
                onChange={e => setCustomerContact(e.target.value)}
              />
            </FormField>
            <FormField label="Address">
              <Input
                placeholder="e.g. Jalan Raya 1, Shah Alam"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
              />
            </FormField>
            <FormField label="Project / description">
              <Input
                placeholder="e.g. Raya packaging set"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </FormField>
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Line items
              </p>
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.productName}</p>
                      {item.supplierName && (
                        <p className="text-xs text-muted-foreground mt-0.5">via {item.supplierName}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item.unit_sell)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/70 active:scale-95 transition-all text-base leading-none"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/70 active:scale-95 transition-all text-base leading-none"
                      >
                        +
                      </button>
                      <span className="text-sm font-semibold text-foreground w-16 text-right">
                        {formatCurrency(item.qty * item.unit_sell)}
                      </span>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 active:scale-95 transition-all ml-1"
                        aria-label="Remove"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals strip */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: 'Total sell', value: formatCurrency(totalSell) },
                  { label: 'Est. cost', value: formatCurrency(totalCost) },
                  { label: 'Margin', value: `${margin}%`, colored: true },
                ].map(({ label, value, colored }) => (
                  <div key={label} className="bg-white rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">{label}</p>
                    <p className={cn(
                      'text-sm font-semibold',
                      colored
                        ? margin >= 60 ? 'text-green-700' : margin >= 30 ? 'text-orange-600' : 'text-red-600'
                        : 'text-foreground'
                    )}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product picker */}
          {availableProducts.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Add products
              </p>
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
                {availableProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(product.category) }}
                      />
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getCategoryLabel(product.category)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground">{formatCurrency(product.sell_price)}</span>
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes + status */}
          <div className="space-y-3">
            <FormField label="Notes">
              <Textarea
                rows={3}
                placeholder="Anything to note for this quote…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="resize-none"
              />
            </FormField>
            <FormField label="Status">
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'sent', 'accepted', 'declined'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize',
                      status === s
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            disabled={!customerName.trim() || saving}
            className="w-full h-11"
          >
            {saving ? 'Saving…' : quote ? 'Save changes' : 'Save quote'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
