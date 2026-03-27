import { getMargin, getCategoryColor, formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface MarginChartProps {
  products: Product[]
}

export function MarginChart({ products }: MarginChartProps) {
  const top5 = products
    .filter(p => p.sell_price > 0)
    .map(p => ({ ...p, margin: getMargin(p.cost_price, p.sell_price) }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5)

  const maxMargin = Math.max(...top5.map(p => p.margin), 1)

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
                    <span className="text-[12px] text-muted-foreground">{formatCurrency(product.sell_price)}</span>
                    <span className="text-[12px] font-semibold text-foreground w-10 text-right">{product.margin}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(product.margin / maxMargin) * 100}%`,
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
