'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ensureUniqueSlug } from '@/lib/slug'

export type RegisterState = { error?: string }

export async function registerTrial(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const companyName = String(formData.get('company_name') || '').trim()
  const adminName = String(formData.get('admin_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!companyName || !adminName || !email || !password) {
    return { error: 'Completa todos los campos para crear tu prueba gratis.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const admin = createAdminClient()

  const slug = await ensureUniqueSlug(companyName, async (candidate) => {
    const { data } = await admin
      .from('companies')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    return Boolean(data)
  })

  const { data: company, error: companyErr } = await admin
    .from('companies')
    .insert({ name: companyName, slug })
    .select('id')
    .single()

  if (companyErr || !company) {
    return { error: `No se pudo crear tu empresa: ${companyErr?.message ?? 'error desconocido'}` }
  }

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: adminName },
  })

  if (userErr || !userRes.user) {
    await admin.from('companies').delete().eq('id', company.id)
    return { error: `No se pudo crear tu usuario: ${userErr?.message ?? 'correo ya registrado'}` }
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: userRes.user.id,
    email,
    role: 'admin',
    company_id: company.id,
  })

  if (profileErr) {
    await admin.auth.admin.deleteUser(userRes.user.id)
    await admin.from('companies').delete().eq('id', company.id)
    return { error: `No se pudo completar tu registro: ${profileErr.message}` }
  }

  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) {
    return {
      error:
        'Tu prueba fue creada, pero no pudimos iniciar sesión automáticamente. Ingresa desde /login.',
    }
  }

  redirect('/admin')
}
