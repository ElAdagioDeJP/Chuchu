'use client'

import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { createCombo, updateCombo } from '../actions'
import type { ProductWithVelocity } from '@/lib/types'
import SubmitButton from './SubmitButton'

gsap.registerPlugin(useGSAP)

interface Props {
  products: ProductWithVelocity[]
  onClose: () => void
  editId?: string
  presetIds?: string[]
  presetName?: string
  presetPrice?: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export default function ComboCreator({
  products,
  onClose,
  editId,
  presetIds = [],
  presetName = '',
  presetPrice,
}: Props) {
  const [selected, setSelected] = useState<string[]>(presetIds)
  const [name, setName] = useState(presetName)
  const [price, setPrice] = useState(presetPrice ? String(presetPrice) : '')
  const [search, setSearch] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('.cc-panel', { y: 24, scale: 0.96, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' })
    },
    { scope: root }
  )

  const byId = useMemo(() => {
    const m = new Map<string, ProductWithVelocity>()
    products.forEach((p) => m.set(p.id, p))
    return m
  }, [products])

  const selectedProducts = selected.map((id) => byId.get(id)).filter(Boolean) as ProductWithVelocity[]
  const original = round2(selectedProducts.reduce((t, p) => t + p.price, 0))
  const offer = Number(price) || 0
  const savings = round2(original - offer)
  const discountPct = original > 0 && offer > 0 ? Math.round((1 - offer / original) * 100) : 0
  const sellable = selectedProducts.length
    ? Math.min(...selectedProducts.map((p) => p.stock))
    : 0
  const suggested = round2(original * 0.85)
  const movesInventory = selectedProducts.some((p) => p.status === 'lento' || p.nearExpiry)

  const term = search.trim().toLowerCase()
  const available = products
    .filter((p) => !selected.includes(p.id))
    .filter((p) => !term || p.name.toLowerCase().includes(term))

  const valid = name.trim() && selected.length >= 2 && offer > 0
  const overPriced = offer > 0 && original > 0 && offer >= original

  const applyDiscount = (d: number) => setPrice(String(round2(original * (1 - d))))

  return (
    <div
      ref={root}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cc-panel flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#fff176]/30 to-[#f06292]/10 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editId ? '✏️ Editar combo' : '✨ Nuevo combo'}
            </h2>
            <p className="text-sm text-gray-500">Combina productos y ofrece un precio irresistible.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form
          action={async (fd) => {
            if (editId) {
              await toast.promise(updateCombo(fd), {
                loading: 'Guardando combo…',
                success: 'Combo actualizado',
                error: 'No se pudo actualizar el combo',
              })
            } else {
              await toast.promise(createCombo(fd), {
                loading: 'Creando combo…',
                success: 'Combo creado',
                error: 'No se pudo crear el combo',
              })
            }
            onClose()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {editId && <input type="hidden" name="id" value={editId} />}
          {selected.map((id) => (
            <input key={id} type="hidden" name="productIds" value={id} />
          ))}

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
            {/* Left: picker */}
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                1. Elige productos ({selected.length})
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Buscar producto…"
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
              />
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 md:max-h-[46vh]">
                {available.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">Sin productos.</p>
                )}
                {available.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected((s) => [...s, p.id])}
                    disabled={p.stock <= 0}
                    className="flex w-full items-center gap-3 rounded-lg bg-white p-2 text-left shadow-sm transition hover:ring-2 hover:ring-[#f06292] disabled:opacity-40"
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-lg">
                        {p.emoji}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs font-bold text-[#4dd0e1]">${p.price}</span>
                        <span className="text-xs text-gray-400">· stock {p.stock}</span>
                        {p.status === 'lento' && <span className="text-[10px]">🐢</span>}
                        {p.nearExpiry && <span className="text-[10px]">⏰</span>}
                      </div>
                    </div>
                    <span className="text-lg text-[#f06292]">+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: selected + pricing */}
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-gray-700">2. Tu combo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del combo (ej: Antojo Total)"
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
              />

              <div className="mb-2 min-h-[60px] space-y-1.5 rounded-lg border border-gray-100 bg-gray-50 p-2">
                {selectedProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">
                    Agrega al menos 2 productos
                  </p>
                ) : (
                  selectedProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white p-1.5 shadow-sm">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="h-8 w-8 rounded-md object-cover" />
                      ) : (
                        <span className="text-lg">{p.emoji}</span>
                      )}
                      <span className="flex-1 truncate text-sm text-gray-700">{p.name}</span>
                      <span className="text-xs font-bold text-[#4dd0e1]">${p.price}</span>
                      <button
                        type="button"
                        onClick={() => setSelected((s) => s.filter((x) => x !== p.id))}
                        className="px-1 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {movesInventory && (
                <p className="mb-2 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                  ✨ Este combo ayuda a mover inventario lento / por vencer.
                </p>
              )}

              {/* Pricing */}
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Precio normal</span>
                  <span className="font-semibold text-gray-700">${original.toFixed(2)}</span>
                </div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Precio oferta (USD)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
                />
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[0.1, 0.15, 0.2, 0.25].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => applyDiscount(d)}
                      disabled={original <= 0}
                      className="rounded-full bg-[#8e44ad]/10 px-3 py-1 text-xs font-semibold text-[#8e44ad] transition hover:bg-[#8e44ad]/20 disabled:opacity-40"
                    >
                      -{Math.round(d * 100)}%
                    </button>
                  ))}
                  {original > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrice(String(suggested))}
                      className="rounded-full bg-[#fff176] px-3 py-1 text-xs font-bold text-gray-800 hover:brightness-95"
                    >
                      💡 Sugerido ${suggested.toFixed(2)}
                    </button>
                  )}
                </div>

                {offer > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400">Ahorro</p>
                      <p className={`text-sm font-bold ${savings > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ${savings.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400">Descuento</p>
                      <p className={`text-sm font-bold ${discountPct > 0 ? 'text-[#f06292]' : 'text-red-500'}`}>
                        {discountPct}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400">Disponibles</p>
                      <p className="text-sm font-bold text-gray-700">{sellable}</p>
                    </div>
                  </div>
                )}

                {overPriced && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
                    ⚠️ El precio oferta es igual o mayor al normal. Bájalo para que sea atractivo.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <SubmitButton
              disabled={!valid}
              pendingText={editId ? 'Guardando…' : 'Creando…'}
              className={`flex-[2] rounded-lg px-4 py-2.5 font-bold transition-all ${
                valid
                  ? 'bg-gradient-to-r from-[#8e44ad] to-[#d81b60] text-white hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
            >
              {editId ? 'Guardar combo' : 'Crear combo'}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
