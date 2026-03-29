import { type NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerClient } from '@/lib/supabase'
import { QuotePdf } from '@/components/quotes/quote-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('created_at'),
  ])

  if (!quote) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(<QuotePdf quote={quote} items={items ?? []} /> as any)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quote.quote_number ?? 'quote'}.pdf"`,
    },
  })
}
