'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PLANS } from '@/lib/plans'
import { usdToBs } from '@/lib/dolar'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const FLOATERS = ['🍬', '🍭', '🍫', '🧁', '🍩', '🍪', '🍿', '🥤', '🍦', '🍮']

const FEATURES = [
  { icon: '📺', title: 'Menú digital en TV', desc: 'Tus combos en pantalla, animados y siempre actualizados.' },
  { icon: '📦', title: 'Inventario inteligente', desc: 'Control de stock que baja solo con cada venta.' },
  { icon: '🤖', title: 'Sugerencias IA', desc: 'Une productos lentos con los más vendidos para moverlos.' },
  { icon: '🍱', title: 'Combos ilimitados', desc: 'Crea ofertas con precio especial en segundos.' },
  { icon: '📊', title: 'Reportes claros', desc: 'Mide el "efecto combos" sobre tus ventas.' },
  { icon: '🏪', title: 'Multi-sucursal', desc: 'Cada negocio con su marca, junto a Chuchu.' },
]

const STEPS = [
  { n: '1', title: 'Regístrate', desc: 'Activa tu prueba gratis por 5 días al instante.' },
  { n: '2', title: 'Carga tu menú', desc: 'Productos, combos y tu logo en minutos.' },
  { n: '3', title: 'Conecta tu TV', desc: 'Abre tu URL en cualquier pantalla y a vender.' },
]

