import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { getMargin } from '@/lib/utils'

// Rate limit: max 1 call per 5 minutes stored in module-level memory
let lastCallAt = 0
const RATE_LIMIT_MS = 5 * 60 * 1000

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST() {
  const now = Date.now()
  if (now - lastCallAt < RATE_LIMIT_MS) {
    const secondsLeft = Math.ceil((RATE_LIMIT_MS - (now - lastCallAt)) / 1000)
    return NextResponse.json(
      { error: `Rate limited. Try again in ${secondsLeft}s.` },
      { status: 429 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_key') {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local.' },
      { status: 503 }
    )
  }

  const supabase = createServerClient()

  const [{ data: products }, { data: suppliers }, { data: machines }] = await Promise.all([
    supabase.from('products').select('*').eq('status', 'active'),
    supabase.from('suppliers').select('*'),
    supabase.from('machines').select('*'),
  ])

  if (!products?.length) {
    return NextResponse.json(
      { error: 'No products in database yet.' },
      { status: 400 }
    )
  }

  // Build product summary for Claude
  const productSummary = products.map(p => {
    const supplier = suppliers?.find(s => s.id === p.supplier_id)
    const machine = machines?.find(m => m.id === p.machine_id)
    const margin = getMargin(p.cost_price, p.sell_price)
    return {
      name: p.name,
      category: p.category,
      is_diy: p.is_diy,
      cost_rm: p.cost_price,
      sell_rm: p.sell_price,
      margin_pct: margin,
      moq: p.moq,
      turnaround: p.turnaround,
      tags: p.tags,
      supplier: supplier?.name ?? (p.is_diy ? 'DIY' : 'none'),
      machine_needed: machine ? `${machine.name} (${machine.owned ? 'owned' : 'NOT owned'})` : null,
      notes: p.notes,
    }
  })

  const prompt = `You are analysing the product catalogue for a solo print broker based in Rawang, Selangor, Malaysia.

Business context:
- Solo operator, no printer — 100% outsourced to suppliers
- Sells via WhatsApp direct, Facebook groups, physical cold calls, word of mouth
- Has: Canva/Adobe design skills, coding skills (unique!), car for same-day Selangor delivery
- Year: 2026, Malaysian SME market

Product catalogue (${products.length} active products):
${JSON.stringify(productSummary, null, 2)}

Analyse this catalogue from the perspective of a senior marketing manager specialising in Malaysia SME market 2026.

Return ONLY valid JSON in this exact schema (no markdown, no explanation):
{
  "health": "one sentence business health assessment",
  "topCat": "best performing or highest opportunity category name",
  "potential": "estimated monthly revenue potential as a range e.g. RM 3,000–8,000",
  "priorities": ["top priority action 1", "top priority action 2", "top priority action 3"],
  "gaps": "one paragraph on catalogue gaps vs Malaysia market demand",
  "risks": "one paragraph on key business risks",
  "action": "single most important next action this week"
}`

  try {
    lastCallAt = now

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are a senior marketing manager specialising in the Malaysia SME print and branding market in 2026. You provide concise, actionable business intelligence. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    let parsed
    try {
      // Strip any accidental markdown code fences
      const clean = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: rawText }, { status: 502 })
    }

    // Save to ai_analyses table
    await supabase.from('ai_analyses').insert([{
      health: parsed.health ?? null,
      top_category: parsed.topCat ?? null,
      potential: parsed.potential ?? null,
      priorities: parsed.priorities ?? null,
      gaps: parsed.gaps ?? null,
      risks: parsed.risks ?? null,
      action: parsed.action ?? null,
    }])

    return NextResponse.json(parsed)
  } catch (error) {
    lastCallAt = 0 // reset on error so user can retry
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
