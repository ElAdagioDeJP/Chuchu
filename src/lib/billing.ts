import type { Company } from './types'

export const TRIAL_DAYS = 5 // free trial length from account creation
export const BILLING_DAYS = 30 // each validated payment grants this many days
const DAY = 86_400_000

export type AccessState = 'trial' | 'paid' | 'expired' | 'disabled'

export interface AccessInfo {
  /** Whether the tenant can use the app right now. */
  active: boolean
  state: AccessState
  /** Whole days remaining for the current window (trial or paid). 0 if none. */
  daysLeft: number
  trialEnd: number // ms epoch
  paidUntil: number | null // ms epoch
}

type BillingFields = Pick<Company, 'active' | 'created_at' | 'paid_until'>

/**
 * Resolve a tenant's access window.
 * Priority: owner kill-switch (active=false) > active paid period > trial > expired.
 * A paid subscription extends access beyond the trial; once it lapses with no
 * paid time left and the trial is over, access is "expired" (paywall, not banned).
 */
export function getAccess(company: BillingFields): AccessInfo {
  const now = Date.now()
  const trialEnd = new Date(company.created_at).getTime() + TRIAL_DAYS * DAY
  const paidUntil = company.paid_until ? new Date(company.paid_until).getTime() : null

  if (!company.active) {
    return { active: false, state: 'disabled', daysLeft: 0, trialEnd, paidUntil }
  }
  if (paidUntil && paidUntil > now) {
    return {
      active: true,
      state: 'paid',
      daysLeft: Math.ceil((paidUntil - now) / DAY),
      trialEnd,
      paidUntil,
    }
  }
  if (now < trialEnd) {
    return {
      active: true,
      state: 'trial',
      daysLeft: Math.ceil((trialEnd - now) / DAY),
      trialEnd,
      paidUntil,
    }
  }
  return { active: false, state: 'expired', daysLeft: 0, trialEnd, paidUntil }
}

/**
 * Next paid_until after validating one payment: extend from whichever is later,
 * now or the current paid_until, so consecutive payments stack.
 */
export function extendPaidUntil(current: string | null): string {
  const now = Date.now()
  const base = current ? Math.max(now, new Date(current).getTime()) : now
  return new Date(base + BILLING_DAYS * DAY).toISOString()
}