export default function Landing({ rate }: { rate: number }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Hero entrance
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.5 })
        .from('.hero-title', { y: 40, opacity: 0, duration: 0.8 }, '-=0.2')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.5, stagger: 0.12 }, '-=0.3')
        .from('.hero-tv', { scale: 0.85, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' }, '-=0.5')

      // Floating candy backdrop
      gsap.to('.floater', {
        y: '-=26',
        rotation: '+=15',
        duration: 'random(2.5, 5)',
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.3, from: 'random' },
      })

      // Scroll reveals
      gsap.set('.reveal', { opacity: 0, y: 48 })
      ScrollTrigger.batch('.reveal', {
        start: 'top 88%',
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', overwrite: true }),
      })
    },
    { scope: root }
  )

  const basic = PLANS.basic
  const pro = PLANS.pro
  const basicBs = rate > 0 ? usdToBs(basic.priceUsd, rate) : 0

  return (
    <div ref={root} className="min-h-screen overflow-x-hidden bg-[#1a1024] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#1a1024]/80 px-5 py-3 backdrop-blur md:px-10">
        <div className="flex items-center gap-2">
          <div className="relative h-9 w-9">
            <Image src="/Logo/Chuchu_logo.png" alt="Chuchu" fill sizes="36px" className="object-contain" priority />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter">
            Chu<span className="text-[#f06292]">chu</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="#caracteristicas" className="hidden text-white/70 transition hover:text-white sm:block">
            Características
          </a>
          <a href="#planes" className="hidden text-white/70 transition hover:text-white sm:block">
            Planes
          </a>
          <a
            href="https://www.instagram.com/chuchu_service/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram de Chuchu"
            className="hidden text-white/70 transition hover:text-[#f06292] sm:block"
          >
            Instagram
          </a>
          <Link
            href="/login"
            className="rounded-full bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20"
          >
            Ingresar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative flex min-h-[88vh] items-center overflow-hidden px-5 py-16 md:px-10">
        <div className="pointer-events-none absolute inset-0">
          {FLOATERS.map((c, i) => (
            <span
              key={i}
              className="floater absolute text-4xl opacity-20 md:text-6xl"
              style={{ left: `${(i * 11 + 4) % 94}%`, top: `${(i * 23 + 8) % 88}%` }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#8e44ad]/40 blur-[120px]" />
        <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-[#d81b60]/40 blur-[120px]" />

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="hero-badge inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#fff176]">
              ✨ El menú digital inteligente para tu negocio
            </span>
            <h1 className="hero-title mt-5 text-5xl font-black leading-[1.05] tracking-tighter md:text-7xl">
              Vende más con{' '}
              <span className="bg-gradient-to-r from-[#f06292] via-[#fff176] to-[#4dd0e1] bg-clip-text text-transparent">
                combos en pantalla
              </span>
            </h1>
            <p className="hero-sub mt-5 max-w-md text-lg text-white/70">
              Chuchu convierte tu TV en un menú vivo: inventario, combos y una IA que
              te dice qué juntar para mover lo que no se vende.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/registro"
                className="hero-cta rounded-full bg-gradient-to-r from-[#fff176] to-[#f5d13d] px-7 py-3.5 font-bold text-gray-900 shadow-lg shadow-[#fff176]/30 transition-transform hover:scale-105 active:scale-95"
              >
                Probar 5 días gratis
              </Link>
              <a
                href="#planes"
                className="hero-cta rounded-full bg-gradient-to-r from-[#d81b60] to-[#8e44ad] px-7 py-3.5 font-bold shadow-lg shadow-[#d81b60]/30 transition-transform hover:scale-105 active:scale-95"
              >
                Ver planes
              </a>
              <Link
                href="/login"
                className="hero-cta rounded-full border border-white/20 px-7 py-3.5 font-bold transition hover:bg-white/10"
              >
                Ya soy cliente
              </Link>
            </div>
          </div>

          {/* Mock TV */}
          <div className="hero-tv relative mx-auto w-full max-w-md">
            <div className="rounded-3xl border-4 border-white/10 bg-gradient-to-br from-[#8e44ad] to-[#d81b60] p-4 shadow-2xl">
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-2">
                <span className="text-sm font-black uppercase tracking-tighter text-[#8e44ad]">
                  Chuchu <span className="text-[#d81b60]">| Tu Marca</span>
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#d81b60]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#d81b60]" /> EN VIVO
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/95 p-4">
                <span className="text-6xl">🍫</span>
                <span className="text-3xl">+</span>
                <span className="text-6xl">🥤</span>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-bold uppercase text-gray-400 line-through">$7.50</p>
                  <p className="text-3xl font-black text-[#d81b60]">$5.99</p>
                </div>
              </div>
              <p className="mt-3 text-center text-sm font-black uppercase tracking-wider text-[#fff176]">
                Combo Antojo Total
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="caracteristicas" className="px-5 py-20 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="reveal text-center text-4xl font-black tracking-tight md:text-5xl">
            Todo lo que tu negocio necesita
          </h2>
          <p className="reveal mx-auto mt-3 max-w-xl text-center text-white/60">
            Una plataforma, todas las herramientas para vender más dulce.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="reveal rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-[#f06292]/40 hover:bg-white/[0.07]"
              >
                <div className="text-4xl">{f.icon}</div>
                <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal text-center text-4xl font-black tracking-tight md:text-5xl">
            Empieza en 3 pasos
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="reveal relative rounded-2xl border border-white/10 bg-white/5 p-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#d81b60] to-[#8e44ad] text-2xl font-black">
                  {s.n}
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planes" className="px-5 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal text-center text-4xl font-black tracking-tight md:text-5xl">
            Planes simples
          </h2>
          <p className="reveal mx-auto mt-3 max-w-xl text-center text-white/60">
            Sin contratos. Activa, vende, crece.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Básico */}
            <div className="reveal flex flex-col rounded-3xl border-2 border-[#f06292]/40 bg-gradient-to-b from-white/[0.08] to-transparent p-8 shadow-xl">
              <p className="text-sm font-bold uppercase tracking-wider text-[#f06292]">{basic.name}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-5xl font-black">${basic.priceUsd}</span>
                <span className="mb-1 text-white/50">/mes</span>
              </div>
              {basicBs > 0 && (
                <p className="mt-1 text-xs text-white/50">
                  ≈ Bs {basicBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="mt-3 text-sm text-white/70">{basic.tagline}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {basic.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#4dd0e1]">✓</span>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/registro"
                className="mt-8 rounded-full bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3.5 text-center font-bold shadow-lg shadow-[#d81b60]/30 transition-transform hover:scale-[1.03] active:scale-95"
              >
                Empezar prueba gratis
              </Link>
              <p className="mt-2 text-center text-xs text-white/50">Luego puedes renovar mensual por $20.</p>
            </div>

            {/* Pro — próximamente */}
            <div className="reveal relative flex flex-col overflow-hidden rounded-3xl border-2 border-white/10 bg-white/[0.03] p-8">
              <span className="absolute right-5 top-5 rounded-full bg-[#fff176] px-3 py-1 text-xs font-black uppercase text-[#1a1024]">
                Próximamente
              </span>
              <p className="text-sm font-bold uppercase tracking-wider text-[#fff176]">{pro.name}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-5xl font-black">${pro.priceUsd}</span>
                <span className="mb-1 text-white/50">/mes</span>
              </div>
              <p className="mt-3 text-sm text-white/70">{pro.tagline}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#fff176]">★</span>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="mt-8 cursor-not-allowed rounded-full border border-white/15 py-3.5 font-bold text-white/40"
              >
                Disponible pronto
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-5 py-10 text-center text-sm text-white/40 md:px-10">
        <div className="relative mx-auto mb-3 h-10 w-10">
          <Image src="/Logo/Chuchu_logo.png" alt="Chuchu" fill sizes="40px" className="object-contain" />
        </div>
        <p>✨ Chuchu Smart Menu · Hecho para negocios dulces</p>
        <a
          href="https://www.instagram.com/chuchu_service/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold text-white/80 transition hover:border-[#f06292] hover:text-[#f06292]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.2 1 .46 1.4.86.4.4.66.8.86 1.4.17.4.36 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2-.2.6-.46 1-.86 1.4-.4.4-.8.66-1.4.86-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42-.6-.2-1-.46-1.4-.86-.4-.4-.66-.8-.86-1.4-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.2-.6.46-1 .86-1.4.4-.4.8-.66 1.4-.86.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-.9.04-1.4.2-1.7.32-.43.17-.74.37-1.06.7-.32.31-.52.62-.69 1.05-.12.3-.28.8-.32 1.7C3.2 8.5 3.2 8.9 3.2 12s0 3.5.07 4.7c.04.9.2 1.4.32 1.7.17.43.37.74.7 1.06.31.32.62.52 1.05.69.3.12.8.28 1.7.32 1.2.06 1.6.07 4.7.07s3.5 0 4.7-.07c.9-.04 1.4-.2 1.7-.32.43-.17.74-.37 1.06-.7.32-.31.52-.62.69-1.05.12-.3.28-.8.32-1.7.06-1.2.07-1.6.07-4.7s0-3.5-.07-4.7c-.04-.9-.2-1.4-.32-1.7a2.8 2.8 0 0 0-.7-1.06 2.8 2.8 0 0 0-1.05-.69c-.3-.12-.8-.28-1.7-.32C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.1-.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z" />
          </svg>
          @chuchu_service
        </a>
        <p className="mt-3">© {new Date().getFullYear()} Chuchu</p>
      </footer>
    </div>
  )
}
