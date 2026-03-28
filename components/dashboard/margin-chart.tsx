import { getCategoryColor, getSellPrice, formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface MarginChartProps {
  products: Product[]
}

export function MarginChart({ products }: MarginChartProps) {
  const top5 = products
    .filter(p => p.cost_price > 0 || (p.sizes && p.sizes.length > 0))
    .map(p => ({ ...p, sell: getSellPrice(p.cost_price, p.margin_pct) }))
    .sort((a, b) => b.margin_pct - a.margin_pct)
    .slice(0, 5)

  const maxMargin = Math.max(...top5.map(p => p.margin_pct), 1)

  return (
    <div>
      <p className="apple-grouped-label mb-2">Top 5 by margin</p>
      <div className="apple-card p-4">
        {top5.length === 0 ? (
          <p className="text-[14px] text-muted-foreground text-center py-4">No products yet</p>
        ) : (
          <div className="space-y-3">
            {top5.map((product) => (
              <div key={product.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground truncate flex-1 mr-2">{product.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] text-muted-foreground">{formatCurrency(product.sell)}</span>
                    <span className="text-[12px] font-semibold text-foreground w-12 text-right">+{product.margin_pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(product.margin_pct / maxMargin) * 100}%`,
                      backgroundColor: getCategoryColor(product.category),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
