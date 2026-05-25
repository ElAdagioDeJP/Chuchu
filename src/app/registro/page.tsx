'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerTrial, type RegisterState } from './actions'
import SubmitButton from '@/app/admin/components/SubmitButton'

export default function RegistroPage() {
  const [state, formAction] = useActionState(registerTrial, {} as RegisterState)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a1024] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#8e44ad]/35 blur-[110px]" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#d81b60]/30 blur-[120px]" />

      <div className="mx-auto max-w-xl rounded-3xl border border-white/15 bg-white/[0.07] p-7 shadow-2xl backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#fff176]/35 bg-[#fff176]/10 px-3 py-1 text-xs font-semibold text-[#fff176]">
          🎁 Solo para nuevos negocios
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Prueba gratis 5 dias</h1>
        <p className="mt-2 text-sm text-white/70">
          Crea tu cuenta en minutos. Luego entras al panel admin y comienzas a cargar tu menu.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
          <p className="font-semibold text-[#fff176]">Que debes colocar en los dos primeros campos:</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/70">
            <li>
              1) <b className="text-white">Nombre del negocio</b>: Ej. <i>La Golosina</i>.
            </li>
            <li>
              2) <b className="text-white">Tu nombre</b>: nombre del administrador que manejara el panel.
            </li>
          </ul>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Nombre del negocio</span>
            <input
              name="company_name"
              required
              placeholder="Ej: La Golosina"
              className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#d81b60]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Tu nombre</span>
            <input
              name="admin_name"
              required
              placeholder="Ej: Maria Perez"
              className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#d81b60]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Correo administrativo</span>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@tunegocio.com"
              className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#d81b60]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Contrasena</span>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              placeholder="Minimo 6 caracteres"
              className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#d81b60]"
            />
          </label>

          <div className="rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Cada red (IP) solo puede activar una prueba gratis. Si tu prueba ya vencio, debes renovar tu suscripcion.
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-100">{state.error}</p>
          )}

          <SubmitButton
            pendingText="Creando cuenta..."
            className="w-full rounded-xl bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3 font-bold text-white shadow-lg shadow-[#d81b60]/30"
          >
            Crear cuenta de prueba
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-white/65">
          Ya tienes acceso?{' '}
          <Link href="/login" className="font-semibold text-[#fff176] hover:underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
