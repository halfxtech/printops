'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, getCategoryColor, getCategoryLabel, getMargin, formatCurrency, getStatusColorClass, getTagLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Product, Supplier, Machine, ProductStatus } from '@/lib/types'

interface ProductCardProps {
  product: Product
  status: ProductStatus
  supplier?: Supplier | null
  machine?: Machine | null
  onEdit: (product: Product) => void
  onArchive: (product: Product) => void
}

export function ProductCard({ product, status, supplier, machine, onEdit, onArchive }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)
  const margin = getMargin(product.cost_price, product.sell_price)
  const catColor = getCategoryColor(product.category)

  return (
    <div>
      {/* Main row */}
      <button
        className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: catColor }}
          />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-snug">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{getCategoryLabel(product.category)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3 flex-wrap justify-end">
          <Badge className={cn('border-0', getStatusColorClass(status.color))}>
            {status.label}
          </Badge>
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            margin >= 60 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            margin >= 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {margin}%
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="apple-detail-panel space-y-4">

          {/* Price strip */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Cost</p>
              <p className="text-[15px] font-semibold text-foreground">{formatCurrency(product.cost_price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Sell</p>
              <p className="text-[15px] font-semibold text-foreground">{formatCurrency(product.sell_price)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Margin</p>
              <p className="text-[15px] font-semibold text-foreground">{margin}%</p>
            </div>
          </div>

          {/* MOQ + turnaround */}
          {(product.moq || product.turnaround) && (
            <div className="grid grid-cols-2 gap-4">
              {product.moq && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">MOQ</p>
                  <p className="text-[13px] text-foreground">{product.moq}</p>
                </div>
              )}
              {product.turnaround && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Turnaround</p>
                  <p className="text-[13px] text-foreground">{product.turnaround}</p>
                </div>
              )}
            </div>
          )}

          {/* Supplier */}
          {supplier && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Supplier</p>
              <p className="text-[13px] text-foreground">{supplier.name}</p>
            </div>
          )}

          {/* Machine */}
          {machine && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Equipment</p>
              <p className="text-[13px] text-foreground">
                {machine.name}
                {!machine.owned && (
                  <span className="ml-2 text-[11px] font-medium text-orange-600 dark:text-orange-400">(not owned · RM {machine.cost})</span>
                )}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                    {getTagLabel(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {product.notes && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Notes</p>
              <p className="text-[13px] text-foreground leading-relaxed">{product.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button onClick={() => onEdit(product)} className="flex-1 h-10">Edit</Button>
            <Button onClick={() => onArchive(product)} variant="destructive" className="flex-1 h-10">Archive</Button>
          </div>
        </div>
      )}
    </div>
  )
}
