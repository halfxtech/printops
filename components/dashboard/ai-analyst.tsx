'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { AnalyseApiResponse } from '@/lib/types'

interface AiAnalystProps {
  triggerKey?: number
}

const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutes

export function AiAnalyst({ triggerKey }: AiAnalystProps) {
  const [data, setData] = useState<AnalyseApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<number>(0)
  const [rateLimited, setRateLimited] = useState(false)

  const runAnalysis = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && now - lastRun < RATE_LIMIT_MS) {
      setRateLimited(true)
      return
    }
    setRateLimited(false)
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
      setLastRun(now)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [lastRun])

  // Auto-run on mount and when triggerKey changes
  useEffect(() => {
    runAnalysis()
  }, [triggerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const minutesUntilNext = Math.max(0, Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRun)) / 60000))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">AI Market Analyst</p>
        <button
          onClick={() => runAnalysis(true)}
          disabled={loading}
          className={cn(
            'text-[13px] font-medium px-3 py-1 rounded-full transition-all',
            loading
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-primary hover:bg-primary/10 active:scale-95'
          )}
        >
          {loading ? 'Analysing…' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-[13px] text-muted-foreground">Running market analysis…</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-4 text-center space-y-2">
            <p className="text-[14px] text-destructive font-medium">{error}</p>
            <button
              onClick={() => runAnalysis(true)}
              className="text-[13px] text-primary underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !data && (
          <div className="py-6 text-center">
            <p className="text-[14px] text-muted-foreground">No analysis yet — add your Anthropic API key and click Refresh.</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Health</p>
                <p className="text-[15px] font-semibold text-foreground">{data.health}</p>
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Top Category</p>
                <p className="text-[15px] font-semibold text-foreground">{data.topCat}</p>
              </div>
              <div className="flex-1">
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">Potential</p>
                <p className="text-[15px] font-semibold text-foreground">{data.potential}</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Priorities */}
            {data.priorities?.length > 0 && (
              <div>
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-2">Top Priorities</p>
                <ol className="space-y-1.5">
                  {data.priorities.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5"
                      >
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-foreground leading-snug">{p}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Gaps + Risks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Gaps</p>
                <p className="text-[13px] text-foreground leading-snug">{data.gaps}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5">Risks</p>
                <p className="text-[13px] text-foreground leading-snug">{data.risks}</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Next action */}
            <div className="flex items-start gap-3 bg-primary/8 rounded-[10px] p-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">Next Action</p>
                <p className="text-[13px] font-medium text-foreground">{data.action}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
