'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { getSellPrice, formatCurrency } from '@/lib/utils'
import type { Product, Supplier } from '@/lib/types'

interface ProductFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  product?: Product | null
  suppliers: Supplier[]
}

const CATEGORIES = [
  { value: 'STN', label: 'Stationery' },
  { value: 'MKT', label: 'Marketing' },
  { value: 'APR', label: 'Apparel' },
  { value: 'PKG', label: 'Packaging' },
  { value: 'BOK', label: 'Books & Folders' },
  { value: 'EVT', label: 'Events' },
  { value: 'SGN', label: 'Signage' },
  { value: 'CST', label: 'Custom' },
]

const MARGIN_PRESETS = [25, 50, 75, 100]

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

type SizeRow = { name: string; cost_price: string }

export function ProductForm({ open, onClose, onSaved, product, suppliers }: ProductFormProps) {
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<{
    name: string
    category: Product['category']
    is_diy: boolean
    supplier_id: string
    cost_price: string
    margin_pct: string
    sizes: SizeRow[]
    moq: string
    notes: string
    status: 'active' | 'inactive'
  }>({
    name: '',
    category: 'STN',
    is_diy: false,
    supplier_id: '',
    cost_price: '',
    margin_pct: '50',
    sizes: [],
    moq: '',
    notes: '',
    status: 'active',
  })

  useEffect(() => {
    if (open) {
      setError(null)
      setForm({
        name: product?.name ?? '',
        category: product?.category ?? 'STN',
        is_diy: product?.is_diy ?? false,
        supplier_id: product?.supplier_id ?? '',
        cost_price: String(product?.cost_price ?? ''),
        margin_pct: String(product?.margin_pct ?? 50),
        sizes: product?.sizes?.map(s => ({ name: s.name, cost_price: String(s.cost_price) })) ?? [],
        moq: product?.moq ?? '',
        notes: product?.notes ?? '',
        status: product?.status ?? 'active',
      })
    }
  }, [open, product])

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function addSize() {
    setForm(f => ({ ...f, sizes: [...f.sizes, { name: '', cost_price: '' }] }))
  }

  function removeSize(idx: number) {
    setForm(f => ({ ...f, sizes: f.sizes.filter((_, i) => i !== idx) }))
  }

  function updateSize(idx: number, field: keyof SizeRow, value: string) {
    setForm(f => {
      const sizes = [...f.sizes]
      sizes[idx] = { ...sizes[idx], [field]: value }
      return { ...f, sizes }
    })
  }

  const hasSizes = form.sizes.length > 0
  const baseCost = hasSizes
    ? parseFloat(form.sizes[0]?.cost_price) || 0
    : parseFloat(form.cost_price) || 0
  const marginPct = parseInt(form.margin_pct) || 0
  const previewSell = getSellPrice(baseCost, marginPct)

  async function handleSave(asDraft = false) {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.category) { setError('Category is required'); return }
    setSaving(true)
    setError(null)

    const sizes = form.sizes
      .filter(s => s.name.trim())
      .map(s => ({ name: s.name.trim(), cost_price: parseFloat(s.cost_price) || 0 }))

    const effectiveCost = sizes.length > 0
      ? (sizes[0].cost_price)
      : parseFloat(form.cost_price) || 0

    const payload = {
      name: form.name.trim(),
      category: form.category as Product['category'],
      is_diy: form.is_diy,
      supplier_id: form.supplier_id || null,
      cost_price: effectiveCost,
      margin_pct: parseInt(form.margin_pct) || 0,
      sizes,
      moq: form.moq || null,
      notes: form.notes || null,
      status: asDraft ? 'inactive' : form.status as 'active' | 'inactive',
    }

    const { error: err } = isEdit
      ? await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', product!.id)
      : await supabase.from('products').insert([payload])

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-[20px] p-0"
        aria-describedby={undefined}
      >
        <div className="sticky top-0 bg-card z-10 px-4 pt-3 pb-2 border-b border-border">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
          <SheetHeader className="text-left px-0">
            <SheetTitle className="text-[17px] font-semibold">
              {isEdit ? 'Edit Product' : 'New Product'}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-4 py-4 space-y-4 pb-safe">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[10px] p-3">
              <p className="text-[13px] text-destructive">{error}</p>
            </div>
          )}

          <FormField label="Product name">
            <Input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g. Product label stickers"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={form.category} onValueChange={v => setField('category', v as Product['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status">
              <Select value={form.status} onValueChange={v => setField('status', v as 'active' | 'inactive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* DIY toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[14px] font-medium">DIY product</p>
              <p className="text-[12px] text-muted-foreground">You produce this without a supplier</p>
            </div>
            <button
              onClick={() => setField('is_diy', !form.is_diy)}
              className={`w-12 h-7 rounded-full transition-colors duration-200 ${form.is_diy ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ml-1 ${form.is_diy ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <FormField label="Supplier">
            <Select value={form.supplier_id || 'none'} onValueChange={v => setField('supplier_id', v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="No supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier</SelectItem>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Sizes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">Sizes (optional)</label>
              {form.sizes.length > 0 && (
                <button
                  onClick={addSize}
                  className="text-[12px] font-semibold text-primary flex items-center gap-1 hover:opacity-80"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Size
                </button>
              )}
            </div>

            {form.sizes.length === 0 && (
              <button
                onClick={addSize}
                className="w-full border-2 border-dashed border-border rounded-[10px] py-4 flex flex-col items-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[12px] font-medium">Tap to add variants (e.g. A4 / 100pcs)</span>
              </button>
            )}

            {form.sizes.length > 0 && (
              <div className="space-y-2">
                {form.sizes.map((size, idx) => {
                  const sizeCost = parseFloat(size.cost_price) || 0
                  const sizeSell = getSellPrice(sizeCost, marginPct)
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-[10px] px-3 py-2">
                      <Input
                        value={size.name}
                        onChange={e => updateSize(idx, 'name', e.target.value)}
                        placeholder="e.g. A4 / 100pcs"
                        className="flex-1 h-8 text-[13px]"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[12px] text-muted-foreground">RM</span>
                        <Input
                          type="number"
                          value={size.cost_price}
                          onChange={e => updateSize(idx, 'cost_price', e.target.value)}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          className="w-20 h-8 text-[13px]"
                        />
                      </div>
                      {sizeCost > 0 && (
                        <span className="text-[11px] text-muted-foreground shrink-0">→ {formatCurrency(sizeSell)}</span>
                      )}
                      <button
                        onClick={() => removeSize(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cost price — only when no sizes */}
          {!hasSizes && (
            <FormField label="Cost price (RM)">
              <Input
                type="number"
                value={form.cost_price}
                onChange={e => setField('cost_price', e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </FormField>
          )}

          {/* Margin % */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-foreground">Margin</label>
            <div className="flex gap-2">
              {MARGIN_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setField('margin_pct', String(p))}
                  className={`flex-1 h-9 rounded-[8px] text-[13px] font-semibold transition-all ${
                    form.margin_pct === String(p)
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {p}%
                </button>
              ))}
              <Input
                type="number"
                value={MARGIN_PRESETS.includes(parseInt(form.margin_pct)) ? '' : form.margin_pct}
                onChange={e => setField('margin_pct', e.target.value)}
                placeholder="Custom"
                min={0}
                max={999}
                className="w-20 h-9 text-[13px]"
              />
            </div>
            {baseCost > 0 && (
              <p className="text-[12px] text-muted-foreground">
                ≈ Sell <span className="font-semibold text-foreground">{formatCurrency(previewSell)}</span>
                {' '}· Profit <span className="font-semibold text-green-600">{formatCurrency(previewSell - baseCost)}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="MOQ">
              <Input
                value={form.moq}
                onChange={e => setField('moq', e.target.value)}
                placeholder="e.g. 20pcs"
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <Textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Add any notes…"
              rows={3}
              className="resize-none"
            />
          </FormField>

          <div className="flex gap-3 pt-2 pb-4">
            <Button
              variant="outline"
              className="h-11 px-4"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              Save Draft
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
