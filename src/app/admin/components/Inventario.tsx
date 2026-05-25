'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import {
  addProduct,
  updateStock,
  deleteProduct,
  toggleProductActive,
} from '../actions'
import type {
  Category,
  Company,
  ProductWithVelocity,
  RateMode,
  RotationStatus,
} from '@/lib/types'
import { type Rates, convertPrice, formatConverted, resolveRate, RATE_LABEL } from '@/lib/rates'
import SubmitButton from './SubmitButton'
import ProductEditModal from './ProductEditModal'
import CategoryManagerModal from './CategoryManagerModal'
import { confirmToast } from '@/lib/confirmToast'

gsap.registerPlugin(useGSAP)

const STATUS_TAG: Record<RotationStatus, { label: string; cls: string }> = {
  nuevo: { label: '🆕 Nuevo', cls: 'bg-blue-100 text-blue-700' },
  rapido: { label: '🚀 Rápido', cls: 'bg-green-100 text-green-700' },
  lento: { label: '🐢 Lento', cls: 'bg-orange-100 text-orange-700' },
}

function expiryTag(days: number | null) {
  if (days === null) return null
  if (days < 0) return { label: '⛔ Vencido', cls: 'bg-red-100 text-red-700' }
  if (days <= 7) return { label: `⏰ ${days}d`, cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `⏳ ${days}d`, cls: 'bg-amber-100 text-amber-700' }
  return { label: `${days}d`, cls: 'bg-gray-100 text-gray-500' }
}

interface Props {
  products: ProductWithVelocity[]
  company: Company
  rates: Rates
  categories: Category[]
}

type ExpiryFilter = 'all' | 'expired' | 'soon7' | 'soon30' | 'none'
type ActiveFilter = 'all' | 'active' | 'inactive'

