'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Quote } from '@/lib/types'

interface CalendarEvent {
  date: string // YYYY-MM-DD
  type: 'dateline'
  label: string
  sub?: string
  color: string
}

interface CalendarViewProps {
  quotes: (Quote & { quote_items: { id: string }[] })[]
}

const DOT_COLORS: Record<string, string> = {
  dateline: '#FF3B30',
  quote: '#007AFF',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function CalendarView({ quotes }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateStr(today))

  // Build events map
  const eventsMap = new Map<string, CalendarEvent[]>()

  function addEvent(dateStr: string, event: CalendarEvent) {
    if (!eventsMap.has(dateStr)) eventsMap.set(dateStr, [])
    eventsMap.get(dateStr)!.push(event)
  }

  quotes.forEach(q => {
    if (q.dateline) {
      addEvent(q.dateline, {
        date: q.dateline,
        type: 'dateline',
        label: q.customer_company || q.customer_name,
        sub: `${q.quote_number ?? 'Draft'} · ${q.status}`,
        color: DOT_COLORS.dateline,
      })
    }
  })

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toLocalDateStr(today)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedEvents = eventsMap.get(selectedDate) ?? []

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-10">
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Calendar grid */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h2 className="text-[15px] font-semibold text-foreground">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const events = eventsMap.get(dateStr) ?? []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dotTypes = [...new Set(events.map(e => e.type))]

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'flex flex-col items-center py-1.5 rounded-[10px] transition-colors min-h-[52px] gap-1',
                    isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/10' : 'hover:bg-muted'
                  )}
                >
                  <span className={cn(
                    'text-[14px] font-medium leading-none',
                    isSelected ? 'text-white' : isToday ? 'text-primary font-bold' : 'text-foreground'
                  )}>
                    {day}
                  </span>
                  {dotTypes.length > 0 && (
                    <div className="flex gap-0.5">
                      {dotTypes.map(type => (
                        <span
                          key={type}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'white' : DOT_COLORS[type] }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DOT_COLORS.dateline }} />
              <span className="text-[12px] text-muted-foreground">Job deadline</span>
            </div>
          </div>
        </div>

        {/* Day panel */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 w-full lg:w-72 shrink-0">
          <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-[10px] bg-muted/50">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: ev.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{ev.label}</p>
                    {ev.sub && (
                      <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{ev.sub}</p>
                    )}
                    <p className="text-[11px] font-medium mt-1" style={{ color: ev.color }}>
                      {ev.type === 'dateline' ? 'Deadline' : 'Quote'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
