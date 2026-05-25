'use client'

import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { updateCompany } from '../actions'
import type { Company, RateMode } from '@/lib/types'
import SubmitButton from './SubmitButton'

export default function Ajustes({ company }: { company: Company }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [rateMode, setRateMode] = useState<RateMode>(company.rate_mode)
  const displayUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/display/${company.slug}` : ''

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">⚙️ Ajustes</h1>
      <p className="mb-6 text-gray-500">Personaliza tu marca y obtén la URL de tu pantalla.</p>

      <form
        action={async (fd) => {
          await toast.promise(updateCompany(fd), {
            loading: 'Guardando ajustes…',
            success: 'Ajustes guardados',
            error: 'No se pudieron guardar los ajustes',
          })
        }}
        className="space-y-6"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-800">🏪 Tu empresa</h3>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#d81b60]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : company.logo_url ? (
                <Image src={company.logo_url} alt={company.name} fill sizes="96px" className="object-cover" />
              ) : (
                <span className="text-3xl text-gray-400 group-hover:text-[#d81b60]">📷</span>
              )}
              <input
                name="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  setPreview(f ? URL.createObjectURL(f) : null)
                }}
              />
            </label>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre de la empresa
              </label>
              <input
                name="name"
                aria-label="Nombre de la empresa"
                defaultValue={company.name}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
              />
              <p className="mt-2 text-xs text-gray-400">
                Toca el cuadro para cambiar tu logo. Se mostrará junto al de Chuchu.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-1 font-bold text-gray-800">💱 Tasa de cambio en la TV</h3>
          <p className="mb-4 text-sm text-gray-500">
            Define cómo se muestran los precios en pantalla. Aplica a todos los productos que no
            tengan una tasa propia.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['binance', 'bcv', 'euro', 'custom'] as RateMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRateMode(m)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                  rateMode === m
                    ? 'border-[#8e44ad] bg-[#8e44ad]/10 text-[#8e44ad]'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {m === 'custom' ? 'Tasa propia' : m}
              </button>
            ))}
          </div>
          <input type="hidden" name="rate_mode" value={rateMode} />
          {rateMode === 'custom' && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tasa propia (Bs por USD)
              </label>
              <input
                name="custom_rate"
                type="number"
                step="0.01"
                defaultValue={company.custom_rate ?? ''}
                placeholder="Ej: 40.00"
                className="w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#f06292]"
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-800">📺 Pantalla / TV</h3>
          <p className="mb-2 text-sm text-gray-600">URL para mostrar tus combos en pantalla:</p>
          <code className="block break-all rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
            {displayUrl}
          </code>
          <div className="mt-3 flex gap-2">
            <a
              href={`/display/${company.slug}`}
              target="_blank"
              className="rounded-lg bg-[#4dd0e1]/15 px-4 py-2 text-sm font-medium text-[#0891a3] transition hover:bg-[#4dd0e1]/25"
            >
              Abrir pantalla
            </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(displayUrl)
                  toast.success('URL copiada')
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                Copiar URL
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            💡 Ábrela en cualquier navegador conectado a tu TV (HDMI / Chromecast). Solo aparecen los
            combos con 📺 EN TV.
          </p>
        </div>

        <SubmitButton
          pendingText="Guardando…"
          className="w-full rounded-xl bg-gradient-to-r from-[#8e44ad] to-[#f06292] py-3 font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
        >
          Guardar cambios
        </SubmitButton>
      </form>
    </div>
  )
}
