import type { PaymentMethod } from './types'
import type { PaymentProofAnalysis } from './gemini'

type Currency = 'USD' | 'Bs'

export interface ProofValidationInput {
  method: PaymentMethod
  expectedAmount: number | null
  expectedCurrency: Currency
  declaredAmount: number
  analysis: PaymentProofAnalysis
}

export interface ProofValidationResult {
  valid: boolean
  userMessage: string
  reason: string
  checks: {
    looksLikePayment: boolean
    methodMatch: boolean
    declaredAmountMatch: boolean
    imageAmountMatch: boolean | null
  }
}

function tolerance(expected: number, currency: Currency): number {
  if (currency === 'USD') {
    return Math.max(1, expected * 0.03)
  }
  return Math.max(180, expected * 0.04)
}

function nearlyEqual(a: number, b: number, allowedDelta: number): boolean {
  return Math.abs(a - b) <= allowedDelta
}

export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')

  const value = Number(cleaned)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function validatePaymentProof(input: ProofValidationInput): ProofValidationResult {
  const { analysis, method, expectedAmount, expectedCurrency, declaredAmount } = input

  if (!analysis.ok) {
    return {
      valid: false,
      reason: analysis.reason || 'imagen-no-valida',
      userMessage:
        'La imagen no parece un comprobante de pago valido. Sube una captura bancaria clara y completa.',
      checks: {
        looksLikePayment: false,
        methodMatch: false,
        declaredAmountMatch: false,
        imageAmountMatch: null,
      },
    }
  }

  const methodMatch = analysis.method === 'desconocido' ? false : analysis.method === method
  if (!methodMatch) {
    const methodLabel =
      method === 'pagomovil' ? 'Pago Movil' : method === 'transferencia' ? 'Transferencia' : 'Binance'

    return {
      valid: false,
      reason: analysis.reason || 'metodo-no-coincide',
      userMessage: `El comprobante no coincide con el metodo seleccionado (${methodLabel}). Verifica y vuelve a subir la captura correcta.`,
      checks: {
        looksLikePayment: true,
        methodMatch: false,
        declaredAmountMatch: false,
        imageAmountMatch: null,
      },
    }
  }

  let declaredAmountMatch = true
  let imageAmountMatch: boolean | null = null

  if (expectedAmount != null && expectedAmount > 0) {
    const allowed = tolerance(expectedAmount, expectedCurrency)
    declaredAmountMatch = nearlyEqual(declaredAmount, expectedAmount, allowed)
    if (!declaredAmountMatch) {
      return {
        valid: false,
        reason: 'monto-declarado-no-coincide',
        userMessage:
          'El monto que indicaste no coincide con el monto esperado para este plan y tasa actual. Revisa el monto antes de enviar.',
        checks: {
          looksLikePayment: true,
          methodMatch: true,
          declaredAmountMatch: false,
          imageAmountMatch: null,
        },
      }
    }

    if (analysis.amount != null) {
      const imageCurrencyMatches =
        analysis.currency === 'desconocido' ? true : analysis.currency === expectedCurrency

      const imageAllowed = tolerance(expectedAmount, expectedCurrency)
      imageAmountMatch =
        imageCurrencyMatches && nearlyEqual(analysis.amount, expectedAmount, imageAllowed)

      if (!imageAmountMatch) {
        return {
          valid: false,
          reason: analysis.reason || 'monto-imagen-no-coincide',
          userMessage:
            'El monto detectado en la imagen no coincide con el esperado. Asegurate de subir el comprobante correcto y legible.',
          checks: {
            looksLikePayment: true,
            methodMatch: true,
            declaredAmountMatch: true,
            imageAmountMatch: false,
          },
        }
      }
    }
  }

  return {
    valid: true,
    reason: analysis.reason || 'ok',
    userMessage: 'ok',
    checks: {
      looksLikePayment: true,
      methodMatch: true,
      declaredAmountMatch,
      imageAmountMatch,
    },
  }
}
