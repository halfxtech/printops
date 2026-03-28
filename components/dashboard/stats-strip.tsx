import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: number | string
  color?: string
  sublabel?: string
}

interface StatsStripProps {
  stats: StatItem[]
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="apple-card p-5 flex flex-col justify-between h-28"
        >
          <p className="text-[13px] text-muted-foreground font-medium">{stat.label}</p>
          <p
            className="text-[32px] font-bold leading-none tracking-tight"
            style={{ color: stat.color ?? 'var(--foreground)' }}
          >
            {stat.value}
          </p>
          <p className="text-[11px] text-muted-foreground">{stat.sublabel ?? ' '}</p>
        </div>
      ))}
    </div>
  )
}
