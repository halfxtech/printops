'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InventoryItem, InventoryCategory, InventoryUnit } from '@/lib/types'

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'apparel', label: 'Apparel' },
  { value: 'paper', label: 'Paper' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' },
]

const UNITS: { value: InventoryUnit; label: string }[] = [
  { value: 'pcs', label: 'pcs' },
  { value: 'reams', label: 'reams' },
  { value: 'rolls', label: 'rolls' },
  { value: 'meters', label: 'meters' },
  { value: 'kg', label: 'kg' },
]

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

interface InventoryFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  item: InventoryItem | null
}

export function InventoryForm({ open, onClose, onSaved, item }: InventoryFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<InventoryCategory>('other')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState('0')
  const [unit, setUnit] = useState<InventoryUnit>('pcs')
  const [costPerUnit, setCostPerUnit] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name)
        setCategory(item.category)
        setSize(item.size ?? '')
        setQty(String(item.qty))
        setUnit(item.unit)
        setCostPerUnit(String(item.cost_per_unit))
        setNotes(item.notes ?? '')
      } else {
        setName('')
        setCategory('other')
        setSize('')
        setQty('0')
        setUnit('pcs')
        setCostPerUnit('0')
        setNotes('')
      }
    }
  }, [item, open])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category,
        size: size.trim() || null,
        qty: parseInt(qty) || 0,
        unit,
        cost_per_unit: parseFloat(costPerUnit) || 0,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (item) {
        await supabase.from('inventory').update(payload).eq('id', item.id)
      } else {
        await supabase.from('inventory').insert(payload)
      }

      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">
            {item ? 'Edit stock item' : 'Add stock item'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <FormField label="Item name *">
            <Input
              placeholder="e.g. Plain white t-shirt"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormField>

          <FormField label="Category">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === c.value
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Size / Variant">
            <Input
              placeholder="e.g. M, A4, 30×40cm, Black"
              value={size}
              onChange={e => setSize(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Quantity">
              <Input
                type="number"
                min="0"
                value={qty}
                onChange={e => setQty(e.target.value)}
              />
            </FormField>
            <FormField label="Unit">
              <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Cost per unit (RM)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={e => setCostPerUnit(e.target.value)}
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              rows={3}
              placeholder="Supplier, storage location, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
            />
          </FormField>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full h-11"
          >
            {saving ? 'Saving…' : item ? 'Save changes' : 'Add to stock'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
