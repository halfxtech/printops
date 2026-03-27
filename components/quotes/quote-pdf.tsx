import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Quote, QuoteItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

// ─── Logo ────────────────────────────────────────────────────────────────────
// When your logo is ready, replace the placeholder box below with:
//   import { Image } from '@react-pdf/renderer'
//   <Image src="/path/to/logo.png" style={styles.logo} />
//
// Recommended logo format:
//   • File type : PNG with transparent background
//   • Dimensions: 400 × 120 px minimum (2× for sharpness)
//   • Colour    : Works best as a solid dark mark (no white fill needed)
//   • Max size  : Keep under 200 KB so PDF generation stays fast
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1c1c1e',
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  logoPlaceholder: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 7,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // logo: { width: 120, height: 40, objectFit: 'contain' },   ← uncomment when using <Image>
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#8e8e93',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1c1e',
  },
  quoteDate: {
    fontSize: 8,
    color: '#8e8e93',
    marginTop: 3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
    marginBottom: 24,
  },

  // From / Bill To — two-column block
  addressBlock: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 28,
  },
  addressCol: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#8e8e93',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fromCompany: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  fromMeta: {
    fontSize: 8.5,
    color: '#8e8e93',
    marginBottom: 1,
  },
  billToCompany: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  billToName: {
    fontSize: 9,
    color: '#3a3a3c',
    marginBottom: 1,
  },
  billToMeta: {
    fontSize: 8.5,
    color: '#8e8e93',
    marginBottom: 1,
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#8e8e93',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colProduct: { flex: 1 },
  colQty: { width: 36, textAlign: 'right' },
  colUnit: { width: 68, textAlign: 'right' },
  colTotal: { width: 72, textAlign: 'right' },
  cellText: {
    fontSize: 9,
    color: '#1c1c1e',
  },

  // Totals
  totalsBlock: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: '#1c1c1e',
    marginBottom: 6,
    width: 160,
    alignSelf: 'flex-end',
  },
  grandTotalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1c1e',
    width: 72,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1c1e',
    width: 72,
    textAlign: 'right',
  },

  // Notes
  notesBlock: {
    marginTop: 28,
    padding: 14,
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 8.5,
    color: '#3a3a3c',
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingTop: 10,
  },
  footerLeft: {
    fontSize: 7.5,
    color: '#8e8e93',
  },
  footerRight: {
    fontSize: 7.5,
    color: '#8e8e93',
  },
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return formatDate(d.toISOString())
}

// ─── Company details ──────────────────────────────────────────────────────────
// Update these when you have a permanent address / contact.
const COMPANY = {
  name: 'Halfx Industries',
  address: 'Kuala Lumpur, Malaysia',
  email: 'hello@halfx.my',
  phone: '+60 11-3596 0619',
}
// ─────────────────────────────────────────────────────────────────────────────

interface QuotePdfProps {
  quote: Quote
  items: QuoteItem[]
}

export function QuotePdf({ quote, items }: QuotePdfProps) {
  const grandTotal = items.reduce((s, i) => s + i.qty * i.unit_sell, 0)
  const createdAt = quote.created_at ?? new Date().toISOString()
  const validUntil = addDays(createdAt, 30)
  const quoteDate = formatDate(createdAt)

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header — logo placeholder + quote ref */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>Your logo here{'\n'}PNG · transparent bg</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>Quotation</Text>
            <Text style={styles.quoteNumber}>{quote.quote_number ?? '—'}</Text>
            <Text style={styles.quoteDate}>{quoteDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Company Details (From) + Bill To side by side */}
        <View style={styles.addressBlock}>

          {/* Left — Company Details */}
          <View style={styles.addressCol}>
            <Text style={styles.sectionLabel}>Company details</Text>
            <Text style={styles.fromCompany}>{COMPANY.name}</Text>
            <Text style={styles.fromMeta}>{COMPANY.address}</Text>
            <Text style={styles.fromMeta}>{COMPANY.phone}</Text>
            <Text style={styles.fromMeta}>{COMPANY.email}</Text>
          </View>

          {/* Right — Bill To */}
          <View style={styles.addressCol}>
            <Text style={styles.sectionLabel}>Bill to</Text>
            {quote.customer_company ? (
              <Text style={styles.billToCompany}>{quote.customer_company}</Text>
            ) : null}
            <Text style={quote.customer_company ? styles.billToName : styles.billToCompany}>
              {quote.customer_name}
            </Text>
            {quote.customer_contact ? (
              <Text style={styles.billToMeta}>{quote.customer_contact}</Text>
            ) : null}
            {quote.customer_address ? (
              <Text style={styles.billToMeta}>{quote.customer_address}</Text>
            ) : null}
          </View>

        </View>

        <View style={styles.divider} />

        {/* Line items */}
        {items.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProduct]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit price</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>
            {items.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.tableRow, idx === items.length - 1 ? styles.tableRowLast : {}]}
              >
                <Text style={[styles.cellText, styles.colProduct]}>{item.product_name}</Text>
                <Text style={[styles.cellText, styles.colQty]}>{item.qty}</Text>
                <Text style={[styles.cellText, styles.colUnit]}>{formatCurrency(item.unit_sell)}</Text>
                <Text style={[styles.cellText, styles.colTotal]}>{formatCurrency(item.qty * item.unit_sell)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Grand total */}
        <View style={styles.totalsBlock}>
          <View style={styles.grandTotalDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes ? (
          <View style={styles.notesBlock}>
            <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Valid until {validUntil}</Text>
          <Text style={styles.footerRight}>This is computer generated documents. No signature required.</Text>
        </View>

      </Page>
    </Document>
  )
}
