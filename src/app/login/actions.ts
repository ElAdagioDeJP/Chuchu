'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccess } from '@/lib/billing'

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) {
    return { error: 'Ingresa correo y contraseña.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dest = '/admin'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'owner') {
      dest = '/owner'
    } else if (profile?.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('active, created_at, paid_until')
        .eq('id', profile.company_id)
        .single()
      if (company) {
        const access = getAccess(company)
        if (access.state === 'disabled') {
          await supabase.auth.signOut()
          return { error: 'Esta cuenta está desactivada. Contacta al propietario.' }
        }
      } else {
        await supabase.auth.signOut()
        return { error: 'No encontramos la empresa de este usuario.' }
      }
    }
  }

  redirect(dest)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
