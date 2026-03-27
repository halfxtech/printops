'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { Product, Supplier, Machine } from '@/lib/types'

interface ProductFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  product?: Product | null
  suppliers: Supplier[]
  machines: Machine[]
}

const CATEGORIES = [
  { value: 'packaging', label: 'Packaging' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'event', label: 'Event' },
  { value: 'digital', label: 'Digital' },
  { value: 'signage', label: 'Signage' },
]

const TAG_OPTIONS = ['day1', 'highval', 'recurring', 'seasonal']
const TAG_LABELS: Record<string, string> = { day1: 'Day 1', highval: 'High Value', recurring: 'Recurring', seasonal: 'Seasonal' }

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

export function ProductForm({ open, onClose, onSaved, product, suppliers, machines }: ProductFormProps) {
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<{
    name: string
    category: Product['category']
    is_diy: boolean
    supplier_id: string
    machine_id: string
    cost_price: string
    sell_price: string
    moq: string
    turnaround: string
    tags: string[]
    notes: string
    status: 'active' | 'inactive'
  }>({
    name: product?.name ?? '',
    category: product?.category ?? 'packaging',
    is_diy: product?.is_diy ?? false,
    supplier_id: product?.supplier_id ?? '',
    machine_id: product?.machine_id ?? '',
    cost_price: String(product?.cost_price ?? ''),
    sell_price: String(product?.sell_price ?? ''),
    moq: product?.moq ?? '',
    turnaround: product?.turnaround ?? '',
    tags: product?.tags ?? [],
    notes: product?.notes ?? '',
    status: product?.status ?? 'active',
  })

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.category) { setError('Category is required'); return }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      category: form.category as Product['category'],
      is_diy: form.is_diy,
      supplier_id: form.supplier_id || null,
      machine_id: form.machine_id || null,
      cost_price: parseFloat(form.cost_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      moq: form.moq || null,
      turnaround: form.turnaround || null,
      tags: form.tags,
      notes: form.notes || null,
      status: form.status as 'active' | 'inactive',
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
                <SelectTrigger className="">
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
                <SelectTrigger className="">
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
              <SelectTrigger className="">
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

          <FormField label="Equipment (optional)">
            <Select value={form.machine_id || 'none'} onValueChange={v => setField('machine_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="">
                <SelectValue placeholder="No equipment needed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No equipment needed</SelectItem>
                {machines.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
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
            <FormField label="Sell price (RM)">
              <Input
                type="number"
                value={form.sell_price}
                onChange={e => setField('sell_price', e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                             />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="MOQ">
              <Input
                value={form.moq}
                onChange={e => setField('moq', e.target.value)}
                placeholder="e.g. 20pcs"
                             />
            </FormField>
            <FormField label="Turnaround">
              <Input
                value={form.turnaround}
                onChange={e => setField('turnaround', e.target.value)}
                placeholder="e.g. 2–3 days"
                             />
            </FormField>
          </div>

          {/* Tags */}
          <FormField label="Tags">
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    form.tags.includes(tag)
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          </FormField>

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
              className="flex-1 h-11"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleSave}
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
