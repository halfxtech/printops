import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { SupplierList } from '@/components/suppliers/supplier-list'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const supabase = await createServerClient()

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Suppliers" subtitle={`${(suppliers ?? []).filter((s: { status: string }) => s.status === 'active').length} active`} />
      <SupplierList
        initialSuppliers={suppliers ?? []}
        initialProducts={products ?? []}
      />
    </div>
  )
}
