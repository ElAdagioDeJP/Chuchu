export type Role = 'owner' | 'admin'

// How a price is shown on the TV / monitor
export type RateMode = 'binance' | 'bcv' | 'euro' | 'custom'

// Inventory rotation classification
export type RotationStatus = 'nuevo' | 'rapido' | 'lento'

export type Plan = 'basic' | 'pro'
export type PaymentMethod = 'binance' | 'pagomovil' | 'transferencia'
export type PaymentStatus = 'pending' | 'validated' | 'rejected'

export interface Payment {
  id: string
  company_id: string | null
  plan: Plan
  amount_usd: number
  amount_bs: number | null
  dolar_rate: number | null
  declared_amount: number | null
  expected_amount: number | null
  expected_currency: 'USD' | 'Bs' | null
  ai_is_payment: boolean | null
  ai_method: PaymentMethod | 'desconocido' | null
  ai_amount: number | null
  ai_currency: 'USD' | 'Bs' | 'desconocido' | null
  ai_reason: string | null
  ai_method_match: boolean | null
  ai_amount_match: boolean | null
  method: PaymentMethod
  reference: string | null
  proof_url: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  status: PaymentStatus
  created_at: string
  companies?: {
    name: string
    slug: string
    paid_until: string | null
  } | null
}

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  active: boolean
  rate_mode: RateMode
  custom_rate: number | null
  paid_until: string | null // ISO; null = never paid. Drives subscription access.
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  role: Role
  company_id: string | null
  created_at: string
}

export interface Category {
  id: string
  company_id: string
  name: string
  emoji: string | null
  created_at: string
}

export interface Product {
  id: string
  company_id: string
  name: string
  price: number
  stock: number
  emoji: string | null
  image_url: string | null
  expires_at: string | null
  rate_mode: RateMode | null
  custom_rate: number | null
  active: boolean
  category_id: string | null
  created_at: string
}

export interface ComboItem {
  combo_id: string
  product_id: string
}

export interface Combo {
  id: string
  company_id: string
  name: string
  description: string | null
  price_offer: number
  original_price: number
  on_tv: boolean
  created_at: string
  combo_items?: { product_id: string }[]
  products?: Product[]
}

export interface Sale {
  id: string
  company_id: string
  product_id: string | null
  combo_id: string | null
  qty: number
  unit_price: number
  sold_at: string
}

export interface ProductWithVelocity extends Product {
  velocity: number
  status: RotationStatus
  ageDays: number
  daysToExpiry: number | null
  nearExpiry: boolean
}

export interface ComboItemView {
  id: string
  name: string
  emoji: string | null
  image_url: string | null
  stock: number
  price: number
}

export interface ComboView {
  id: string
  name: string
  price_offer: number
  original_price: number
  on_tv: boolean
  items: ComboItemView[]
}

export interface AdminStats {
  ventasHoy: number
  ventasSemana: number
  combosVendidos: number
  efectoChuchu: number
  ventasRegulares: number
}

// Output of the inventory-rotation algorithm
export interface ComboSuggestion {
  fast: ProductWithVelocity
  slow: ProductWithVelocity
  originalPrice: number
  suggestedPrice: number
  discountPct: number
  reason: string
}
