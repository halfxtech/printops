'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getProductStatus, getCategoryColor } from '@/lib/utils'
import { ProductCard } from './product-card'
import { ProductForm } from './product-form'
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
import type { Product, Supplier, ProductCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'STN', label: 'Stationery' },
  { key: 'MKT', label: 'Marketing' },
  { key: 'APR', label: 'Apparel' },
  { key: 'PKG', label: 'Packaging' },
  { key: 'BOK', label: 'Books & Folders' },
  { key: 'EVT', label: 'Events' },
  { key: 'SGN', label: 'Signage' },
  { key: 'CST', label: 'Custom' },
] as const

type FilterKey = typeof FILTERS[number]['key']

interface ProductListProps {
  initialProducts: Product[]
  suppliers: Supplier[]
}

export function ProductList({ initialProducts, suppliers }: ProductListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null)

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('products-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        startTransition(() => router.refresh())
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  // Sync when server data refreshes
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const statuses = Object.fromEntries(
    products.map(p => [p.id, getProductStatus(p, suppliers)])
  )

  const filtered = products.filter(p => {
    if (p.status !== 'active') return false
    if (filter === 'all') return true
    return p.category === filter
  })

  async function handleArchive() {
    if (!archiveTarget) return
    await supabase.from('products').delete().eq('id', archiveTarget.id)
    setArchiveTarget(null)
    router.refresh()
  }

  return (
    <>
      {/* Segmented control filter */}
      <div className="px-6 pt-4 pb-3 border-b border-border bg-card">
        <div className="flex gap-1 bg-muted p-1 rounded-[12px] overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium whitespace-nowrap transition-all duration-150 shrink-0',
                filter === f.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.key !== 'all' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(f.key as ProductCategory) }}
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-foreground">No products</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              {filter === 'all' ? 'Tap + to add your first product' : `No "${FILTERS.find(f => f.key === filter)?.label}" products`}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden divide-y divide-border">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  status={statuses[product.id]}
                  supplier={suppliers.find(s => s.id === product.supplier_id)}
                  onEdit={(p) => { setEditProduct(p); setFormOpen(true) }}
                  onArchive={(p) => setArchiveTarget(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditProduct(null); setFormOpen(true) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-30"
        aria-label="Add product"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Product form sheet */}
      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null) }}
        onSaved={() => router.refresh()}
        product={editProduct}
        suppliers={suppliers}
      />

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => { if (!o) setArchiveTarget(null) }}>
        <AlertDialogContent className="rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{archiveTarget?.name}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleArchive}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
