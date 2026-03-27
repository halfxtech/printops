import { createServerClient } from '@/lib/supabase'
import { getProductStatus, getMargin } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { StatsStrip } from '@/components/dashboard/stats-strip'
import { ReadyList } from '@/components/dashboard/ready-list'
import { MarginChart } from '@/components/dashboard/margin-chart'
import { DashboardClient } from './dashboard-client'
import type { Product, Supplier, Machine, ProductStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const [{ data: products }, { data: suppliers }, { data: machines }] = await Promise.all([
    supabase.from('products').select('*').eq('status', 'active').order('created_at'),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('machines').select('*').order('name'),
  ])

  const p = products ?? []
  const s = suppliers ?? []
  const m = machines ?? []

  const statuses: Record<string, ProductStatus> = {}
  p.forEach((product) => {
    statuses[product.id] = getProductStatus(product, s, m)
  })

  const canQuote = p.filter(pr => ['ready', 'diy'].includes(statuses[pr.id]?.code))
  const diy = p.filter(pr => statuses[pr.id]?.code === 'diy')
  const blocked = p.filter(pr => !['ready', 'diy'].includes(statuses[pr.id]?.code))

  const stats = [
    { label: 'Can quote today', value: canQuote.length, color: '#34C759', sublabel: 'ready or DIY' },
    { label: 'DIY products', value: diy.length, color: '#007AFF', sublabel: 'zero supplier cost' },
    { label: 'Blocked', value: blocked.length, color: '#FF3B30', sublabel: 'needs action' },
    { label: 'Total products', value: p.length, sublabel: 'in catalogue' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <Header title="Dashboard" subtitle="PrintOps — Rawang, Selangor" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <StatsStrip stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ReadyList
              products={canQuote}
              suppliers={s}
              machines={m}
              statuses={statuses}
              title="Ready to quote"
              emptyMessage="No products ready yet — add a supplier."
              variant="ready"
            />
            <ReadyList
              products={blocked}
              suppliers={s}
              machines={m}
              statuses={statuses}
              title="Blocked"
              emptyMessage="Nothing blocked — all good."
              variant="blocked"
            />
          </div>
          <div className="space-y-6">
            <MarginChart products={p} />
          </div>
        </div>

        <DashboardClient />
      </div>
    </div>
  )
}
