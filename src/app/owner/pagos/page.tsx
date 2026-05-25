import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionContext } from '@/lib/auth'
import type { Payment } from '@/lib/types'
import PaymentsView from './PaymentsView'

export const dynamic = 'force-dynamic'

export default async function PagosPage() {
  const { profile } = await getSessionContext()
  if (!profile) redirect('/login')
  if (profile.role !== 'owner') redirect('/admin')

  const supabase = await createClient()
  const { data } = await supabase
    .from('payments')
    .select('*, companies(name, slug, paid_until)')
    .order('created_at', { ascending: false })

  return <PaymentsView payments={(data ?? []) as Payment[]} />
}
