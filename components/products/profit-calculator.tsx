import { getSellPrice, formatCurrency } from '@/lib/utils'
import type { Product } from '@/lib/types'

interface ProfitCalculatorProps {
  products: Product[]
}

export function ProfitCalculator({ products }: ProfitCalculatorProps) {
  const active = products.filter(p => p.status === 'active')
  if (active.length === 0) return null

  let totalCost = 0
  let totalSell = 0

  for (const p of active) {
    if (p.sizes && p.sizes.length > 0) {
      for (const s of p.sizes) {
        totalCost += s.cost_price
        totalSell += getSellPrice(s.cost_price, p.margin_pct)
      }
    } else {
      totalCost += p.cost_price
      totalSell += getSellPrice(p.cost_price, p.margin_pct)
    }
  }

  const profit = totalSell - totalCost
  const avgMargin = active.length > 0
    ? Math.round(active.reduce((s, p) => s + p.margin_pct, 0) / active.length)
    : 0

  return (
    <div className="mx-6 mt-5 mb-1 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Profit Calculator</p>
        <span className="text-[11px] font-medium text-muted-foreground">{active.length} products · avg +{avgMargin}%</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Total Cost</p>
          <p className="text-[14px] font-semibold text-foreground">{formatCurrency(totalCost)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Total Sell</p>
          <p className="text-[14px] font-semibold text-foreground">{formatCurrency(totalSell)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Nett Profit</p>
          <p className="text-[14px] font-semibold text-green-600 dark:text-green-400">{formatCurrency(profit)}</p>
        </div>
      </div>
    </div>
  )
}
