import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ProductList } from '@/components/products/product-list'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createServerClient()

  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('suppliers').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Products" subtitle={`${(products ?? []).filter(p => p.status === 'active').length} active`} />
      <ProductList
        initialProducts={products ?? []}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}
