import 'server-only'

// Small, fast vision model — validates an uploaded image is a payment proof.
const MODEL = 'gemini-2.0-flash'

export type DetectedPaymentMethod = 'binance' | 'pagomovil' | 'transferencia' | 'desconocido'
export type DetectedCurrency = 'USD' | 'Bs' | 'desconocido'

export interface PaymentProofAnalysis {
  ok: boolean
  reason: string
  method: DetectedPaymentMethod
  amount: number | null
  currency: DetectedCurrency
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value !== 'string') return null

  const cleaned = value
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')

  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function isPaymentProof(
  base64: string,
  mimeType: string
): Promise<PaymentProofAnalysis> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return {
      ok: true,
      reason: 'sin-validacion',
      method: 'desconocido',
      amount: null,
      currency: 'desconocido',
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

  const prompt =
    'Eres un validador MUY ESTRICTO de comprobantes de pago en Venezuela. ' +
    'Analiza la imagen y responde SOLO un JSON válido, sin texto extra, con esta forma exacta: ' +
    '{"is_payment": boolean, "method": "binance|pagomovil|transferencia|desconocido", "amount": number|null, "currency": "USD|Bs|desconocido", "reason": "string corto"}. ' +
    'Reglas: 1) is_payment=true SOLO si es claramente comprobante/recibo/captura bancaria real. ' +
    '2) Si es chat, meme, foto ajena o captura no bancaria => is_payment=false. ' +
    '3) method=pagomovil solo si se ve estructura de pago movil (telefono origen/destino, banco emisor/receptor o campos tipicos de pago movil). ' +
    '4) method=transferencia solo si se ve transferencia bancaria entre cuentas (cuenta origen/debitada, beneficiario, banco destino, etc). ' +
    '5) method=binance solo si se ve interfaz Binance/P2P/Pay con datos de transferencia completada. ' +
    '6) Si no puedes determinar el metodo con seguridad, usa method="desconocido" y explica reason. ' +
    '7) amount debe ser el monto principal pagado (sin comision), o null si no es legible.'

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    })

    if (!res.ok) {
      return {
        ok: true,
        reason: 'validador-no-disponible',
        method: 'desconocido',
        amount: null,
        currency: 'desconocido',
      }
    }
    const data = await res.json()
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      '{"is_payment":true,"method":"desconocido","amount":null,"currency":"desconocido"}'
    const parsed = JSON.parse(text)

    const methodRaw = String(parsed?.method ?? 'desconocido')
    const currencyRaw = String(parsed?.currency ?? 'desconocido')
    const method: DetectedPaymentMethod =
      methodRaw === 'binance' || methodRaw === 'pagomovil' || methodRaw === 'transferencia'
        ? methodRaw
        : 'desconocido'
    const currency: DetectedCurrency = currencyRaw === 'USD' || currencyRaw === 'Bs' ? currencyRaw : 'desconocido'

    return {
      ok: parsed.is_payment === true,
      reason: String(parsed.reason ?? ''),
      method,
      amount: toNumberOrNull(parsed.amount),
      currency,
    }
  } catch {
    return {
      ok: true,
      reason: 'error-validador',
      method: 'desconocido',
      amount: null,
      currency: 'desconocido',
    }
  }
}
