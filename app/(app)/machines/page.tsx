import { createServerClient } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { MachineList } from '@/components/machines/machine-list'

export const dynamic = 'force-dynamic'

export default async function MachinesPage() {
  const supabase = createServerClient()

  const [{ data: machines }, { data: products }] = await Promise.all([
    supabase.from('machines').select('*').order('owned', { ascending: false }),
    supabase.from('products').select('*').order('name'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: any[] = machines ?? []
  const owned = m.filter((x: { owned: boolean }) => x.owned)
  const notOwned = m.filter((x: { owned: boolean }) => !x.owned)

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header
        title="Equipment"
        subtitle={`${owned.length} owned · ${notOwned.length} to acquire`}
      />
      <MachineList machines={m} products={products ?? []} />
    </div>
  )
}
