'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { recordSale, toggleComboTv, sellCombo, deleteCombo } from '../actions'
import type { ComboView, ProductWithVelocity } from '@/lib/types'
import SubmitButton from './SubmitButton'
import ComboCreator from './ComboCreator'
import { confirmToast } from '@/lib/confirmToast'

gsap.registerPlugin(useGSAP)

interface Props {
  products: ProductWithVelocity[]
  combos: ComboView[]
}

export default function VentasCombos({ products, combos }: Props) {
  const [showCreator, setShowCreator] = useState(false)
  const [editing, setEditing] = useState<ComboView | null>(null)
  const [search, setSearch] = useState('')
  const root = useRef<HTMLDivElement>(null)
  // Inactive products are hidden from selling and combos.
  const activeProducts = products.filter((p) => p.active)

  const term = search.trim().toLowerCase()
  const filteredActiveProducts = useMemo(
    () =>
      !term
        ? activeProducts
        : activeProducts.filter((p) => `${p.name} ${p.emoji ?? ''}`.toLowerCase().includes(term)),
    [activeProducts, term]
  )

  const filteredCombos = useMemo(
    () =>
      !term
        ? combos
        : combos.filter((combo) => {
            const items = combo.items.map((i) => i.name).join(' ')
            return `${combo.name} ${items}`.toLowerCase().includes(term)
          }),
    [combos, term]
  )

  useGSAP(
    () => {
      gsap.from('.vc-product', { y: 20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' })
      gsap.from('.vc-combo', { x: -20, opacity: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: 'power2.out' })
    },
    { scope: root, dependencies: [filteredActiveProducts.length, filteredCombos.length] }
  )

  return (
    <div ref={root} className="mx-auto max-w-7xl">
      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar en venta rápida y combos (producto o combo)..."
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
          aria-label="Buscar productos y combos"
        />
      </div>

      {/* Quick sell */}
      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
          <span className="h-6 w-1 rounded-full bg-[#f06292]" />
          Venta Rápida
        </h2>

        {filteredActiveProducts.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center text-gray-400">
            {activeProducts.length === 0
              ? 'Sin productos activos. Agrégalos o actívalos en Inventario 📦'
              : 'No hay productos que coincidan con tu búsqueda.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredActiveProducts.map((p) => (
              <div
                key={p.id}
                className="vc-product rounded-xl border border-gray-700 bg-[#2d2d2d] p-4 shadow-md transition-shadow hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{p.emoji ?? '🍬'}</span>
                    )}
                    <h3 className="mt-2 font-semibold text-white">{p.name}</h3>
                    <p className="text-sm text-gray-400">Stock: {p.stock}</p>
                  </div>
                  <p className="text-2xl font-bold text-[#4dd0e1]">${p.price}</p>
                </div>
                <form
                  action={async (fd) => {
                    await toast.promise(recordSale(fd), {
                      loading: `Registrando venta de ${p.name}…`,
                      success: 'Venta registrada',
                      error: 'No se pudo registrar la venta',
                    })
                  }}
                  className="mt-4"
                >
                  <input type="hidden" name="productId" value={p.id} />
                  <SubmitButton
                    pendingText="Vendiendo…"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f06292] py-2 font-semibold text-white transition-colors hover:bg-[#d81b60] disabled:opacity-50"
                  >
                    + Vender
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-gray-400">
          ⚡ La venta descuenta stock automáticamente y alimenta las Sugerencias IA
        </p>
      </section>

      {/* Combos */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <span className="h-6 w-1 rounded-full bg-[#fff176]" />
            Combos Activos
          </h2>
          <button
            type="button"
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fff176] to-[#ffd966] px-5 py-2 font-bold text-gray-800 shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            ✨ Crear Combo
          </button>
        </div>

        {filteredCombos.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
            <p className="text-gray-400">
              {combos.length === 0
                ? 'No hay combos activos'
                : 'No hay combos que coincidan con tu búsqueda'}
            </p>
            {combos.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreator(true)}
                className="mt-3 font-medium text-[#f06292]"
              >
                Crear el primer combo ✨
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredCombos.map((combo) => {
              const discount =
                combo.original_price > combo.price_offer
                  ? Math.round((1 - combo.price_offer / combo.original_price) * 100)
                  : 0
              const savings = combo.original_price - combo.price_offer
              const sellable = combo.items.length
                ? Math.min(...combo.items.map((i) => i.stock))
                : 0
              return (
                <div
                  key={combo.id}
                  className="vc-combo flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-bold text-gray-800">{combo.name}</h3>
                        {discount > 0 && (
                          <span className="shrink-0 rounded-full bg-[#fff176] px-2 py-0.5 text-xs font-black text-gray-800">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      {/* product thumbnails */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {combo.items.map((it) => (
                          <span
                            key={it.id}
                            className="flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-1 pr-2 text-xs text-gray-600"
                          >
                            {it.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image_url} alt={it.name} className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                              <span>{it.emoji}</span>
                            )}
                            {it.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold text-[#4dd0e1]">${combo.price_offer}</p>
                      {combo.original_price > combo.price_offer && (
                        <p className="text-xs text-gray-400 line-through">${combo.original_price}</p>
                      )}
                      {savings > 0 && (
                        <p className="text-xs font-medium text-green-600">ahorra ${savings.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {/* stock health */}
                  <div className="mt-3">
                    {sellable <= 0 ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                        ⚠️ Sin stock para armarlo
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-500">
                        📦 {sellable} combo(s) disponibles
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">📺 TV</span>
                      <form
                        action={async (fd) => {
                          await toast.promise(toggleComboTv(fd), {
                            loading: 'Actualizando visibilidad en TV…',
                            success: `Combo ${combo.on_tv ? 'oculto' : 'visible'} en TV`,
                            error: 'No se pudo cambiar el estado en TV',
                          })
                        }}
                      >
                        <input type="hidden" name="id" value={combo.id} />
                        <input type="hidden" name="next" value={(!combo.on_tv).toString()} />
                        <SubmitButton
                          pendingText="…"
                          className={`relative block h-6 w-12 rounded-full transition-colors ${
                            combo.on_tv ? 'bg-[#4dd0e1]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-all ${
                              combo.on_tv ? 'left-7' : 'left-1'
                            }`}
                          />
                        </SubmitButton>
                      </form>
                      {combo.on_tv && (
                        <span className="rounded-full bg-[#fff176] px-2 py-0.5 text-xs font-medium text-gray-800">
                          🔴 EN TV
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast('Editando combo', { icon: '✏️' })
                          setEditing(combo)
                        }}
                        className="rounded-lg bg-[#8e44ad]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8e44ad] hover:bg-[#8e44ad]/20"
                      >
                        ✏️ Editar
                      </button>
                      <form
                        action={async (fd) => {
                          await toast.promise(sellCombo(fd), {
                            loading: `Vendiendo combo "${combo.name}"…`,
                            success: 'Combo vendido',
                            error: 'No se pudo vender el combo',
                          })
                        }}
                      >
                        <input type="hidden" name="comboId" value={combo.id} />
                        <SubmitButton
                          pendingText="…"
                          disabled={sellable <= 0}
                          className="rounded-lg bg-[#f06292] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#d81b60] disabled:opacity-40"
                        >
                          Vender
                        </SubmitButton>
                      </form>
                      <form
                        action={async (fd) => {
                          const ok = await confirmToast({ message: `¿Eliminar el combo "${combo.name}"?` })
                          if (!ok) return
                          await toast.promise(deleteCombo(fd), {
                            loading: `Eliminando combo "${combo.name}"…`,
                            success: 'Combo eliminado',
                            error: 'No se pudo eliminar el combo',
                          })
                        }}
                      >
                        <input type="hidden" name="id" value={combo.id} />
                        <button type="submit" className="px-1 text-sm text-red-400 transition hover:text-red-600">
                          🗑
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {showCreator && (
        <ComboCreator products={activeProducts} onClose={() => setShowCreator(false)} />
      )}

      {editing && (
        <ComboCreator
          products={activeProducts}
          editId={editing.id}
          presetIds={editing.items.map((i) => i.id)}
          presetName={editing.name}
          presetPrice={editing.price_offer}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
