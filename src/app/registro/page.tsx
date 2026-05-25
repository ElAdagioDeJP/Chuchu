'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerTrial, type RegisterState } from './actions'
import SubmitButton from '@/app/admin/components/SubmitButton'

const FLOATERS = ['🍬', '🍭', '🍫', '🧁', '🍩', '🍪']

export default function RegistroPage() {
  const [state, formAction] = useActionState(registerTrial, {} as RegisterState)

  return (
    <div className="min-h-screen bg-[#f6f2fb] px-4 py-4 text-gray-900 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[#e6dff2] bg-white shadow-[0_18px_60px_rgba(62,14,98,0.18)]">
        <div className="grid lg:grid-cols-[1.05fr_1fr]">
          <section className="relative overflow-hidden bg-[#1a1024] p-6 text-white md:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0">
              {FLOATERS.map((c, i) => (
                <span
                  key={i}
                  className="absolute text-3xl opacity-20"
                  style={{ left: `${(i * 15 + 8) % 88}%`, top: `${(i * 17 + 10) % 82}%` }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[#8e44ad]/40 blur-[120px]" />
            <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-[#d81b60]/40 blur-[120px]" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-[#fff176]">
                ✨ Activa tu prueba en minutos
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Prueba gratis 5 dias
              </h1>
              <p className="mt-3 max-w-md text-sm text-white/75 md:text-base">
                Mismo look de la landing, pero enfocado en registro rapido: creas tu cuenta, entras al panel y empiezas a vender.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="font-semibold text-[#fff176]">Completa estos campos asi:</p>
                <ul className="mt-2 space-y-1 text-white/80">
                  <li>
                    <b>Nombre del negocio:</b> Ej. La Golosina.
                  </li>
                  <li>
                    <b>Tu nombre:</b> administrador principal del panel.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="p-5 md:p-7 lg:p-8">
            <form action={formAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Nombre del negocio</span>
                  <input
                    name="company_name"
                    required
                    placeholder="Ej: La Golosina"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-[#d81b60] focus:ring-2 focus:ring-[#f06292]/25"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tu nombre</span>
                  <input
                    name="admin_name"
                    required
                    placeholder="Ej: Maria Perez"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-[#d81b60] focus:ring-2 focus:ring-[#f06292]/25"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Correo administrativo</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@tunegocio.com"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-[#d81b60] focus:ring-2 focus:ring-[#f06292]/25"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Contrasena</span>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    placeholder="Minimo 6 caracteres"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-[#d81b60] focus:ring-2 focus:ring-[#f06292]/25"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Cada red (IP) solo puede activar una prueba gratis. Si tu prueba ya vencio, debes renovar tu suscripcion.
              </div>

              {state.error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {state.error}
                </p>
              )}

              <SubmitButton
                pendingText="Creando cuenta..."
                className="w-full rounded-xl bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3 font-bold text-white shadow-lg shadow-[#d81b60]/25"
              >
                Crear cuenta de prueba
              </SubmitButton>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Ya tienes acceso?{' '}
              <Link href="/login" className="font-semibold text-[#8e44ad] hover:underline">
                Inicia sesion
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
