'use client'

import { useActionState, useRef } from 'react'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { login } from './actions'

gsap.registerPlugin(useGSAP)

const FLOATERS = ['🍬', '🍭', '🍫', '🧁', '🍩', '🍪', '🍿', '🥤']

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="login-cta mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3 font-bold text-white shadow-lg shadow-[#d81b60]/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      aria-busy={pending}
    >
      {pending ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
            aria-hidden="true"
          />
          Entrando...
        </>
      ) : (
        'Ingresar'
      )}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, { error: '' } as { error?: string })
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('.login-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      gsap.from('.login-field', {
        y: 16,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.25,
        ease: 'power2.out',
      })
      gsap.to('.floater', {
        y: '-=24',
        rotation: '+=12',
        duration: 'random(2.5, 4.5)',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.3, from: 'random' },
      })
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#8e44ad] via-[#9b59b6] to-[#d81b60] p-4"
    >
      {/* floating candy backdrop */}
      <div className="pointer-events-none absolute inset-0">
        {FLOATERS.map((c, i) => (
          <span
            key={i}
            className="floater absolute text-4xl opacity-25 md:text-6xl"
            style={{
              left: `${(i * 13 + 6) % 92}%`,
              top: `${(i * 27 + 10) % 85}%`,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="login-card relative z-10 w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 h-20 w-20">
            <Image
              src="/Logo/Chuchu_logo.png"
              alt="Chuchu"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#8e44ad]">
            Chuchu <span className="text-[#d81b60]">Panel</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Acceso a tu negocio
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="login-field">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Correo
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tucorreo@gmail.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#d81b60]"
            />
          </div>

          <div className="login-field">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#d81b60]"
            />
          </div>

          {state?.error ? (
            <p className="login-field rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {state.error}
            </p>
          ) : null}

          <div className="login-field">
            <SubmitButton />
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          ✨ Chuchu Smart Menu · Multi-tenant
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          ¿Eres nuevo?{' '}
          <Link href="/registro" className="font-semibold text-[#8e44ad] hover:underline">
            Activa tu prueba gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
