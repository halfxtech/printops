'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AiAnalyst } from '@/components/dashboard/ai-analyst'

export function DashboardClient() {
  const [triggerKey, setTriggerKey] = useState(0)

  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        setTriggerKey(k => k + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return <AiAnalyst triggerKey={triggerKey} />
}
