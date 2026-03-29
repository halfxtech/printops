# PrintOps — Database Schema & Types

> Generated: 2026-03-28

---

## Tables

### `suppliers`

| Column | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `type` | `string` |
| `contact` | `string \| null` |
| `email` | `string \| null` |
| `location` | `string \| null` |
| `website` | `string \| null` |
| `notes` | `string \| null` |
| `status` | `string` |
| `created_at` | `string` |

---

### `machines`

| Column | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `type` | `string` |
| `owned` | `boolean` |
| `cost` | `number` |
| `enables` | `string \| null` |
| `notes` | `string \| null` |
| `created_at` | `string` |

---

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `product_code` | `string \| null` | |
| `name` | `string` | |
| `category` | `enum` | STN, MKT, APR, PKG, BOK, EVT, SGN, CST |
| `is_diy` | `boolean` | |
| `supplier_id` | `string \| null` | FK → suppliers |
| `machine_id` | `string \| null` | FK → machines |
| `cost_price` | `number` | |
| `margin_pct` | `number` | |
| `sizes` | `ProductSize[]` | JSONB: `{ name, cost_price }` |
| `variables` | `ProductVariable[]` | JSONB: `{ variableCode, variableName, options[] }` |
| `pricing_tiers` | `PricingTier[]` | JSONB: `{ qtyMin, qtyMax, discountPercentage }` |
| `moq` | `string \| null` | |
| `notes` | `string \| null` | |
| `status` | `'active' \| 'inactive'` | |
| `created_at` | `string` | |
| `updated_at` | `string` | |

#### ProductSize (JSONB)

| Field | Type |
|---|---|
| `name` | `string` |
| `cost_price` | `number` |

#### ProductVariable (JSONB)

| Field | Type |
|---|---|
| `variableCode` | `string` |
| `variableName` | `string` |
| `options` | `ProductVariableOption[]` |

#### ProductVariableOption (JSONB)

| Field | Type | Notes |
|---|---|---|
| `value` | `string` | |
| `label` | `string` | |
| `priceModifier` | `number` | Multiplier, e.g. 1.5 = 50% more expensive |

#### PricingTier (JSONB)

| Field | Type |
|---|---|
| `qtyMin` | `number` |
| `qtyMax` | `number` |
| `discountPercentage` | `number` |

---

### `inventory`

| Column | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `name` | `string` | |
| `category` | `enum` | apparel, paper, packaging, other |
| `size` | `string \| null` | |
| `qty` | `number` | |
| `unit` | `enum` | pcs, reams, rolls, meters, kg |
| `cost_per_unit` | `number` | |
| `notes` | `string \| null` | |
| `created_at` | `string` | |
| `updated_at` | `string` | |

---

### `quotes`

| Column | Type |
|---|---|
| `id` | `string` |
| `quote_number` | `string \| null` |
| `customer_name` | `string` |
| `customer_company` | `string \| null` |
| `customer_contact` | `string \| null` |
| `customer_address` | `string \| null` |
| `description` | `string \| null` |
| `status` | `'draft' \| 'sent' \| 'accepted' \| 'declined'` |
| `notes` | `string \| null` |
| `total_sell` | `number` |
| `total_cost` | `number` |
| `dateline` | `string \| null` |
| `created_at` | `string` |
| `updated_at` | `string` |

---

### `quote_items`

| Column | Type |
|---|---|
| `id` | `string` |
| `quote_id` | `string` |
| `product_id` | `string \| null` |
| `product_code` | `string \| null` |
| `product_name` | `string` |
| `qty` | `number` |
| `unit_cost` | `number` |
| `unit_sell` | `number` |
| `supplier_name` | `string \| null` |
| `supplier_address` | `string \| null` |
| `supplier_email` | `string \| null` |
| `supplier_contact` | `string \| null` |
| `created_at` | `string` |

---

### `ai_analysis`

| Column | Type |
|---|---|
| `id` | `string` |
| `health` | `string \| null` |
| `top_category` | `string \| null` |
| `potential` | `string \| null` |
| `priorities` | `string[] \| null` |
| `gaps` | `string \| null` |
| `risks` | `string \| null` |
| `action` | `string \| null` |
| `created_at` | `string` |

---

## Enums

### Product Category
| Code | Label |
|---|---|
| `STN` | Stationery |
| `MKT` | Marketing |
| `APR` | Apparel |
| `PKG` | Packaging |
| `BOK` | Books & Folders |
| `EVT` | Events |
| `SGN` | Signage |
| `CST` | Custom |

### Product Status
| Value | Description |
|---|---|
| `active` | Live product |
| `inactive` | Draft / hidden |

### Inventory Category
`apparel` · `paper` · `packaging` · `other`

### Inventory Unit
`pcs` · `reams` · `rolls` · `meters` · `kg`

### Quote Status
`draft` · `sent` · `accepted` · `declined`
