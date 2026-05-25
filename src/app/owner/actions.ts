'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureUniqueSlug } from '@/lib/slug'

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

export type OwnerActionState = { error?: string; success?: string }

export async function createCompany(
  _prev: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  try {
    await assertOwner()
  } catch {
    return { error: 'Acceso denegado.' }
  }

  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const logo = formData.get('logo') as File | null

  if (!name || !email || !password) {
    return { error: 'Nombre, correo y contraseña son obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const admin = createAdminClient()

  const slug = await ensureUniqueSlug(name, async (candidate) => {
    const { data } = await admin
      .from('companies')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    return Boolean(data)
  })

  // Upload logo (optional)
  let logo_url: string | null = null
  if (logo && logo.size > 0) {
    const ext = (logo.name.split('.').pop() || 'png').toLowerCase()
    const path = `${slug}-${Date.now()}.${ext}`
    const { error: upErr } = await admin.storage
      .from('logos')
      .upload(path, logo, { contentType: logo.type, upsert: true })
    if (upErr) return { error: `Error subiendo logo: ${upErr.message}` }
    logo_url = admin.storage.from('logos').getPublicUrl(path).data.publicUrl
  }

  // Create company
  const { data: company, error: compErr } = await admin
    .from('companies')
    .insert({ name, slug, logo_url })
    .select()
    .single()
  if (compErr || !company) {
    return { error: `Error creando empresa: ${compErr?.message}` }
  }

  // Create the admin auth user
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userErr || !created.user) {
    await admin.from('companies').delete().eq('id', company.id)
    return { error: `Error creando usuario: ${userErr?.message}` }
  }

  // Link profile -> company as admin
  const { error: profErr } = await admin.from('profiles').insert({
    id: created.user.id,
    email,
    role: 'admin',
    company_id: company.id,
  })
  if (profErr) {
    await admin.auth.admin.deleteUser(created.user.id)
    await admin.from('companies').delete().eq('id', company.id)
    return { error: `Error vinculando admin: ${profErr.message}` }
  }

  revalidatePath('/owner')
  return { success: `Empresa "${name}" creada. El admin ya puede ingresar.` }
}

/**
 * Enable/disable a company. Disabling bans its admin user(s) so they can no
 * longer sign in (existing sessions die on next token refresh). No data is
 * deleted — re-activating restores access.
 */
export async function toggleCompanyActive(formData: FormData): Promise<void> {
  await assertOwner()
  const companyId = String(formData.get('companyId') || '')
  const next = String(formData.get('next') || '') === 'true'
  if (!companyId) return

  const admin = createAdminClient()

  await admin.from('companies').update({ active: next }).eq('id', companyId)

  const { data: profiles } = await admin
    .from('profiles')
    .select('id')
    .eq('company_id', companyId)
  for (const p of profiles ?? []) {
    await admin.auth.admin.updateUserById(p.id, {
      ban_duration: next ? 'none' : '876000h',
    })
  }

  revalidatePath('/owner')
}
