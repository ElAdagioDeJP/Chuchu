'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerTrial, type RegisterState } from './actions'
import SubmitButton from '@/app/admin/components/SubmitButton'

export default function RegistroPage() {
  const [state, formAction] = useActionState(registerTrial, {} as RegisterState)

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-gray-800">🎁 Prueba gratis 5 días</h1>
        <p className="mt-2 text-sm text-gray-500">
          Crea tu cuenta, entra al panel y comienza a usar Chuchu ahora mismo.
        </p>

        <form action={formAction} className="mt-6 space-y-3">
          <input
            name="company_name"
            required
            placeholder="Nombre del negocio"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
          />
          <input
            name="admin_name"
            required
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Correo administrativo"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
          />
          <input
            name="password"
            type="password"
            minLength={6}
            required
            placeholder="Contraseña (mín. 6)"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
          />

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{state.error}</p>
          )}

          <SubmitButton
            pendingText="Creando cuenta…"
            className="w-full rounded-xl bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3 font-bold text-white"
          >
            Crear cuenta de prueba
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          ¿Ya tienes acceso?{' '}
          <Link href="/login" className="font-semibold text-[#8e44ad] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
