'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InventoryForm } from '@/components/machines/inventory-form'
import type { InventoryItem } from '@/lib/types'

const CATEGORY_COLOR: Record<string, string> = {
  apparel: '#AF52DE',
  paper: '#007AFF',
  packaging: '#FF9500',
  other: '#8E8E93',
}

const CATEGORY_LABEL: Record<string, string> = {
  apparel: 'Apparel',
  paper: 'Paper',
  packaging: 'Packaging',
  other: 'Other',
}

interface InventoryListProps {
  initialInventory: InventoryItem[]
}

export function InventoryList({ initialInventory }: InventoryListProps) {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  useEffect(() => { setInventory(initialInventory) }, [initialInventory])

  const totalStockValue = inventory.reduce((sum, i) => sum + i.qty * i.cost_per_unit, 0)

  async function handleDelete(id: string) {
    await supabase.from('inventory').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28 space-y-6">
        {inventory.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No stock items yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap + to add materials or blank products</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                All items ({inventory.length})
              </p>
              <span className="text-xs font-semibold text-muted-foreground">
                Total value: {formatCurrency(totalStockValue)}
              </span>
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {inventory.map((item) => {
                const isExpanded = !!expanded[item.id]
                const totalValue = item.qty * item.cost_per_unit

                return (
                  <div key={item.id}>
                    <button
                      className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
                      onClick={() => setExpanded(e => ({ ...e, [item.id]: !e[item.id] }))}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLOR[item.category] ?? '#8E8E93' }}
                        />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {CATEGORY_LABEL[item.category]}{item.size ? ` · ${item.size}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                          {item.qty} {item.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(item.cost_per_unit)}/unit
                        </span>
                        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isExpanded && 'rotate-180')} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="apple-detail-panel space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Qty</p>
                            <p className="text-sm font-semibold text-foreground">{item.qty} {item.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Cost/unit</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(item.cost_per_unit)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Total value</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(totalValue)}</p>
                          </div>
                        </div>

                        {item.notes && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
                            <p className="text-sm text-foreground leading-relaxed">{item.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button onClick={() => { setEditItem(item); setFormOpen(true) }} className="flex-1 h-10">Edit</Button>
                          <Button onClick={() => handleDelete(item.id)} variant="destructive" className="flex-1 h-10">Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditItem(null); setFormOpen(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
        aria-label="Add stock item"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <InventoryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSaved={() => router.refresh()}
        item={editItem}
      />
    </>
  )
}
