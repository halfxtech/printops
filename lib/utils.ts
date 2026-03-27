import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Product, Supplier, Machine, ProductStatus, ProductCategory } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProductStatus(
  product: Product,
  suppliers: Supplier[],
  machines: Machine[]
): ProductStatus {
  const hasSup = suppliers.find(
    (s) => s.id === product.supplier_id && s.status === 'active'
  )
  const mac = machines.find((m) => m.id === product.machine_id)
  const macOk = !product.machine_id || (mac && mac.owned)

  if (product.is_diy && macOk) {
    return { code: 'diy', label: 'DIY ready', color: 'blue' }
  }
  if (hasSup && macOk) {
    return { code: 'ready', label: 'Ready', color: 'green' }
  }
  if (product.machine_id && mac && !mac.owned) {
    return { code: 'machine', label: 'Needs equipment', color: 'orange' }
  }
  return { code: 'noSup', label: 'No supplier', color: 'red' }
}

export function getMargin(cost: number, sell: number): number {
  if (!sell || sell === 0) return cost === 0 && sell > 0 ? 95 : 0
  return Math.round(((sell - cost) / sell) * 100)
}

export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`
}

export function getCategoryColor(category: ProductCategory): string {
  const map: Record<ProductCategory, string> = {
    packaging: '#FF9500',
    stationery: '#007AFF',
    marketing: '#34C759',
    event: '#AF52DE',
    digital: '#5AC8FA',
    signage: '#FF2D55',
  }
  return map[category] ?? '#8E8E93'
}

export function getCategoryLabel(category: ProductCategory): string {
  const map: Record<ProductCategory, string> = {
    packaging: 'Packaging',
    stationery: 'Stationery',
    marketing: 'Marketing',
    event: 'Event',
    digital: 'Digital',
    signage: 'Signage',
  }
  return map[category] ?? category
}

export function getStatusColorClass(color: string): string {
  const map: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[color] ?? map.red
}

export function getTagLabel(tag: string): string {
  const map: Record<string, string> = {
    day1: 'Day 1',
    highval: 'High Value',
    recurring: 'Recurring',
    seasonal: 'Seasonal',
  }
  return map[tag] ?? tag
}

export function getBlockedReason(
  product: Product,
  suppliers: Supplier[],
  machines: Machine[]
): string {
  const mac = machines.find((m) => m.id === product.machine_id)
  if (product.machine_id && mac && !mac.owned) {
    return `Needs ${mac.name} (RM ${mac.cost})`
  }
  if (!product.supplier_id) return 'No supplier linked'
  const sup = suppliers.find((s) => s.id === product.supplier_id)
  if (!sup) return 'Supplier not found'
  if (sup.status !== 'active') return `Supplier inactive: ${sup.name}`
  return 'Unknown reason'
}
