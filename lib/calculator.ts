import type { Product } from './types'

export interface VariableSelection {
  [variableCode: string]: string | undefined
  quantity?: string
}

export interface BreakdownItem {
  item: string
  multiplier?: string
  modifier?: number
  unitCost?: number
  amount: number
}

export interface PriceResult {
  basePrice: number
  unitCost: number
  quantity: number
  subtotal: number
  discount: number
  discountPercentage: number
  finalCost: number
  sellPrice: number
  profit: number
  currency: string
  breakdown: BreakdownItem[]
}

const DECIMAL = 2

function round(value: number): number {
  return Math.round(value * Math.pow(10, DECIMAL)) / Math.pow(10, DECIMAL)
}

/**
 * Calculate the cost for a product given variable selections and quantity.
 * Formula: finalCost = basePrice × variableModifiers × quantity − quantityDiscount
 * Sell price = finalCost × (1 + marginPct / 100)
 */
export function calculatePrice(product: Product, selections: VariableSelection = {}): PriceResult {
  const basePrice = product.cost_price || 0
  let unitCost = basePrice
  const breakdown: BreakdownItem[] = [{ item: 'Base Price', amount: basePrice }]

  // Apply variable modifiers
  if (product.variables?.length && selections) {
    for (const variable of product.variables) {
      const selectedValue = selections[variable.variableCode]
      if (selectedValue) {
        const option = variable.options.find(o => o.value === selectedValue)
        if (option && option.priceModifier != null && option.priceModifier !== 1) {
          const prev = unitCost
          unitCost = round(unitCost * option.priceModifier)
          breakdown.push({
            item: `${variable.variableName} (${option.label})`,
            multiplier: `${option.priceModifier}x`,
            modifier: round(unitCost - prev),
            amount: unitCost,
          })
        }
      }
    }
  }

  // Quantity
  const quantity = parseInt(selections.quantity ?? '1') || 1
  const totalBeforeDiscount = round(unitCost * quantity)

  // Quantity discount
  let discountPercentage = 0
  if (product.pricing_tiers?.length) {
    for (const tier of product.pricing_tiers) {
      if (quantity >= tier.qtyMin && quantity <= tier.qtyMax) {
        discountPercentage = tier.discountPercentage
        break
      }
    }
  }
  const discountAmount = round((unitCost * quantity * discountPercentage) / 100)
  const finalCost = round(totalBeforeDiscount - discountAmount)

  breakdown.push({
    item: `Quantity (${quantity} pcs)`,
    multiplier: `${quantity}x`,
    unitCost,
    amount: totalBeforeDiscount,
  })

  if (discountAmount > 0) {
    breakdown.push({
      item: `Quantity Discount (${discountPercentage}%)`,
      modifier: -discountAmount,
      amount: finalCost,
    })
  }

  const sellPrice = round(finalCost * (1 + (product.margin_pct || 0) / 100))
  const profit = round(sellPrice - finalCost)

  return {
    basePrice,
    unitCost: round(unitCost),
    quantity,
    subtotal: totalBeforeDiscount,
    discount: discountAmount,
    discountPercentage,
    finalCost,
    sellPrice,
    profit,
    currency: 'MYR',
    breakdown,
  }
}

/**
 * Simple sell price from cost + margin (backward-compatible helper).
 * Use calculatePrice() for variable/tier-aware pricing.
 */
export function getSellPrice(cost: number, marginPct: number): number {
  return round(cost * (1 + marginPct / 100))
}
