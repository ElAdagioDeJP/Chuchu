'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { METHOD_LABEL, PLANS } from '@/lib/plans'
import type { Payment, PaymentStatus } from '@/lib/types'
import { setPaymentStatus } from './actions'

gsap.registerPlugin(useGSAP)

const STATUS: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  validated: { label: 'Validado', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PaymentsView({ payments }: { payments: Payment[] }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('.pay-head', { y: -16, opacity: 0, duration: 0.5, ease: 'power3.out' })
      gsap.from('.pay-row', { y: 16, opacity: 0, duration: 0.4, stagger: 0.05, delay: 0.1, ease: 'power2.out' })
    },
    { scope: root, dependencies: [payments.length] }
  )

  const totalUsd = payments
    .filter((p) => p.status === 'validated')
    .reduce((t, p) => t + Number(p.amount_usd), 0)
  const pending = payments.filter((p) => p.status === 'pending').length

  return (
    <div ref={root} className="space-y-6">
      <div className="pay-head flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">Pagos</h1>
          <p className="text-gray-500">Comprobantes de landing y renovaciones desde el panel admin.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-gradient-to-r from-[#8e44ad] to-[#d81b60] px-5 py-3 text-white shadow-lg">
            <p className="text-xs opacity-80">Validado (USD)</p>
            <p className="text-2xl font-black leading-none">${totalUsd.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
            <p className="text-xs text-amber-600">Pendientes</p>
            <p className="text-2xl font-black leading-none text-amber-700">{pending}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {payments.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Aún no hay pagos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 font-semibold">Comprobante</th>
                  <th className="p-3 font-semibold">Cliente</th>
                  <th className="p-3 font-semibold">Plan</th>
                  <th className="p-3 font-semibold">Método</th>
                  <th className="p-3 font-semibold">Monto</th>
                  <th className="p-3 font-semibold">Referencia</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold">Fecha</th>
                  <th className="p-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const st = STATUS[p.status] ?? STATUS.pending
                  return (
                    <tr key={p.id} className="pay-row border-b border-gray-100 align-top hover:bg-gray-50">
                      <td className="p-3">
                        {p.proof_url ? (
                          <a href={p.proof_url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.proof_url}
                              alt="comprobante"
                              className="h-16 w-16 rounded-lg border border-gray-200 object-cover transition hover:scale-105"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-gray-800">{p.buyer_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{p.buyer_email}</p>
                        {p.buyer_phone && <p className="text-xs text-gray-400">{p.buyer_phone}</p>}
                        {p.companies?.name && (
                          <p className="mt-1 text-xs font-medium text-[#8e44ad]">
                            Empresa: {p.companies.name}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-gray-700">{PLANS[p.plan]?.name ?? p.plan}</td>
                      <td className="p-3 text-gray-700">{METHOD_LABEL[p.method] ?? p.method}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-800">${Number(p.amount_usd).toFixed(2)}</p>
                        {p.amount_bs != null && (
                          <p className="text-xs text-gray-400">
                            Bs {Number(p.amount_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        {p.declared_amount != null && (
                          <p className="text-xs text-gray-500">
                            Declarado:{' '}
                            {p.expected_currency === 'USD'
                              ? `$${Number(p.declared_amount).toFixed(2)}`
                              : `Bs ${Number(p.declared_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                          </p>
                        )}
                        {p.ai_method && (
                          <p className="mt-1 text-xs text-gray-500">
                            IA: {p.ai_method}
                            {p.ai_method_match === false ? ' (no coincide)' : ''}
                          </p>
                        )}
                        {p.ai_reason && <p className="text-xs text-amber-600">{p.ai_reason}</p>}
                      </td>
                      <td className="p-3">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {p.reference ?? '—'}
                        </code>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{fmtDate(p.created_at)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          {p.status !== 'validated' && (
                            <form
                              action={async (fd) => {
                                await toast.promise(setPaymentStatus(fd), {
                                  loading: 'Validando pago…',
                                  success: 'Pago validado (+30 días aplicados)',
                                  error: 'No se pudo validar el pago',
                                })
                              }}
                            >
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="validated" />
                              <button
                                type="submit"
                                className="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200"
                              >
                                ✓ Validar
                              </button>
                            </form>
                          )}
                          {p.status !== 'rejected' && (
                            <form
                              action={async (fd) => {
                                await toast.promise(setPaymentStatus(fd), {
                                  loading: 'Marcando pago como rechazado…',
                                  success: 'Pago rechazado',
                                  error: 'No se pudo actualizar el pago',
                                })
                              }}
                            >
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <button
                                type="submit"
                                className="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                              >
                                ✕
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
