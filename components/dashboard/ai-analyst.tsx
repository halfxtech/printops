'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { AnalyseApiResponse } from '@/lib/types'

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AiAnalyst() {
  const [data, setData] = useState<AnalyseApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)

  // Load last saved analysis from DB on mount
  useEffect(() => {
    supabase
      .from('ai_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: row }) => {
        if (row) {
          setData({
            health: row.health,
            topCat: row.top_category,
            potential: row.potential,
            priorities: row.priorities ?? [],
            gaps: row.gaps,
            risks: row.risks,
            action: row.action,
          })
          setLastRunAt(row.created_at)
        }
      })
  }, [])

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyse', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const json: AnalyseApiResponse = await res.json()
      setData(json)
      setLastRunAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">AI Market Analyst</p>
          {lastRunAt && (
            <p className="text-[11px] text-muted-foreground mt-0.5">Last run: {formatTimestamp(lastRunAt)}</p>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className={cn(
            'text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all',
            loading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          )}
        >
          {loading ? 'Analysing…' : 'Run Analysis'}
        </button>
      </div>

      <div className="apple-card p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2.5 py-4">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-[13px] text-muted-foreground">Running market analysis…</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-3 text-center space-y-1.5">
            <p className="text-[13px] text-destructive font-medium">{error}</p>
            <button onClick={runAnalysis} className="text-[12px] text-primary underline">Try again</button>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="py-4 text-center">
            <p className="text-[13px] text-muted-foreground">No analysis yet — tap Run Analysis to generate insights.</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            {/* Health / Top Cat / Potential chips */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-foreground">
                <span className="text-muted-foreground">Health · </span>{data.health}
              </span>
              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-foreground">
                <span className="text-muted-foreground">Top · </span>{data.topCat}
              </span>
              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-muted text-foreground">
                <span className="text-muted-foreground">Potential · </span>{data.potential}
              </span>
            </div>

            {/* Priorities */}
            {data.priorities?.length > 0 && (
              <ol className="space-y-1">
                {data.priorities.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-foreground leading-snug">{p}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="h-px bg-border" />

            {/* Next action */}
            <div className="flex items-start gap-2 bg-primary/8 rounded-lg p-2.5">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <p className="text-[12px] font-medium text-foreground leading-snug">{data.action}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
