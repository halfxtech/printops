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
                    <div className="flex items-center">
                      <button
                        className="flex-1 text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] transition-colors min-w-0"
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
                      <div className="flex items-center gap-2 mr-3 shrink-0">
                        {supplier.contact && (
                          <a
                            href={`https://wa.me/${supplier.contact.replace(/[\s\-\(\)]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-95 transition-all"
                            aria-label="WhatsApp"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                          </a>
                        )}
                        {supplier.website && (
                          <a
                            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="h-8 px-3 flex items-center justify-center rounded-lg bg-primary hover:bg-primary/90 active:scale-95 transition-all text-[12px] font-medium text-primary-foreground whitespace-nowrap"
                          >
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="apple-detail-panel space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {supplier.contact && (
                            <div>
                              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Contact</p>
                              <a
                                href={`https://wa.me/${supplier.contact.replace(/[\s\-\(\)]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] text-primary underline underline-offset-2 block"
                              >
                                {supplier.contact}
                              </a>
                            </div>
                          )}
                          {supplier.email && <DetailRow label="Email" value={supplier.email} />}
                          {supplier.location && <DetailRow label="Address" value={supplier.location} />}
                          {supplier.website && (
                            <div>
                              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Website</p>
                              <a
                                href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] text-primary underline underline-offset-2 truncate block"
                              >
                                {supplier.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
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
