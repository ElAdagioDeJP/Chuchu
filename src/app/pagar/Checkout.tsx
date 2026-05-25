'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PLANS, ACCOUNTS, METHOD_LABEL } from '@/lib/plans'
import { usdToBs } from '@/lib/dolar'
import type { Plan, PaymentMethod } from '@/lib/types'
import { submitPayment, type CheckoutState } from './actions'

gsap.registerPlugin(useGSAP)

const METHODS: PaymentMethod[] = ['binance', 'pagomovil', 'transferencia']
const METHOD_ICON: Record<PaymentMethod, string> = {
  binance: '🟡',
  pagomovil: '📱',
  transferencia: '🏦',
}

function Row({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-white/50">{label}</p>
        <p className="truncate font-semibold text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
      >
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function PayButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3.5 font-bold shadow-lg shadow-[#d81b60]/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
    >
      {pending ? 'Validando comprobante…' : 'Ya pagué, enviar comprobante'}
    </button>
  )
}

export default function Checkout({ plan, rate }: { plan: Plan; rate: number }) {
  const root = useRef<HTMLDivElement>(null)
  const [method, setMethod] = useState<PaymentMethod>('binance')
  const [proofName, setProofName] = useState<string | null>(null)
  const info = PLANS[plan]
  const amountBs = rate > 0 ? usdToBs(info.priceUsd, rate) : 0
  const amountLabel = method === 'binance' ? 'Monto enviado (USD)' : 'Monto enviado (Bs)'
  const amountPlaceholder =
    method === 'binance'
      ? `Ej: ${info.priceUsd}`
      : `Ej: ${amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`

  const [state, formAction] = useActionState(submitPayment, {} as CheckoutState)

  useGSAP(
    () => {
      gsap.from('.co-anim', { y: 24, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' })
    },
    { scope: root, dependencies: [state.success] }
  )

  if (state.success) {
    return (
      <div ref={root} className="flex min-h-screen items-center justify-center bg-[#1a1024] p-5 text-white">
        <div className="co-anim max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-6xl">🎉</p>
          <h1 className="mt-4 text-2xl font-black">¡Comprobante enviado!</h1>
          <p className="mt-3 text-white/70">{state.success}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/20"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={root} className="min-h-screen bg-[#1a1024] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="co-anim mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
          ← Volver
        </Link>

        {/* Plan summary */}
        <div className="co-anim flex items-center justify-between rounded-2xl border border-[#f06292]/40 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/Logo/Chuchu_logo.png" alt="Chuchu" fill sizes="40px" className="object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#f06292]">Plan {info.name}</p>
              <p className="text-sm text-white/60">Suscripción mensual</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">${info.priceUsd}</p>
            {amountBs > 0 && (
              <p className="text-xs text-white/50">
                ≈ Bs {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Method tabs */}
        <div className="co-anim mt-6 grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                method === m
                  ? 'border-[#f06292] bg-[#f06292]/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="mr-1">{METHOD_ICON[m]}</span>
              {METHOD_LABEL[m]}
            </button>
          ))}
        </div>

        {/* Method details */}
        <div className="co-anim mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          {method === 'binance' && (
            <>
              <p className="mb-2 text-sm text-white/60">
                Envía <b className="text-white">${info.priceUsd} USD</b> (USDT) a este correo Binance:
              </p>
              <Row label="Correo Binance" value={ACCOUNTS.binance.email} />
              <p className="mt-2 text-xs text-[#fff176]">{ACCOUNTS.binance.note}</p>
            </>
          )}
          {method === 'pagomovil' && (
            <>
              <p className="mb-2 text-sm text-white/60">
                Realiza un Pago Móvil por{' '}
                <b className="text-white">
                  Bs {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </b>{' '}
                {rate > 0 && <span className="text-white/40">(tasa Bs {rate})</span>}
              </p>
              <Row label="Teléfono" value={ACCOUNTS.pagomovil.phone} />
              <Row label="Banco" value={ACCOUNTS.pagomovil.bank} />
              <Row label="Cédula" value={ACCOUNTS.pagomovil.ci} />
            </>
          )}
          {method === 'transferencia' && (
            <>
              <p className="mb-2 text-sm text-white/60">
                Transfiere{' '}
                <b className="text-white">
                  Bs {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </b>{' '}
                {rate > 0 && <span className="text-white/40">(tasa Bs {rate})</span>}
              </p>
              <Row label="Banco" value={ACCOUNTS.transferencia.bank} />
              <Row label={ACCOUNTS.transferencia.rif} value={ACCOUNTS.transferencia.holder} />
              <Row label="Tipo de cuenta" value={ACCOUNTS.transferencia.accountType} />
              <Row label="Número de cuenta" value={ACCOUNTS.transferencia.account} />
              <Row label="Documento" value={ACCOUNTS.transferencia.ci} />
            </>
          )}
        </div>

        {/* Submit form */}
        <form action={formAction} className="co-anim mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold">Confirma tu pago</h2>
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="method" value={method} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Tu nombre"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-[#f06292]"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Tu correo"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-[#f06292]"
            />
            <input
              name="phone"
              placeholder="Teléfono (opcional)"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-[#f06292]"
            />
            <input
              name="reference"
              required
              placeholder="Número de referencia"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-[#f06292]"
            />
            <input
              name="paid_amount"
              required
              inputMode="decimal"
              placeholder={amountPlaceholder}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 outline-none placeholder:text-white/30 focus:border-[#f06292]"
            />
          </div>

          <p className="text-xs text-white/55">
            {amountLabel}: usa el monto exacto o muy cercano al que se muestra arriba segun la tasa actual.
          </p>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-white/15 bg-white/5 p-4 transition hover:border-[#f06292]/50">
            <span className="text-2xl">📷</span>
            <span className="text-sm text-white/70">
              {proofName ?? 'Sube la captura de tu pago'}
            </span>
            <input
              name="proof"
              type="file"
              accept="image/*"
              required
              className="hidden"
              onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          {state.error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300">
              {state.error}
            </p>
          )}

          <PayButton />
          <p className="text-center text-xs text-white/40">
            La IA hace una pre-revision del comprobante y envia alertas al owner para validacion final.
          </p>
        </form>
      </div>
    </div>
  )
}
