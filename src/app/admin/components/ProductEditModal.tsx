'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { updateProduct } from '../actions'
import type { Category, Company, Product, RateMode } from '@/lib/types'
import { RATE_LABEL } from '@/lib/rates'
import SubmitButton from './SubmitButton'

gsap.registerPlugin(useGSAP)

interface Props {
  product: Product
  categories: Category[]
  company: Company
  onClose: () => void
}

export default function ProductEditModal({ product, categories, company, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<string | null>(product.image_url)
  const [rateMode, setRateMode] = useState<'' | RateMode>(product.rate_mode ?? '')

  useGSAP(
    () => {
      gsap.from('.pem-panel', {
        y: 24,
        scale: 0.96,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.5)',
        onComplete: () => {
          panel.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          panel.current?.focus()
        },
      })
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Editar producto"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="pem-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none focus:ring-2 focus:ring-[#8e44ad]/40"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-800">✏️ Editar producto</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form
          action={async (fd) => {
            await toast.promise(updateProduct(fd), {
              loading: 'Guardando cambios…',
              success: 'Producto actualizado',
              error: 'No se pudo actualizar el producto',
            })
            onClose()
          }}
          className="space-y-4 p-5"
        >
          <input type="hidden" name="id" value={product.id} />

          <div className="flex gap-4">
            <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-[#f06292]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">📷</span>
              )}
              <input
                name="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setPreview(URL.createObjectURL(f))
                }}
              />
            </label>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <input
                  name="emoji"
                  maxLength={2}
                  defaultValue={product.emoji ?? '🍬'}
                  aria-label="Emoji"
                  className="h-12 w-14 rounded-lg border border-gray-300 text-center text-2xl outline-none focus:ring-2 focus:ring-[#f06292]"
                />
                <input
                  name="name"
                  required
                  defaultValue={product.name}
                  aria-label="Nombre"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
                />
              </div>
              <p className="text-xs text-gray-400">Toca la foto para cambiarla.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Precio (USD)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={product.price}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Stock</label>
              <input
                name="stock"
                type="number"
                defaultValue={product.stock}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Vencimiento</label>
              <input
                name="expires_at"
                type="date"
                defaultValue={product.expires_at ?? ''}
                aria-label="Vencimiento"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-[#f06292]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Categoría</label>
              <select
                name="category_id"
                defaultValue={product.category_id ?? ''}
                aria-label="Categoría"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-[#f06292]"
              >
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
                value={rateMode}
                onChange={(e) => setRateMode(e.target.value as RateMode | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-[#f06292]"
              >
                <option value="">Heredar ({RATE_LABEL[company.rate_mode]})</option>
                <option value="binance">Binance</option>
                <option value="bcv">BCV</option>
                <option value="euro">Euro</option>
                <option value="custom">Tasa propia</option>
              </select>
            </div>
            {rateMode === 'custom' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Bs por USD</label>
                <input
                  name="custom_rate"
                  type="number"
                  step="0.01"
                  defaultValue={product.custom_rate ?? ''}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <SubmitButton
              pendingText="Guardando…"
              className="flex-1 rounded-lg bg-gradient-to-r from-[#8e44ad] to-[#d81b60] px-4 py-2 font-bold text-white hover:shadow-lg disabled:opacity-50"
            >
              Guardar cambios
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
