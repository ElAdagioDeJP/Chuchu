'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { createCombo } from '../actions'
import type { ComboSuggestion } from '@/lib/types'
import SubmitButton from './SubmitButton'

gsap.registerPlugin(useGSAP)

export default function Sugerencias({ suggestions }: { suggestions: ComboSuggestion[] }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // fromTo (not from) + clearProps so cards can never get stuck at opacity:0
      // if the tween is interrupted by a re-render — that left some suggestions
      // invisible even though the count/badge included them.
      gsap.fromTo(
        '.sug-card',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.1,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
        }
      )
    },
    { scope: root, dependencies: [suggestions.length] }
  )

  return (
    <div ref={root} className="mx-auto max-w-5xl">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800">
        🤖 Sugerencias IA
      </h1>
      <p className="mb-6 text-gray-500">
        Combos que unen un producto que se vende rápido con uno lento para mover el inventario.
      </p>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center text-gray-400">
          <p className="text-4xl">🪄</p>
          <p className="mt-2">Necesitas al menos 2 productos con stock para generar sugerencias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {suggestions.map((s, i) => {
            const name = `Combo ${s.fast.name} + ${s.slow.name}`
            return (
              <div
                key={`${s.fast.id}-${s.slow.id}`}
                className="sug-card flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#fff176] px-3 py-1 text-xs font-bold text-gray-800">
                    -{s.discountPct}% sugerido
                  </span>
                  <span className="text-xs text-gray-400">#{i + 1}</span>
                </div>

                <div className="flex items-center justify-center gap-3 py-3">
                  <div className="text-center">
                    {s.fast.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.fast.image_url} alt={s.fast.name} className="mx-auto h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="text-4xl">{s.fast.emoji}</div>
                    )}
                    <p className="mt-1 text-xs font-medium text-green-600">🚀 Rápido</p>
                    <p className="text-sm font-semibold text-gray-800">{s.fast.name}</p>
                  </div>
                  <span className="text-2xl text-[#f06292]">+</span>
                  <div className="text-center">
                    {s.slow.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.slow.image_url} alt={s.slow.name} className="mx-auto h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="text-4xl">{s.slow.emoji}</div>
                    )}
                    <p className="mt-1 text-xs font-medium text-orange-600">
                      {s.slow.nearExpiry ? '⏰ Por vencer' : '🐢 Lento'}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{s.slow.name}</p>
                  </div>
                </div>

                <div className="my-3 flex items-baseline justify-center gap-2">
                  <span className="text-2xl font-black text-[#4dd0e1]">
                    ${s.suggestedPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${s.originalPrice.toFixed(2)}
                  </span>
                </div>

                <p className="mb-4 flex-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  {s.reason}
                </p>

                <form
                  action={async (fd) => {
                    await toast.promise(createCombo(fd), {
                      loading: 'Creando combo sugerido…',
                      success: 'Combo creado desde IA',
                      error: 'No se pudo crear el combo',
                    })
                  }}
                >
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="priceOffer" value={s.suggestedPrice} />
                  <input type="hidden" name="productIds" value={s.fast.id} />
                  <input type="hidden" name="productIds" value={s.slow.id} />
                  <SubmitButton
                    pendingText="Creando…"
                    className="w-full rounded-xl bg-gradient-to-r from-[#8e44ad] to-[#d81b60] py-2.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    ✨ Crear este combo
                  </SubmitButton>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
