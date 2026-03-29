'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn, getCategoryColor, getCategoryLabel, getSellPrice, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Product, Supplier, ProductStatus } from '@/lib/types'

interface ProductCardProps {
  product: Product
  status: ProductStatus
  supplier?: Supplier | null
  onEdit: (product: Product) => void
  onArchive: (product: Product) => void
}

export function ProductCard({ product, status, supplier, onEdit, onArchive }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false)
  const catColor = getCategoryColor(product.category)
  const hasSizes = product.sizes && product.sizes.length > 0

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
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <ChevronDown
            className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="apple-detail-panel space-y-4">

          {/* Sizes or single price strip */}
          {hasSizes ? (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Sizes</p>
              <div className="space-y-1.5">
                {product.sizes.map((size, idx) => {
                  const sell = getSellPrice(size.cost_price, product.margin_pct)
                  const profit = sell - size.cost_price
                  return (
                    <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-[8px] px-3 py-2">
                      <span className="text-[13px] font-medium text-foreground">{size.name}</span>
                      <div className="flex items-center gap-3 text-[12px]">
                        <span className="text-muted-foreground">Cost {formatCurrency(size.cost_price)}</span>
                        <span className="font-semibold text-foreground">Sell {formatCurrency(sell)}</span>
                        <span className="text-green-600 font-medium">+{formatCurrency(profit)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Cost</p>
                <p className="text-[15px] font-semibold text-foreground">{formatCurrency(product.cost_price)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Sell</p>
                <p className="text-[15px] font-semibold text-foreground">{formatCurrency(getSellPrice(product.cost_price, product.margin_pct))}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Margin</p>
                <p className="text-[15px] font-semibold text-foreground">+{product.margin_pct}%</p>
              </div>
            </div>
          )}

          {/* MOQ */}
          {product.moq && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">MOQ</p>
              <p className="text-[13px] text-foreground">{product.moq}</p>
            </div>
          )}

          {/* Supplier */}
          {supplier && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Supplier</p>
              <p className="text-[13px] text-foreground">{supplier.name}</p>
            </div>
          )}

          {/* Variables */}
          {product.variables?.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Variables</p>
              <div className="space-y-1.5">
                {product.variables.map((v) => (
                  <div key={v.variableCode} className="bg-muted/40 rounded-[8px] px-3 py-2">
                    <p className="text-[12px] font-semibold text-foreground mb-1">{v.variableName}</p>
                    <div className="flex flex-wrap gap-1">
                      {v.options.map((opt) => (
                        <span key={opt.value} className="text-[11px] bg-background border border-border rounded-full px-2 py-0.5 text-foreground">
                          {opt.label}
                          {opt.priceModifier !== 1 && (
                            <span className="text-muted-foreground ml-1">×{opt.priceModifier}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
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
            <Button onClick={() => onArchive(product)} variant="destructive" className="flex-1 h-10">Delete</Button>
          </div>
        </div>
      )}
    </div>
  )
}
