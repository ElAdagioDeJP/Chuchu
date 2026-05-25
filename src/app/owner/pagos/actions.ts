'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PaymentStatus } from '@/lib/types'
import { extendPaidUntil } from '@/lib/billing'

async function assertOwner() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'owner') throw new Error('Acceso denegado')
}

export async function setPaymentStatus(formData: FormData): Promise<void> {
  await assertOwner()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '') as PaymentStatus
  if (!id || !['pending', 'validated', 'rejected'].includes(status)) return

  const admin = createAdminClient()
  const { data: payment } = await admin
    .from('payments')
    .select('company_id, status')
    .eq('id', id)
    .single()

  await admin.from('payments').update({ status }).eq('id', id)

  const shouldExtend =
    status === 'validated' &&
    payment?.status !== 'validated' &&
    typeof payment?.company_id === 'string' &&
    payment.company_id.length > 0

  if (shouldExtend) {
    const { data: company } = await admin
      .from('companies')
      .select('paid_until')
      .eq('id', payment.company_id)
      .single()

    await admin
      .from('companies')
      .update({ paid_until: extendPaidUntil(company?.paid_until ?? null) })
      .eq('id', payment.company_id)
  }

  revalidatePath('/owner/pagos')
  revalidatePath('/admin')
}
