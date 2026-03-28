import { createServerClient } from '@/lib/supabase'
import { getProductStatus } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { StatsStrip } from '@/components/dashboard/stats-strip'
import { DashboardClient } from './dashboard-client'
import type { ProductStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const [{ data: products }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*').eq('status', 'active').order('created_at'),
    supabase.from('suppliers').select('*').order('name'),
  ])

  const p = products ?? []
  const s = suppliers ?? []

  const statuses: Record<string, ProductStatus> = {}
  p.forEach((product) => {
    statuses[product.id] = getProductStatus(product, s)
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
      <div className="flex-1 min-h-0 flex flex-col p-6 gap-6">
        <StatsStrip stats={stats} />
        <div className="flex-1" />
        <DashboardClient />
      </div>
    </div>
  )
}
