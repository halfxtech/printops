'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/lib/types'

interface SupplierFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  supplier?: Supplier | null
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

export function SupplierForm({ open, onClose, onSaved, supplier }: SupplierFormProps) {
  const isEdit = !!supplier
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'print',
    contact: '',
    email: '',
    location: '',
    website: '',
    notes: '',
    status: 'active',
  })

  useEffect(() => {
    if (open) {
      setError(null)
      setForm({
        name: supplier?.name ?? '',
        type: supplier?.type ?? 'print',
        contact: supplier?.contact ?? '',
        email: supplier?.email ?? '',
        location: supplier?.location ?? '',
        website: supplier?.website ?? '',
        notes: supplier?.notes ?? '',
        status: supplier?.status ?? 'active',
      })
    }
  }, [open, supplier])

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(asDraft = false) {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      type: form.type,
      contact: form.contact || null,
      email: form.email || null,
      location: form.location || null,
      website: form.website || null,
      notes: form.notes || null,
      status: asDraft ? 'inactive' : form.status,
    }

    const { error: err } = isEdit
      ? await supabase.from('suppliers').update(payload).eq('id', supplier!.id)
      : await supabase.from('suppliers').insert([payload])

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-[20px] p-0" aria-describedby={undefined}>
        <div className="sticky top-0 bg-card z-10 px-4 pt-3 pb-2 border-b border-border">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
          <SheetHeader className="text-left px-0">
            <SheetTitle className="text-[17px] font-semibold">
              {isEdit ? 'Edit Supplier' : 'New Supplier'}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-4 py-4 space-y-4 pb-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[10px] p-3">
              <p className="text-[13px] text-destructive">{error}</p>
            </div>
          )}

          <FormField label="Supplier name">
            <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. ABC Print Sdn Bhd" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <Select value={form.type} onValueChange={v => setField('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['print', 'signage', 'apparel', 'digital', 'other'].map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => setField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Contact (phone / WhatsApp)">
            <Input value={form.contact} onChange={e => setField('contact', e.target.value)} placeholder="+60 12-345 6789" />
          </FormField>

          <FormField label="Email">
            <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="supplier@example.com" />
          </FormField>

          <FormField label="Address / Location">
            <Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Shah Alam, Selangor" />
          </FormField>

          <FormField label="Website">
            <Input type="url" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://example.com" />
          </FormField>

          <FormField label="Notes">
            <Textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Payment terms, quality notes…" rows={3} className="resize-none" />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="h-11 px-4" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="outline" className="flex-1 h-11" onClick={() => handleSave(true)} disabled={saving}>Save Draft</Button>
            <Button className="flex-1 h-11" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
