'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { METHOD_LABEL } from '@/lib/plans'
import type { Company, Payment, PaymentMethod } from '@/lib/types'
import type { AccessInfo } from '@/lib/billing'
import { submitSubscriptionPayment, type SubscriptionState } from '../actions'
import SubmitButton from './SubmitButton'

const METHODS: PaymentMethod[] = ['binance', 'pagomovil', 'transferencia']

function fmtDate(input: string | number | null) {
  if (!input) return '—'
  return new Date(input).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Suscripcion({
  company,
  access,
  latestPayment,
}: {
  company: Company
  access: AccessInfo
  latestPayment: Payment | null
}) {
  const [method, setMethod] = useState<PaymentMethod>('binance')
  const [proofName, setProofName] = useState<string | null>(null)
  const [state, formAction] = useActionState(submitSubscriptionPayment, {} as SubscriptionState)

  useEffect(() => {
    if (state.success) toast.success(state.success)
    if (state.error) toast.error(state.error)
  }, [state.error, state.success])

  const statusMeta = useMemo(() => {
    if (access.state === 'paid') {
      return {
        title: '✅ Suscripción activa',
        note: `Tu acceso está activo hasta ${fmtDate(access.paidUntil)}.`,
        badge: `Vence ${fmtDate(access.paidUntil)}`,
        cls: 'bg-green-50 text-green-700 border-green-200',
      }
    }
    if (access.state === 'trial') {
      return {
        title: '🎁 Prueba gratis activa',
        note: `Te quedan ${access.daysLeft} día(s) de prueba.`,
        badge: `Hasta ${fmtDate(access.trialEnd)}`,
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
      }
    }
    if (access.state === 'expired') {
      return {
        title: '⛔ Prueba vencida',
        note: 'Registra un pago para reactivar tu acceso por 30 días.',
        badge: 'Cuenta vencida',
        cls: 'bg-red-50 text-red-700 border-red-200',
      }
    }
    return {
      title: '🚫 Cuenta desactivada por owner',
      note: 'Contacta al propietario para habilitar tu empresa.',
      badge: 'Desactivada',
      cls: 'bg-gray-100 text-gray-600 border-gray-300',
    }
  }, [access.daysLeft, access.paidUntil, access.state, access.trialEnd])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💳 Suscripción</h1>
        <p className="text-gray-500">Controla tu prueba, vigencia y renovaciones mensuales.</p>
      </div>

      <div className={`rounded-2xl border p-5 ${statusMeta.cls}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">{statusMeta.title}</p>
            <p className="text-sm opacity-90">{statusMeta.note}</p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">{statusMeta.badge}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 font-bold text-gray-800">Registrar pago mensual</h2>
          <p className="mb-4 text-sm text-gray-500">
            Envía tu comprobante. El owner lo valida y te suma +30 días.
          </p>

          <form action={formAction} className="space-y-3">
            <input type="hidden" name="plan" value="basic" />
            <input type="hidden" name="method" value={method} />

            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                    method === m
                      ? 'border-[#f06292] bg-[#f06292]/10 text-[#d81b60]'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {METHOD_LABEL[m]}
                </button>
              ))}
            </div>

            <input
              name="reference"
              required
              placeholder="Número de referencia"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
            />
            <input
              name="phone"
              placeholder="Teléfono (opcional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-[#f06292]">
              <span>📷</span>
              <span>{proofName ?? 'Sube la captura del pago'}</span>
              <input
                name="proof"
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={(e) => setProofName(e.target.files?.[0]?.name ?? null)}
              />
            </label>

            <SubmitButton
              pendingText="Enviando comprobante…"
              className="w-full rounded-xl bg-gradient-to-r from-[#8e44ad] to-[#d81b60] py-2.5 font-bold text-white disabled:opacity-50"
            >
              Enviar pago para validación
            </SubmitButton>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-bold text-gray-800">Estado de cuenta</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong className="text-gray-800">Empresa:</strong> {company.name}
            </p>
            <p>
              <strong className="text-gray-800">Prueba gratis:</strong> 5 días desde el registro
            </p>
            <p>
              <strong className="text-gray-800">Próximo corte:</strong>{' '}
              {access.paidUntil ? fmtDate(access.paidUntil) : fmtDate(access.trialEnd)}
            </p>
            <p>
              <strong className="text-gray-800">Último pago:</strong>{' '}
              {latestPayment ? `${fmtDate(latestPayment.created_at)} (${latestPayment.status})` : 'Sin pagos aún'}
            </p>
          </div>
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Cuando tu pago sea validado por el owner, Chuchu extiende tu vigencia automáticamente por 30 días.
          </p>
        </div>
      </div>
    </div>
  )
}
