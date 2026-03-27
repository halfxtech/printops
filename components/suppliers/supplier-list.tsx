'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SupplierForm } from './supplier-form'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Supplier, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SupplierListProps {
  initialSuppliers: Supplier[]
  initialProducts: Product[]
}

const TYPE_ORDER = ['print', 'signage', 'apparel', 'digital', 'other']

function groupByType(suppliers: Supplier[]): Record<string, Supplier[]> {
  const groups: Record<string, Supplier[]> = {}
  for (const s of suppliers) {
    const t = s.type ?? 'other'
    if (!groups[t]) groups[t] = []
    groups[t].push(s)
  }
  return groups
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className="text-[13px] text-foreground">{value}</p>
    </div>
  )
}

export function SupplierList({ initialSuppliers, initialProducts }: SupplierListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [products] = useState(initialProducts)
  const [formOpen, setFormOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const channel = supabase
      .channel('suppliers-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => {
        startTransition(() => router.refresh())
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  useEffect(() => { setSuppliers(initialSuppliers) }, [initialSuppliers])

  const groups = groupByType(suppliers)

  async function handleDelete() {
    if (!deleteTarget) return
    await supabase.from('suppliers').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  const linkedCount = (supplierId: string) =>
    products.filter(p => p.supplier_id === supplierId).length

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28 space-y-6">
        {suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-foreground">No suppliers yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">Tap + to add your first supplier</p>
          </div>
        )}

        {TYPE_ORDER.filter(t => groups[t]?.length > 0).map(type => (
          <div key={type}>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              {type.charAt(0).toUpperCase() + type.slice(1)} · {groups[type].length}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {groups[type].map((supplier) => {
                const isExpanded = expanded[supplier.id]
                const count = linkedCount(supplier.id)
                const linkedProducts = products.filter(p => p.supplier_id === supplier.id)

                return (
                  <div key={supplier.id}>
                    <button
                      className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] transition-colors"
                      onClick={() => setExpanded(e => ({ ...e, [supplier.id]: !e[supplier.id] }))}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0',
                          supplier.status === 'active' ? 'bg-[#34C759]' : 'bg-[#8E8E93]'
                        )} />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate leading-snug">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {supplier.location ?? 'No location'} · {count} product{count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3', isExpanded && 'rotate-180')}
                      />
                    </button>

                    {isExpanded && (
                      <div className="apple-detail-panel space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {supplier.contact && <DetailRow label="Contact" value={supplier.contact} />}
                          {supplier.email && <DetailRow label="Email" value={supplier.email} />}
                          {supplier.location && <DetailRow label="Address" value={supplier.location} />}
                          {supplier.moq && <DetailRow label="MOQ" value={supplier.moq} />}
                          {supplier.turnaround && <DetailRow label="Turnaround" value={supplier.turnaround} />}
                        </div>

                        {supplier.notes && (
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
                            <p className="text-[13px] text-foreground leading-relaxed">{supplier.notes}</p>
                          </div>
                        )}

                        {linkedProducts.length > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                              Linked products ({linkedProducts.length})
                            </p>
                            <div className="space-y-1.5">
                              {linkedProducts.map(p => (
                                <div key={p.id} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                  <p className="text-[13px] text-foreground">{p.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button onClick={() => { setEditSupplier(supplier); setFormOpen(true) }} className="flex-1 h-10">Edit</Button>
                          <Button onClick={() => setDeleteTarget(supplier)} variant="destructive" className="flex-1 h-10">Delete</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditSupplier(null); setFormOpen(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
        aria-label="Add supplier"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <SupplierForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditSupplier(null) }}
        onSaved={() => router.refresh()}
        supplier={editSupplier}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              {linkedCount(deleteTarget?.id ?? '') > 0
                ? `"${deleteTarget?.name}" has ${linkedCount(deleteTarget?.id ?? '')} linked product(s). Deleting it will unlink those products.`
                : `"${deleteTarget?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
