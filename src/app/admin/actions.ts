'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchProductImage } from '@/lib/productImage'
import { getDolarParalelo, usdToBs } from '@/lib/dolar'
import { isPaymentProof } from '@/lib/gemini'
import { sendPaymentTelegram } from '@/lib/telegram'
import { PLANS, METHOD_LABEL } from '@/lib/plans'
import type { Plan, PaymentMethod, PaymentStatus } from '@/lib/types'

function parseRate(formData: FormData) {
  const raw = String(formData.get('rate_mode') || '').trim()
  const rate_mode = ['binance', 'bcv', 'euro', 'custom'].includes(raw) ? raw : null
  const customRaw = Number(formData.get('custom_rate') || 0)
  const custom_rate = rate_mode === 'custom' && customRaw > 0 ? customRaw : null
  return { rate_mode, custom_rate }
}

// Upload a product image (uploaded file, else best-effort auto-fetch by name).
async function resolveProductImage(
  companyId: string,
  name: string,
  image: File | null
): Promise<string | null> {
  const admin = createAdminClient()
  if (image && image.size > 0 && image.type.startsWith('image/')) {
    const ext = (image.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${companyId}/${Date.now()}.${ext}`
    const { error } = await admin.storage
      .from('products')
      .upload(path, image, { contentType: image.type, upsert: true })
    if (!error) return admin.storage.from('products').getPublicUrl(path).data.publicUrl
    return null
  }
  // Auto-fetch a themed image
  const fetched = await fetchProductImage(name)
  if (fetched) {
    const path = `${companyId}/auto-${Date.now()}.jpg`
    const { error } = await admin.storage
      .from('products')
      .upload(path, fetched.bytes, { contentType: fetched.contentType, upsert: true })
    if (!error) return admin.storage.from('products').getPublicUrl(path).data.publicUrl
  }
  return null
}

async function ctx() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) throw new Error('Sin empresa asignada')
  return { supabase, companyId: profile.company_id as string }
}

// ---------- Categories ----------
export async function createCategory(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const name = String(formData.get('name') || '').trim()
  if (!name) return
  const emoji = String(formData.get('emoji') || '🏷️').trim() || '🏷️'
  await supabase.from('categories').insert({ company_id: companyId, name, emoji })
  revalidatePath('/admin')
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  if (!id) return
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/admin')
}

/** Assign (or clear, when categoryId is empty) a category on a single product. */
export async function assignCategory(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const productId = String(formData.get('productId') || '')
  if (!productId) return
  const categoryId = String(formData.get('categoryId') || '').trim() || null
  await supabase.from('products').update({ category_id: categoryId }).eq('id', productId)
  revalidatePath('/admin')
}

// ---------- Products ----------
export async function addProduct(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const name = String(formData.get('name') || '').trim()
  if (!name) return
  const price = Number(formData.get('price') || 0)
  const stock = parseInt(String(formData.get('stock') || '0'), 10) || 0
  const emoji = String(formData.get('emoji') || '🍬').trim() || '🍬'
  const expires_at = String(formData.get('expires_at') || '').trim() || null
  const category_id = String(formData.get('category_id') || '').trim() || null
  const { rate_mode, custom_rate } = parseRate(formData)

  const image = formData.get('image') as File | null
  const image_url = await resolveProductImage(companyId, name, image)

  await supabase.from('products').insert({
    company_id: companyId,
    name,
    price,
    stock,
    emoji,
    image_url,
    expires_at,
    rate_mode,
    custom_rate,
    category_id,
  })
  revalidatePath('/admin')
}

export async function updateProduct(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  if (!id || !name) return
  const price = Number(formData.get('price') || 0)
  const stock = Math.max(0, parseInt(String(formData.get('stock') || '0'), 10) || 0)
  const emoji = String(formData.get('emoji') || '🍬').trim() || '🍬'
  const expires_at = String(formData.get('expires_at') || '').trim() || null
  const category_id = String(formData.get('category_id') || '').trim() || null
  const { rate_mode, custom_rate } = parseRate(formData)

  const patch: Record<string, unknown> = {
    name,
    price,
    stock,
    emoji,
    expires_at,
    category_id,
    rate_mode,
    custom_rate,
  }

  // Only replace the image if a new one was uploaded.
  const image = formData.get('image') as File | null
  if (image && image.size > 0 && image.type.startsWith('image/')) {
    const url = await resolveProductImage(companyId, name, image)
    if (url) patch.image_url = url
  }

  await supabase.from('products').update(patch).eq('id', id)
  revalidatePath('/admin')
}

export async function toggleProductActive(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  const next = String(formData.get('next') || '') === 'true'
  if (!id) return
  await supabase.from('products').update({ active: next }).eq('id', id)
  revalidatePath('/admin')
}

export async function updateStock(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  const stock = Math.max(0, parseInt(String(formData.get('stock') || '0'), 10) || 0)
  if (!id) return
  await supabase.from('products').update({ stock }).eq('id', id)
  revalidatePath('/admin')
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  if (!id) return
  await supabase.from('products').delete().eq('id', id)
  revalidatePath('/admin')
}

/** Quick sell: record a sale and decrement stock ("bajar inventario"). */
export async function recordSale(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const productId = String(formData.get('productId') || '')
  if (!productId) return
  const { data: product } = await supabase
    .from('products')
    .select('price, stock')
    .eq('id', productId)
    .single()
  if (!product || product.stock <= 0) return
  await supabase.from('sales').insert({
    company_id: companyId,
    product_id: productId,
    qty: 1,
    unit_price: product.price,
  })
  await supabase
    .from('products')
    .update({ stock: product.stock - 1 })
    .eq('id', productId)
  revalidatePath('/admin')
}

// ---------- Combos ----------
export async function createCombo(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const name = String(formData.get('name') || '').trim()
  const priceOffer = Number(formData.get('priceOffer') || 0)
  const productIds = formData.getAll('productIds').map(String).filter(Boolean)
  if (!name || productIds.length < 2 || !priceOffer) return

  const { data: prods } = await supabase
    .from('products')
    .select('price')
    .in('id', productIds)
  const originalPrice = (prods ?? []).reduce((t, p) => t + Number(p.price), 0)

  const { data: combo } = await supabase
    .from('combos')
    .insert({
      company_id: companyId,
      name,
      price_offer: priceOffer,
      original_price: originalPrice,
    })
    .select()
    .single()
  if (!combo) return

  await supabase
    .from('combo_items')
    .insert(productIds.map((pid) => ({ combo_id: combo.id, product_id: pid })))
  revalidatePath('/admin')
}

export async function updateCombo(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const priceOffer = Number(formData.get('priceOffer') || 0)
  const productIds = formData.getAll('productIds').map(String).filter(Boolean)
  if (!id || !name || productIds.length < 2 || !priceOffer) return

  const { data: prods } = await supabase
    .from('products')
    .select('price')
    .in('id', productIds)
  const originalPrice = (prods ?? []).reduce((t, p) => t + Number(p.price), 0)

  await supabase
    .from('combos')
    .update({ name, price_offer: priceOffer, original_price: originalPrice })
    .eq('id', id)
  await supabase.from('combo_items').delete().eq('combo_id', id)
  await supabase
    .from('combo_items')
    .insert(productIds.map((pid) => ({ combo_id: id, product_id: pid })))
  revalidatePath('/admin')
}

export async function toggleComboTv(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  const next = String(formData.get('next') || '') === 'true'
  if (!id) return
  await supabase.from('combos').update({ on_tv: next }).eq('id', id)
  revalidatePath('/admin')
}

export async function deleteCombo(formData: FormData): Promise<void> {
  const { supabase } = await ctx()
  const id = String(formData.get('id') || '')
  if (!id) return
  await supabase.from('combos').delete().eq('id', id)
  revalidatePath('/admin')
}

/** Sell a combo: record sale and decrement each member product's stock. */
export async function sellCombo(formData: FormData): Promise<void> {
  const { supabase, companyId } = await ctx()
  const comboId = String(formData.get('comboId') || '')
  if (!comboId) return

  const { data: combo } = await supabase
    .from('combos')
    .select('price_offer, combo_items(product_id)')
    .eq('id', comboId)
    .single()
  if (!combo) return

  await supabase.from('sales').insert({
    company_id: companyId,
    combo_id: comboId,
    qty: 1,
    unit_price: combo.price_offer,
  })

  const items = (combo.combo_items as { product_id: string }[]) ?? []
  for (const it of items) {
    const { data: p } = await supabase
      .from('products')
      .select('stock')
      .eq('id', it.product_id)
      .single()
    if (p) {
      await supabase
        .from('products')
        .update({ stock: Math.max(0, p.stock - 1) })
        .eq('id', it.product_id)
    }
  }
  revalidatePath('/admin')
}

// ---------- Company settings ----------
export async function updateCompany(formData: FormData): Promise<void> {
  const { companyId } = await ctx()
  const name = String(formData.get('name') || '').trim()
  const logo = formData.get('logo') as File | null

  const patch: {
    name?: string
    logo_url?: string
    rate_mode?: string
    custom_rate?: number | null
  } = {}
  if (name) patch.name = name

  const rateModeRaw = String(formData.get('rate_mode') || '').trim()
  if (['binance', 'bcv', 'euro', 'custom'].includes(rateModeRaw)) {
    patch.rate_mode = rateModeRaw
    const customRaw = Number(formData.get('custom_rate') || 0)
    patch.custom_rate = rateModeRaw === 'custom' && customRaw > 0 ? customRaw : null
  }

  // Use the service-role client (scoped by the authenticated company id).
  // companies has no UPDATE RLS policy, so the user client would be denied.
  const admin = createAdminClient()

  if (logo && logo.size > 0) {
    const ext = (logo.name.split('.').pop() || 'png').toLowerCase()
    const path = `company-${companyId}-${Date.now()}.${ext}`
    const { error } = await admin.storage
      .from('logos')
      .upload(path, logo, { contentType: logo.type, upsert: true })
    if (!error) {
      patch.logo_url = admin.storage.from('logos').getPublicUrl(path).data.publicUrl
    }
  }

  if (Object.keys(patch).length > 0) {
    await admin.from('companies').update(patch).eq('id', companyId)
  }
  revalidatePath('/admin')
}

// ---------- Subscription (in-app payment) ----------
export type SubscriptionState = { error?: string; success?: string }

const PAY_METHODS: PaymentMethod[] = ['binance', 'pagomovil', 'transferencia']

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * A logged-in admin registers a subscription payment for their own company.
 * Mirrors the landing checkout but ties the payment to company_id so the owner
 * can validate it and extend the company's paid_until.
 */
export async function submitSubscriptionPayment(
  _prev: SubscriptionState,
  formData: FormData
): Promise<SubscriptionState> {
  const { supabase, companyId } = await ctx()

  const plan = String(formData.get('plan') || 'basic') as Plan
  const method = String(formData.get('method') || '') as PaymentMethod
  const reference = String(formData.get('reference') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const proof = formData.get('proof') as File | null

  if (!PLANS[plan]) return { error: 'Plan inválido.' }
  if (!PAY_METHODS.includes(method)) return { error: 'Método de pago inválido.' }
  if (!reference) return { error: 'Indica el número de referencia del pago.' }
  if (!proof || proof.size === 0) return { error: 'Sube la captura de tu pago.' }
  if (!proof.type.startsWith('image/')) return { error: 'El comprobante debe ser una imagen.' }
  if (proof.size > 8 * 1024 * 1024) return { error: 'La imagen es muy grande (máx 8MB).' }

  // Identify the buyer from the company + logged-in user.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()
  const buyerName = (company?.name as string) || 'Empresa'
  const buyerEmail = user?.email ?? null

  const bytes = await proof.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const check = await isPaymentProof(base64, proof.type)
  const status: PaymentStatus = check.ok ? 'pending' : 'rejected'

  const admin = createAdminClient()

  const ext = (proof.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${companyId}/sub-${Date.now()}.${ext}`
  const { error: upErr } = await admin.storage
    .from('payments')
    .upload(path, proof, { contentType: proof.type, upsert: true })
  if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` }
  const proofUrl = admin.storage.from('payments').getPublicUrl(path).data.publicUrl

  const amountUsd = PLANS[plan].priceUsd
  const rate = await getDolarParalelo()
  const amountBs = rate > 0 ? usdToBs(amountUsd, rate) : null

  const { error: insErr } = await admin.from('payments').insert({
    company_id: companyId,
    plan,
    amount_usd: amountUsd,
    amount_bs: amountBs,
    dolar_rate: rate || null,
    method,
    reference,
    proof_url: proofUrl,
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    buyer_phone: phone || null,
    status,
  })
  if (insErr) return { error: `No se pudo registrar el pago: ${insErr.message}` }

  const bsLine =
    method === 'binance'
      ? `💵 Monto: <b>$${amountUsd} USD</b>`
      : `💵 Monto: <b>$${amountUsd}</b>${amountBs ? ` ≈ <b>Bs ${amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</b>` : ''}`

  const caption = [
    '<b>🔁 RENOVACIÓN DE SUSCRIPCIÓN</b>',
    '━━━━━━━━━━━━━━━',
    `🏪 Empresa: <b>${escapeHtml(buyerName)}</b>`,
    `🏷 Plan: <b>${escapeHtml(PLANS[plan].name)}</b>`,
    `💳 Método: <b>${METHOD_LABEL[method]}</b>`,
    bsLine,
    `🔖 Referencia: <code>${escapeHtml(reference)}</code>`,
    buyerEmail ? `✉️ ${escapeHtml(buyerEmail)}` : '',
    phone ? `📱 ${escapeHtml(phone)}` : '',
    `🕒 ${new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })}`,
    `📌 Estado: <b>${status === 'rejected' ? '❌ RECHAZADO por IA' : '🕓 Pendiente'}</b>`,
    '',
    '⚠️ <i>Valida el pago en el panel para sumar 30 días a la empresa.</i>',
  ]
    .filter(Boolean)
    .join('\n')

  await sendPaymentTelegram({
    bytes,
    filename: `sub-${path.replace(/\//g, '-')}`,
    mimeType: proof.type,
    caption,
  })

  revalidatePath('/admin')
  return {
    success:
      '¡Pago enviado! Lo validaremos pronto y tu cuenta seguirá activa. Gracias por confiar en Chuchu.',
  }
}
