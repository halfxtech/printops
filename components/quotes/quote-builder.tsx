'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn, getCategoryColor, getCategoryLabel, getSellPrice, formatCurrency, calculatePrice } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Quote, QuoteItem, Product, Supplier, ProductSize } from '@/lib/types'

interface LineItem {
  productId: string | null
  productCode: string | null
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
  const { data } = await supabase
    .from('quotes')
    .select('quote_number')
    .like('quote_number', `${prefix}%`)
    .order('quote_number', { ascending: false })
    .limit(1)
  const last = data?.[0]?.quote_number
  const lastNum = last ? parseInt(last.replace(prefix, ''), 10) : 0
  return `${prefix}${String(lastNum + 1).padStart(3, '0')}`
}

export function QuoteBuilder({ open, onClose, onSaved, quote, products, suppliers }: QuoteBuilderProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [dateline, setDateline] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<Quote['status']>('draft')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set())
  const [variableSelections, setVariableSelections] = useState<Record<string, Record<string, string>>>({})
  const [productSearch, setProductSearch] = useState('')
  const [freshProducts, setFreshProducts] = useState<Product[]>(products)

  useEffect(() => {
    if (open) {
      supabase.from('products').select('*').eq('status', 'active').order('name')
        .then(({ data }) => { if (data) setFreshProducts(data as Product[]) })
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setProductSearch('')
      setSaveError(null)
      if (quote) {
        setCustomerName(quote.customer_name)
        setCustomerCompany(quote.customer_company ?? '')
        setCustomerContact(quote.customer_contact ?? '')
        setCustomerAddress(quote.customer_address ?? '')
        setDateline(quote.dateline ?? '')
        setNotes(quote.notes ?? '')
        setStatus(quote.status)
        setLineItems(quote.quote_items.map(item => ({
          productId: item.product_id,
          productCode: item.product_code ?? null,
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
        setDateline('')
        setNotes('')
        setStatus('draft')
        setLineItems([])
      }
      setExpandedProductIds(new Set())
      setVariableSelections({})
    }
  }, [quote, open])

  const totalSell = lineItems.reduce((s, i) => s + i.qty * i.unit_sell, 0)
  const totalCost = lineItems.reduce((s, i) => s + i.qty * i.unit_cost, 0)
  const margin = totalSell > 0 ? Math.round(((totalSell - totalCost) / totalSell) * 100) : 0

  function toggleExpanded(id: string) {
    setExpandedProductIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addProduct(product: Product, size?: ProductSize) {
    const productName = size ? `${product.name} (${size.name})` : product.name
    // Prevent exact duplicate (same product + same variant name)
    if (lineItems.find(i => i.productId === product.id && i.productName === productName)) return
    const costPrice = size ? size.cost_price : product.cost_price
    const supplier = suppliers.find(s => s.id === product.supplier_id) ?? null
    setLineItems(prev => [...prev, {
      productId: product.id,
      productCode: product.product_code ?? null,
      productName,
      qty: 1,
      unit_cost: costPrice,
      unit_sell: getSellPrice(costPrice, product.margin_pct),
      supplierName: supplier?.name ?? null,
      supplierAddress: supplier?.location ?? null,
      supplierEmail: supplier?.email ?? null,
      supplierContact: supplier?.contact ?? null,
    }])
  }

  function setVariableOption(productId: string, variableCode: string, value: string) {
    setVariableSelections(prev => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [variableCode]: value },
    }))
  }

  function addProductWithVariables(product: Product) {
    const selections = variableSelections[product.id] ?? {}
    const result = calculatePrice(product, selections)
    const label = product.variables
      .map(v => {
        const opt = v.options.find(o => o.value === selections[v.variableCode])
        return opt?.label ?? ''
      })
      .filter(Boolean)
      .join(', ')
    const productName = label ? `${product.name} (${label})` : product.name
    if (lineItems.find(i => i.productId === product.id && i.productName === productName)) return
    const supplier = suppliers.find(s => s.id === product.supplier_id) ?? null
    setLineItems(prev => [...prev, {
      productId: product.id,
      productCode: product.product_code ?? null,
      productName,
      qty: 1,
      unit_cost: result.finalCost,
      unit_sell: result.sellPrice,
      supplierName: supplier?.name ?? null,
      supplierAddress: supplier?.location ?? null,
      supplierEmail: supplier?.email ?? null,
      supplierContact: supplier?.contact ?? null,
    }])
    // Reset selections and collapse after adding
    setVariableSelections(prev => ({ ...prev, [product.id]: {} }))
    setExpandedProductIds(prev => { const next = new Set(prev); next.delete(product.id); return next })
  }

  function removeItem(idx: number) {
    setLineItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateQty(idx: number, value: number) {
    setLineItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(1, value) } : item
    ))
  }

  function updateSellPrice(idx: number, value: number) {
    setLineItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, unit_sell: value } : item
    ))
  }

  async function handleSave() {
    if (!customerName.trim()) return
    setSaveError(null)
    setSaving(true)
    try {
      let quoteId = quote?.id ?? null

      if (quoteId) {
        // Fetch existing item IDs before touching anything
        const { data: existingItems } = await supabase
          .from('quote_items').select('id').eq('quote_id', quoteId)

        const { error: updateError } = await supabase.from('quotes').update({
          customer_name: customerName.trim(),
          customer_company: customerCompany.trim() || null,
          customer_contact: customerContact.trim() || null,
          customer_address: customerAddress.trim() || null,
          description: null,
          dateline: dateline || null,
          notes: notes.trim() || null,
          status,
          total_sell: totalSell,
          total_cost: totalCost,
          updated_at: new Date().toISOString(),
        }).eq('id', quoteId)
        if (updateError) throw updateError

        // Insert new items first — if this fails, old items survive
        if (lineItems.length > 0) {
          const { error: insertError } = await supabase.from('quote_items').insert(
            lineItems.map(item => ({
              quote_id: quoteId,
              product_id: item.productId,
              product_code: item.productCode,
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
          if (insertError) throw insertError
        }

        // Only delete old items after new ones are safely inserted
        if (existingItems && existingItems.length > 0) {
          await supabase.from('quote_items')
            .delete()
            .in('id', existingItems.map(r => r.id))
        }
      } else {
        const quoteNumber = await generateQuoteNumber()
        const { data, error: insertQuoteError } = await supabase.from('quotes').insert({
          quote_number: quoteNumber,
          customer_name: customerName.trim(),
          customer_company: customerCompany.trim() || null,
          customer_contact: customerContact.trim() || null,
          customer_address: customerAddress.trim() || null,
          description: null,
          dateline: dateline || null,
          notes: notes.trim() || null,
          status,
          total_sell: totalSell,
          total_cost: totalCost,
        }).select('id').single()
        if (insertQuoteError) throw insertQuoteError
        quoteId = data?.id ?? null

        if (quoteId && lineItems.length > 0) {
          const { error: itemsError } = await supabase.from('quote_items').insert(
            lineItems.map(item => ({
              quote_id: quoteId,
              product_id: item.productId,
              product_code: item.productCode,
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
          if (itemsError) throw itemsError
        }
      }

      onSaved()
      onClose()
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // For products with variants: show until all variants are added
  // For products without variants: hide once added
  const addedNames = new Set(lineItems.map(i => i.productName))
  const availableProducts = freshProducts.filter(p => {
    if (p.status !== 'active') return false
    if (productSearch) {
      const q = productSearch.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !(p.product_code ?? '').toLowerCase().includes(q)) return false
    }
    // Variable products — always show (can add many combinations)
    if (p.variables && p.variables.length > 0) return true
    // Size variants — hide only if every variant already in cart
    if (p.sizes && p.sizes.length > 0) {
      return p.sizes.some(s => !addedNames.has(`${p.name} (${s.name})`))
    }
    return !addedNames.has(p.name)
  })

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
        aria-describedby={undefined}
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
            <FormField label="Job deadline">
              <Input
                type="date"
                value={dateline}
                onChange={e => setDateline(e.target.value)}
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
                      {item.productCode && (
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.productCode}</p>
                      )}
                      {item.supplierName && (
                        <p className="text-xs text-muted-foreground mt-0.5">via {item.supplierName}</p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit_sell}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val) && val >= 0) updateSellPrice(idx, val)
                          }}
                          className="text-xs text-muted-foreground w-16 bg-transparent border-b border-border focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground">each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(idx, item.qty - 1)}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/70 active:scale-95 transition-all text-base leading-none"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10)
                          if (!isNaN(val) && val >= 1) updateQty(idx, val)
                        }}
                        className="text-sm font-semibold w-10 text-center bg-transparent border-b border-border focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => updateQty(idx, item.qty + 1)}
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
          {(availableProducts.length > 0 || productSearch) && (
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
                Add products
              </p>
              <Input
                placeholder="Search products…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="mb-3"
              />
              {availableProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No products match "{productSearch}"</p>
              ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
                {availableProducts.map(product => {
                  const hasVariables = product.variables && product.variables.length > 0
                  const hasSizes = !hasVariables && product.sizes && product.sizes.length > 0
                  const needsExpand = hasVariables || hasSizes
                  const isExpanded = expandedProductIds.has(product.id)
                  const selections = variableSelections[product.id] ?? {}
                  const allSelected = hasVariables && product.variables.every(v => selections[v.variableCode])
                  const previewResult = allSelected ? calculatePrice(product, selections) : null

                  return (
                    <div key={product.id}>
                      {/* Product row */}
                      <button
                        onClick={() => needsExpand ? toggleExpanded(product.id) : addProduct(product)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getCategoryColor(product.category) }}
                          />
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getCategoryLabel(product.category)}
                              {hasVariables && (
                                <span className="ml-1.5 text-primary/70">{product.variables.length} options</span>
                              )}
                              {hasSizes && (
                                <span className="ml-1.5 text-primary/70">{product.sizes.length} variants</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {!needsExpand && (
                            <span className="text-xs text-muted-foreground">{formatCurrency(getSellPrice(product.cost_price, product.margin_pct))}</span>
                          )}
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            {needsExpand ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {isExpanded
                                  ? <polyline points="18 15 12 9 6 15" />
                                  : <polyline points="6 9 12 15 18 9" />
                                }
                              </svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Variables picker */}
                      {hasVariables && isExpanded && (
                        <div className="border-t border-border bg-muted/30 px-5 py-3 space-y-3">
                          {product.variables.map(variable => (
                            <div key={variable.variableCode}>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{variable.variableName}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {variable.options.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setVariableOption(product.id, variable.variableCode, opt.value)}
                                    className={cn(
                                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                                      selections[variable.variableCode] === opt.value
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white border-border text-foreground hover:border-primary/50'
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <span className="text-sm font-semibold text-foreground">
                              {previewResult ? formatCurrency(previewResult.sellPrice) : '—'}
                            </span>
                            <button
                              onClick={() => allSelected && addProductWithVariables(product)}
                              disabled={!allSelected}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                                allSelected
                                  ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                              )}
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sizes picker (legacy) */}
                      {hasSizes && isExpanded && (
                        <div className="border-t border-border divide-y divide-border bg-muted/30">
                          {product.sizes
                            .filter(s => !addedNames.has(`${product.name} (${s.name})`))
                            .map(size => (
                              <button
                                key={size.name}
                                onClick={() => addProduct(product, size)}
                                className="w-full flex items-center justify-between pl-10 pr-5 py-2.5 hover:bg-black/[0.03] active:bg-black/[0.05] transition-colors text-left"
                              >
                                <span className="text-sm text-foreground font-medium">{size.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">{formatCurrency(getSellPrice(size.cost_price, product.margin_pct))}</span>
                                  <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              )}
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
          {saveError && (
            <p className="text-xs text-destructive mb-2 text-center">{saveError}</p>
          )}
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
