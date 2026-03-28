export interface Supplier {
  id: string
  name: string
  type: string
  contact: string | null
  email: string | null
  location: string | null
  website: string | null
  notes: string | null
  status: string
  created_at: string
}

export interface Machine {
  id: string
  name: string
  type: string
  owned: boolean
  cost: number
  enables: string | null
  notes: string | null
  created_at: string
}

export interface ProductSize {
  name: string
  cost_price: number
}

export interface ProductVariableOption {
  value: string
  label: string
  priceModifier: number  // multiplier, e.g. 1.5 = 50% more expensive
}

export interface ProductVariable {
  variableCode: string
  variableName: string
  options: ProductVariableOption[]
}

export interface PricingTier {
  qtyMin: number
  qtyMax: number
  discountPercentage: number
}

export interface Product {
  id: string
  product_code: string | null
  name: string
  category: 'STN' | 'MKT' | 'APR' | 'PKG' | 'BOK' | 'EVT' | 'SGN' | 'CST'
  is_diy: boolean
  supplier_id: string | null
  machine_id: string | null
  cost_price: number
  margin_pct: number
  sizes: ProductSize[]
  variables: ProductVariable[]
  pricing_tiers: PricingTier[]
  moq: string | null
  tags: string[]
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface AiAnalysis {
  id: string
  health: string | null
  top_category: string | null
  potential: string | null
  priorities: string[] | null
  gaps: string | null
  risks: string | null
  action: string | null
  created_at: string
}

export type ProductCategory = 'STN' | 'MKT' | 'APR' | 'PKG' | 'BOK' | 'EVT' | 'SGN' | 'CST'

export type ProductStatus = {
  code: 'diy' | 'ready' | 'machine' | 'noSup'
  label: string
  color: 'blue' | 'green' | 'orange' | 'red'
}

export type ProductTag = 'day1' | 'highval' | 'recurring' | 'seasonal'

export interface ProductWithStatus extends Product {
  status_info: ProductStatus
  supplier?: Supplier | null
  machine?: Machine | null
}

export type InventoryCategory = 'apparel' | 'paper' | 'packaging' | 'other'
export type InventoryUnit = 'pcs' | 'reams' | 'rolls' | 'meters' | 'kg'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  size: string | null
  qty: number
  unit: InventoryUnit
  cost_per_unit: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  quote_number: string | null
  customer_name: string
  customer_company: string | null
  customer_contact: string | null
  customer_address: string | null
  description: string | null
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  notes: string | null
  total_sell: number
  total_cost: number
  created_at: string
  updated_at: string
  dateline: string | null
}

export interface QuoteItem {
  id: string
  quote_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  qty: number
  unit_cost: number
  unit_sell: number
  supplier_name: string | null
  supplier_address: string | null
  supplier_email: string | null
  supplier_contact: string | null
  created_at: string
}

export interface AnalyseApiResponse {
  health: string
  topCat: string
  potential: string
  priorities: string[]
  gaps: string
  risks: string
  action: string
}
