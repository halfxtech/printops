'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InventoryForm } from './inventory-form'
import type { Machine, Product, InventoryItem } from '@/lib/types'

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

interface MachineListProps {
  machines: Machine[]
  products: Product[]
  initialInventory: InventoryItem[]
}

function MachineCard({ machine, products, onToggle }: {
  machine: Machine
  products: Product[]
  onToggle: (machine: Machine) => void
}) {
  const linked = products.filter(p => p.machine_id === machine.id)
  const typeColors: Record<string, string> = {
    software: '#007AFF',
    skill: '#34C759',
    logistics: '#AF52DE',
    equipment: '#FF9500',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${typeColors[machine.type] ?? '#8E8E93'}20` }}
        >
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: typeColors[machine.type] ?? '#8E8E93' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground">{machine.name}</p>
          <p className="text-[12px] text-muted-foreground capitalize">{machine.type}</p>
        </div>
        {machine.type === 'equipment' && (
          <button
            onClick={() => onToggle(machine)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 ${
              machine.owned
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}
          >
            {machine.owned ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Owned
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                RM {machine.cost}
              </>
            )}
          </button>
        )}
        {machine.type !== 'equipment' && (
          <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {machine.owned ? 'Active' : 'N/A'}
          </span>
        )}
      </div>

      {machine.enables && (
        <p className="text-[13px] text-muted-foreground leading-snug">
          <span className="font-medium text-foreground">Enables: </span>{machine.enables}
        </p>
      )}

      {machine.notes && (
        <p className="text-[13px] text-muted-foreground italic leading-snug">{machine.notes}</p>
      )}

      {linked.length > 0 && (
        <div className="pt-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Products unlocked</p>
          <div className="flex flex-wrap gap-1.5">
            {linked.map(p => (
              <span key={p.id} className="px-2 py-0.5 bg-muted rounded-full text-[12px] text-foreground">{p.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MachineList({ machines, products, initialInventory }: MachineListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [toggling, setToggling] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  useEffect(() => { setInventory(initialInventory) }, [initialInventory])

  const owned = machines.filter(m => m.owned)
  const notOwned = machines.filter(m => !m.owned)
  const totalCostToUnlock = notOwned.reduce((sum, m) => sum + (m.cost ?? 0), 0)
  const totalStockValue = inventory.reduce((sum, i) => sum + i.qty * i.cost_per_unit, 0)

  async function handleToggle(machine: Machine) {
    setToggling(machine.id)
    await supabase.from('machines').update({ owned: !machine.owned }).eq('id', machine.id)
    setToggling(null)
    startTransition(() => router.refresh())
  }

  async function handleDeleteInventory(id: string) {
    await supabase.from('inventory').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28 space-y-6">
        {/* Owned equipment */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
            You own ({owned.length})
          </p>
          <div className="space-y-3">
            {owned.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">Nothing owned yet</p>
              </div>
            ) : (
              owned.map(m => (
                <MachineCard key={m.id} machine={m} products={products} onToggle={handleToggle} />
              ))
            )}
          </div>
        </div>

        {/* Not yet owned */}
        {notOwned.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Not yet owned ({notOwned.length})
              </p>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                RM {totalCostToUnlock.toFixed(0)} to unlock all
              </span>
            </div>
            <div className="space-y-3">
              {notOwned.map(m => (
                <MachineCard key={m.id} machine={m} products={products} onToggle={handleToggle} />
              ))}
            </div>
          </div>
        )}

        {/* Inventory / Stock */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Stock ({inventory.length})
            </p>
            {inventory.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                Value: {formatCurrency(totalStockValue)}
              </span>
            )}
          </div>

          {inventory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">No stock items yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tap + to add blank products or materials</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {inventory.map((item) => {
                const isExpanded = !!expanded[item.id]
                const totalValue = item.qty * item.cost_per_unit

                return (
                  <div key={item.id}>
                    <button
                      className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] transition-colors"
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
                          <Button onClick={() => handleDeleteInventory(item.id)} variant="destructive" className="flex-1 h-10">Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