export default function Inventario({ products, company, rates, categories }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [rateMode, setRateMode] = useState<'' | RateMode>('')
  const [editing, setEditing] = useState<ProductWithVelocity | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Filters
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | RotationStatus>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')

  const catMap = useMemo(() => {
    const m = new Map<string, Category>()
    categories.forEach((c) => m.set(c.id, c))
    return m
  }, [categories])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return products.filter((p) => {
      if (term) {
        const cat = p.category_id ? catMap.get(p.category_id)?.name ?? '' : ''
        const hay = `${p.name} ${p.emoji ?? ''} ${cat} ${p.price}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      if (catFilter !== 'all') {
        if (catFilter === 'none' ? p.category_id : p.category_id !== catFilter) return false
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (activeFilter === 'active' && !p.active) return false
      if (activeFilter === 'inactive' && p.active) return false
      if (expiryFilter !== 'all') {
        const d = p.daysToExpiry
        if (expiryFilter === 'none' && d !== null) return false
        if (expiryFilter === 'expired' && !(d !== null && d < 0)) return false
        if (expiryFilter === 'soon7' && !(d !== null && d >= 0 && d <= 7)) return false
        if (expiryFilter === 'soon30' && !(d !== null && d >= 0 && d <= 30)) return false
      }
      return true
    })
  }, [products, q, catFilter, statusFilter, activeFilter, expiryFilter, catMap])

  useGSAP(
    () => {
      gsap.from('.inv-row', { x: -12, opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' })
    },
    { scope: root, dependencies: [filtered.length] }
  )

  const inputCls =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]'

  return (
    <div ref={root} className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-800">📦 Inventario</h1>
          <p className="text-gray-500">Busca, filtra, edita y organiza tus productos.</p>
        </div>
      </div>

      {/* Add product card */}
      <form
        ref={formRef}
        action={async (fd) => {
          await toast.promise(addProduct(fd), {
            loading: 'Creando producto…',
            success: 'Producto creado',
            error: 'No se pudo crear el producto',
          })
          formRef.current?.reset()
          setPreview(null)
          setRateMode('')
        }}
        className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-[#8e44ad]/5 to-[#f06292]/5 px-5 py-3">
          <span className="text-lg">✨</span>
          <h2 className="font-bold text-gray-800">Nuevo producto</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[auto_1fr]">
          <div className="flex gap-3">
            <label className="group relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#f06292] hover:bg-[#f06292]/5">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="mt-1 text-xs font-medium text-gray-400 group-hover:text-[#f06292]">
                    Foto (auto)
                  </span>
                </>
              )}
              <input
                name="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setPreview(f ? URL.createObjectURL(f) : null)
                }}
              />
            </label>
            <div className="flex flex-col items-center gap-1">
              <input
                name="emoji"
                maxLength={2}
                defaultValue="🍬"
                aria-label="Emoji"
                className="h-16 w-16 rounded-2xl border border-gray-300 text-center text-3xl outline-none focus:ring-2 focus:ring-[#f06292]"
              />
              <span className="text-[10px] text-gray-400">Emoji</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-4">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                🏷️ Crear categorías ({categories.length})
              </button>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre</label>
              <input name="name" required placeholder="Ej: Chocolate Savoy" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Precio (USD)</label>
              <input name="price" type="number" step="0.01" required placeholder="0.00" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Stock</label>
              <input name="stock" type="number" required placeholder="0" className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Vencimiento</label>
              <input name="expires_at" type="date" aria-label="Vencimiento" className={`${inputCls} w-full text-gray-600`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Asignar categoría</label>
              <select name="category_id" aria-label="Categoría" className={`${inputCls} w-full text-gray-600`}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Tasa en TV</label>
              <select
                name="rate_mode"
                aria-label="Tasa en TV"
                value={rateMode}
                onChange={(e) => setRateMode(e.target.value as RateMode | '')}
                className={`${inputCls} w-full text-gray-600`}
              >
                <option value="">Heredar ({RATE_LABEL[company.rate_mode]})</option>
                <option value="binance">Binance</option>
                <option value="bcv">BCV</option>
                <option value="euro">Euro</option>
                <option value="custom">Tasa propia</option>
              </select>
            </div>
            {rateMode === 'custom' && (
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Bs por USD</label>
                <input name="custom_rate" type="number" step="0.01" placeholder="Ej: 40.00" className={`${inputCls} w-full`} />
              </div>
            )}
            <div className="col-span-2 sm:col-span-4">
              <SubmitButton
                pendingText="Agregando (buscando foto)…"
                className="w-full rounded-lg bg-gradient-to-r from-[#8e44ad] to-[#d81b60] py-2.5 font-bold text-white transition hover:shadow-lg disabled:opacity-50"
              >
                + Agregar producto
              </SubmitButton>
            </div>
          </div>
        </div>
        <p className="border-t border-gray-100 px-5 py-2 text-xs text-gray-400">
          💡 Si no subes foto, se busca una automáticamente por el nombre. El emoji es el respaldo.
        </p>
      </form>

      {/* Search + filters */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Buscar por nombre, categoría, precio…"
          className={`${inputCls} lg:col-span-2`}
          aria-label="Buscar"
        />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Categoría" className={inputCls}>
          <option value="all">Todas las categorías</option>
          <option value="none">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | RotationStatus)} aria-label="Rotación" className={inputCls}>
          <option value="all">Toda rotación</option>
          <option value="nuevo">🆕 Nuevo</option>
          <option value="rapido">🚀 Rápido</option>
          <option value="lento">🐢 Lento</option>
        </select>
        <select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)} aria-label="Vencimiento" className={inputCls}>
          <option value="all">Todo vencimiento</option>
          <option value="expired">⛔ Vencidos</option>
          <option value="soon7">⏰ ≤ 7 días</option>
          <option value="soon30">⏳ ≤ 30 días</option>
          <option value="none">Sin fecha</option>
        </select>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)} aria-label="Estado" className={inputCls}>
          <option value="all">Activos e inactivos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>
      <p className="mb-2 text-xs text-gray-400">
        Mostrando {filtered.length} de {products.length} productos
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Precio</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Rotación</th>
                <th className="p-4 font-semibold">Vence</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const tag = STATUS_TAG[p.status]
                const exp = expiryTag(p.daysToExpiry)
                const cat = p.category_id ? catMap.get(p.category_id) : null
                const r = resolveRate(p.rate_mode, p.custom_rate, company.rate_mode, company.custom_rate)
                const conv = convertPrice(p.price, r.mode, r.custom, rates)
                return (
                  <tr
                    key={p.id}
                    className={`inv-row border-b border-gray-100 hover:bg-gray-50 ${
                      p.active ? '' : 'opacity-50'
                    }`}
                  >
                    <td className="p-4 font-medium text-gray-800">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <Image src={p.image_url} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
                            {p.emoji}
                          </span>
                        )}
                        <div>
                          <p>{p.name}</p>
                          {cat && (
                            <span className="text-xs text-gray-400">
                              {cat.emoji} {cat.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#4dd0e1]">${p.price}</p>
                      <p className="text-xs text-gray-400">{formatConverted(conv)}</p>
                    </td>
                    <td className="p-4">
                      <form
                        action={async (fd) => {
                          await toast.promise(updateStock(fd), {
                            loading: `Actualizando stock de ${p.name}…`,
                            success: 'Stock actualizado',
                            error: 'No se pudo actualizar el stock',
                          })
                        }}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          name="stock"
                          type="number"
                          aria-label={`Stock de ${p.name}`}
                          defaultValue={p.stock}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center"
                        />
                        <SubmitButton pendingText="…" className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
                          ✓
                        </SubmitButton>
                      </form>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${tag.cls}`}>{tag.label}</span>
                    </td>
                    <td className="p-4">
                      {exp ? (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${exp.cls}`}>{exp.label}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <form
                        action={async (fd) => {
                          await toast.promise(toggleProductActive(fd), {
                            loading: `${p.active ? 'Desactivando' : 'Activando'} ${p.name}…`,
                            success: `Producto ${p.active ? 'desactivado' : 'activado'}`,
                            error: 'No se pudo cambiar el estado',
                          })
                        }}
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="next" value={(!p.active).toString()} />
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            p.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                        >
                          {p.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </form>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            toast('Modo edición activado', { icon: '✏️' })
                            setEditing(p)
                          }}
                          className="rounded-lg bg-[#8e44ad]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8e44ad] hover:bg-[#8e44ad]/20"
                        >
                          ✏️ Editar
                        </button>
                        <form
                          action={async (fd) => {
                            const ok = await confirmToast({ message: `¿Eliminar "${p.name}"?` })
                            if (!ok) return
                            await toast.promise(deleteProduct(fd), {
                              loading: `Eliminando ${p.name}…`,
                              success: 'Producto eliminado',
                              error: 'No se pudo eliminar el producto',
                            })
                          }}
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="text-red-400 transition hover:text-red-600">
                            🗑
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    {products.length === 0 ? 'Sin productos todavía.' : 'Ningún producto coincide con los filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-gradient-to-r from-[#fff176]/20 to-[#f06292]/20 p-4">
        <p className="text-sm text-gray-700">
          💡 <strong>Tip Chuchu:</strong> Desactiva un producto para que no aparezca en combos ni en
          ventas. Los 🐢 lentos y ⏰ próximos a vencer se sugieren en <strong>Sugerencias IA</strong>.
        </p>
      </div>

      {editing && (
        <ProductEditModal
          product={editing}
          categories={categories}
          company={company}
          onClose={() => setEditing(null)}
        />
      )}

      {showCategoryModal && (
        <CategoryManagerModal
          categories={categories}
          products={products}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  )
}
