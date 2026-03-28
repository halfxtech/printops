import { getCategoryColor, getCategoryLabel, getSellPrice, getStatusColorClass, formatCurrency } from '@/lib/utils'
import type { Product, Supplier, ProductStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ReadyListProps {
  products: Product[]
  suppliers: Supplier[]
  statuses: Record<string, ProductStatus>
  title: string
  emptyMessage?: string
  variant?: 'ready' | 'blocked'
}

export function ReadyList({ products, suppliers, statuses, title, emptyMessage, variant = 'ready' }: ReadyListProps) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">{title}</p>
      <div className="apple-card overflow-hidden divide-y divide-border">
        {products.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage ?? 'None'}</p>
          </div>
        ) : (
          products.map((product) => {
            const sell = getSellPrice(product.cost_price, product.margin_pct)

            let blockedReason = ''
            if (variant === 'blocked') {
              if (!product.supplier_id && !product.is_diy) blockedReason = 'No supplier linked'
              else if (product.supplier_id) {
                const sup = suppliers.find(s => s.id === product.supplier_id)
                if (!sup || sup.status !== 'active') blockedReason = 'Supplier inactive'
              }
            }

            return (
              <div key={product.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(product.category) }}
                  />
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {variant === 'blocked' ? blockedReason : getCategoryLabel(product.category)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(sell)}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      product.margin_pct >= 60 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      product.margin_pct >= 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    +{product.margin_pct}%
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
