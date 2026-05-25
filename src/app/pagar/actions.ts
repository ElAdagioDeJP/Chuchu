'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getDolarParalelo, usdToBs } from '@/lib/dolar'
import { isPaymentProof } from '@/lib/gemini'
import {
  getOwnerAlertLevel,
  getOwnerAlertText,
  parseMoneyInput,
  validatePaymentProof,
} from '@/lib/payment-validation'
import { sendPaymentTelegram } from '@/lib/telegram'
import { PLANS, METHOD_LABEL } from '@/lib/plans'
import type { Plan, PaymentMethod } from '@/lib/types'

export type CheckoutState = { error?: string; success?: string }

const METHODS: PaymentMethod[] = ['binance', 'pagomovil', 'transferencia']

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function submitPayment(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const plan = String(formData.get('plan') || '') as Plan
  const method = String(formData.get('method') || '') as PaymentMethod
  const reference = String(formData.get('reference') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const paidAmountRaw = String(formData.get('paid_amount') || '').trim()
  const proof = formData.get('proof') as File | null

  if (!PLANS[plan]) return { error: 'Plan inválido.' }
  if (!METHODS.includes(method)) return { error: 'Método de pago inválido.' }
  if (!name || !email) return { error: 'Indica tu nombre y correo.' }
  if (!reference) return { error: 'Indica el número de referencia del pago.' }
  const paidAmount = parseMoneyInput(paidAmountRaw)
  if (!paidAmount) return { error: 'Indica el monto pagado con un formato válido.' }
  if (!proof || proof.size === 0) return { error: 'Sube la captura de tu pago.' }
  if (!proof.type.startsWith('image/')) return { error: 'El comprobante debe ser una imagen.' }
  if (proof.size > 8 * 1024 * 1024) return { error: 'La imagen es muy grande (máx 8MB).' }

  const bytes = await proof.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  // 1) Amounts and strict validation
  const amountUsd = PLANS[plan].priceUsd
  const rate = await getDolarParalelo()
  const amountBs = rate > 0 ? usdToBs(amountUsd, rate) : null

  const check = await isPaymentProof(base64, proof.type)
  const validation = validatePaymentProof({
    method,
    expectedAmount: method === 'binance' ? amountUsd : amountBs,
    expectedCurrency: method === 'binance' ? 'USD' : 'Bs',
    declaredAmount: paidAmount,
    analysis: check,
  })
  const ownerAlertLevel = getOwnerAlertLevel(validation)
  const ownerAlertText = getOwnerAlertText(ownerAlertLevel)

  const admin = createAdminClient()

  // 2) Upload proof
  const ext = (proof.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${plan}-${Date.now()}.${ext}`
  const { error: upErr } = await admin.storage
    .from('payments')
    .upload(path, proof, { contentType: proof.type, upsert: true })
  if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` }
  const proofUrl = admin.storage.from('payments').getPublicUrl(path).data.publicUrl

  // 3) Persist
  const { error: insErr } = await admin.from('payments').insert({
    plan,
    amount_usd: amountUsd,
    amount_bs: amountBs,
    dolar_rate: rate || null,
    declared_amount: paidAmount,
    expected_amount: method === 'binance' ? amountUsd : amountBs,
    expected_currency: method === 'binance' ? 'USD' : 'Bs',
    ai_is_payment: check.ok,
    ai_method: check.method,
    ai_amount: check.amount,
    ai_currency: check.currency,
    ai_reason: check.reason || null,
    ai_method_match: validation.checks.methodMatch,
    ai_amount_match: validation.checks.imageAmountMatch,
    ai_alert_level: ownerAlertLevel,
    method,
    reference,
    proof_url: proofUrl,
    buyer_name: name,
    buyer_email: email,
    buyer_phone: phone || null,
    status: 'pending',
  })
  if (insErr) return { error: `No se pudo registrar el pago: ${insErr.message}` }

  // 4) Notify via Telegram
  const bsLine =
    method === 'binance'
      ? `💵 Monto: <b>$${amountUsd} USD</b>`
      : `💵 Monto: <b>$${amountUsd}</b>${amountBs ? ` ≈ <b>Bs ${amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</b>` : ''}`

  const declaredLine =
    method === 'binance'
      ? `🧾 Monto declarado: <b>$${paidAmount.toFixed(2)} USD</b>`
      : `🧾 Monto declarado: <b>Bs ${paidAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</b>`

  const caption = [
    '<b>💰 NUEVO PAGO RECIBIDO</b>',
    '━━━━━━━━━━━━━━━',
    `🏷 Plan: <b>${esc(PLANS[plan].name)}</b>`,
    `💳 Método: <b>${METHOD_LABEL[method]}</b>`,
    bsLine,
    declaredLine,
    `🔖 Referencia: <code>${esc(reference)}</code>`,
    '👤 Cliente:',
    `   • ${esc(name)}`,
    `   • ✉️ ${esc(email)}`,
    phone ? `   • 📱 ${esc(phone)}` : '',
    `🕒 ${new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`,
    `🤖 IA: <b>${esc(check.method)}</b>${check.amount ? ` · ${check.currency} ${check.amount}` : ''}`,
    `🚦 Alerta IA: <b>${esc(ownerAlertText)}</b>`,
    check.reason ? `🧠 Nota IA: ${esc(check.reason)}` : '',
    '📌 Estado: <b>🕓 Pendiente</b>',
    '',
    '⚠️ <i>Verifica el comprobante antes de activar.</i>',
  ]
    .filter(Boolean)
    .join('\n')

  await sendPaymentTelegram({
    bytes,
    filename: `pago-${path}`,
    mimeType: proof.type,
    caption,
  })

  return {
    success:
      '¡Pago enviado! Tu comprobante fue recibido y sera revisado por el owner para activar tu cuenta.',
  }
}
