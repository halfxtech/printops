import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export function Header({ title, subtitle, children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'h-16 flex items-center justify-between px-6 bg-card border-b border-border shrink-0',
        className
      )}
    >
      <div>
        <h1 className="text-[20px] font-bold text-foreground leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </header>
  )
}
