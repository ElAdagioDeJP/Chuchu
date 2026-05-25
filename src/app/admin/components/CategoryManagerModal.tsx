'use client'

import { useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { assignCategory, createCategory, deleteCategory } from '../actions'
import type { Category, ProductWithVelocity } from '@/lib/types'
import SubmitButton from './SubmitButton'
import { confirmToast } from '@/lib/confirmToast'

gsap.registerPlugin(useGSAP)

interface Props {
  categories: Category[]
  products: ProductWithVelocity[]
  onClose: () => void
}

export default function CategoryManagerModal({ categories, products, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const createFormRef = useRef<HTMLFormElement>(null)
  const [search, setSearch] = useState('')

  useGSAP(
    () => {
      gsap.from('.catm-panel', {
        y: 24,
        scale: 0.97,
        opacity: 0,
        duration: 0.3,
        ease: 'back.out(1.4)',
        onComplete: () => {
          nameInputRef.current?.focus()
        },
      })
    },
    { scope: root }
  )

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((p) => {
      const hay = `${p.name} ${p.emoji ?? ''}`.toLowerCase()
      return hay.includes(term)
    })
  }, [products, search])

  const byId = useMemo(() => {
    const map = new Map<string, Category>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  return (
    <div
      ref={root}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="catm-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🏷️ Crear categorías</h2>
            <p className="text-sm text-gray-500">Crea categorías y asígnalas rápido a tus productos.</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 font-bold text-gray-800">Tus categorías</h3>
            <form
              ref={createFormRef}
              action={async (fd) => {
                await toast.promise(createCategory(fd), {
                  loading: 'Creando categoría…',
                  success: 'Categoría creada',
                  error: 'No se pudo crear la categoría',
                })
                createFormRef.current?.reset()
                nameInputRef.current?.focus()
                nameInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
              }}
              className="mb-3 flex gap-2"
            >
              <input
                name="emoji"
                maxLength={2}
                defaultValue="🏷️"
                aria-label="Emoji categoría"
                className="w-14 rounded-lg border border-gray-300 text-center text-xl outline-none focus:ring-2 focus:ring-[#f06292]"
              />
              <input
                ref={nameInputRef}
                name="name"
                required
                placeholder="Ej: Chocolates"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
              />
              <SubmitButton
                pendingText="…"
                className="rounded-lg bg-[#8e44ad] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7d3c9d]"
              >
                +
              </SubmitButton>
            </form>

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400">Aún no tienes categorías.</p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <span className="font-medium text-gray-700">
                      {c.emoji} {c.name}
                    </span>
                    <form
                      action={async (fd) => {
                        const ok = await confirmToast({
                          message: `¿Eliminar la categoría "${c.name}"? Los productos quedan sin categoría.`,
                        })
                        if (!ok) return
                        await toast.promise(deleteCategory(fd), {
                          loading: 'Eliminando categoría…',
                          success: 'Categoría eliminada',
                          error: 'No se pudo eliminar la categoría',
                        })
                      }}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-red-400 hover:text-red-600">
                        ✕
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-bold text-gray-800">Facilitador: asignar a productos</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar producto…"
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#f06292]"
            />
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-400">No hay productos que coincidan.</p>
              ) : (
                filteredProducts.map((p) => (
                  <form
                    key={p.id}
                    action={async (fd) => {
                      await toast.promise(assignCategory(fd), {
                        loading: 'Asignando categoría…',
                        success: 'Categoría asignada',
                        error: 'No se pudo asignar categoría',
                      })
                    }}
                    className="rounded-lg bg-white p-3 shadow-sm"
                  >
                    <input type="hidden" name="productId" value={p.id} />
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      {p.emoji} {p.name}
                    </p>
                    <div className="flex gap-2">
                      <select
                        name="categoryId"
                        defaultValue={p.category_id ?? ''}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#f06292]"
                      >
                        <option value="">Sin categoría</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                      </select>
                      <SubmitButton
                        pendingText="…"
                        className="rounded-lg bg-[#f06292] px-3 py-2 text-sm font-semibold text-white hover:bg-[#d81b60]"
                      >
                        Guardar
                      </SubmitButton>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Actual: {p.category_id ? `${byId.get(p.category_id)?.emoji ?? ''} ${byId.get(p.category_id)?.name ?? ''}` : 'Sin categoría'}
                    </p>
                  </form>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
