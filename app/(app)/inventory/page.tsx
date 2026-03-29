import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { InventoryList } from '@/components/inventory/inventory-list'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createServerClient()

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .order('name')

  const items = inventory ?? []
  const totalValue = items.reduce((sum, i) => sum + i.qty * i.cost_per_unit, 0)

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        title="Inventory"
        subtitle={`${items.length} items · RM ${totalValue.toFixed(2)} total value`}
      />
      <InventoryList initialInventory={items} />
    </div>
  )
}
