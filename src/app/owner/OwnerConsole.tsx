'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import toast from 'react-hot-toast'
import { createCompany, toggleCompanyActive, type OwnerActionState } from './actions'
import { confirmToast } from '@/lib/confirmToast'

gsap.registerPlugin(useGSAP)

type CompanyRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  active: boolean
  created_at: string
  adminEmail: string | null
}

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-gradient-to-r from-[#d81b60] to-[#8e44ad] py-3 font-bold text-white shadow-lg shadow-[#d81b60]/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
    >
      {pending ? 'Creando…' : '✨ Crear empresa'}
    </button>
  )
}

export default function OwnerConsole({ companies }: { companies: CompanyRow[] }) {
  const root = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [state, formAction] = useActionState(
    async (prev: OwnerActionState, fd: FormData) => {
      const res = await createCompany(prev, fd)
      if (res.success) {
        formRef.current?.reset()
        setLogoPreview(null)
      }
      return res
    },
    {} as OwnerActionState
  )

  useGSAP(
    () => {
      gsap.from('.owner-head', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      gsap.from('.owner-form', { y: 24, opacity: 0, duration: 0.6, delay: 0.1, ease: 'power3.out' })
      gsap.from('.company-row', {
        y: 16,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        delay: 0.2,
        ease: 'power2.out',
      })
    },
    { scope: root, dependencies: [companies.length] }
  )

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div ref={root} className="space-y-8">
      <div className="owner-head flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">
            Empresas
          </h1>
          <p className="text-gray-500">
            Crea sub-empresas y sus accesos de administrador.
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-[#8e44ad] to-[#d81b60] px-5 py-3 text-white shadow-lg">
          <p className="text-xs opacity-80">Total</p>
          <p className="text-3xl font-black leading-none">{companies.length}</p>
        </div>
      </div>

      {/* Create form */}
      <form
        ref={formRef}
        action={formAction}
        className="owner-form grid grid-cols-1 gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800">Nueva empresa</h2>
          <p className="text-sm text-gray-500">
            El administrador podrá ingresar con el correo y contraseña que definas.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#d81b60]">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400 group-hover:text-[#d81b60]">📷</span>
            )}
            <input
              name="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setLogoPreview(f ? URL.createObjectURL(f) : null)
              }}
            />
          </label>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Nombre de la empresa
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Garitas Club"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Correo del admin
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@garitas.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Contraseña
            </label>
            <input
              name="password"
              type="text"
              required
              minLength={6}
              placeholder="mín. 6 caracteres"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#d81b60]"
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {state.success}
            </p>
          )}
          <div className="md:max-w-xs">
            <CreateButton />
          </div>
        </div>
      </form>

      {/* Company table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Empresas creadas</h2>
        </div>

        {companies.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            Aún no hay empresas. Crea la primera arriba ✨
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-4 font-semibold">Empresa</th>
                  <th className="p-4 font-semibold">Admin</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">URL de TV</th>
                  <th className="p-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className={`company-row border-b border-gray-100 hover:bg-gray-50 ${
                      c.active ? '' : 'bg-gray-50/60 opacity-60'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {c.logo_url ? (
                            <Image src={c.logo_url} alt={c.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg">🏪</span>
                          )}
                        </div>
                        <span className="font-bold text-gray-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{c.adminEmail ?? '—'}</td>
                    <td className="p-4">
                      {c.active ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          ● Activa
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                          ● Inactiva
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/display/${c.slug}`}
                          target="_blank"
                          className="rounded-lg bg-[#4dd0e1]/15 px-3 py-1.5 text-xs font-medium text-[#0891a3] transition hover:bg-[#4dd0e1]/25"
                        >
                          📺 Ver TV
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(`${baseUrl}/display/${c.slug}`)
                            toast.success('URL copiada')
                          }}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <form
                        action={async (fd) => {
                          const msg = c.active
                            ? `¿Desactivar "${c.name}"? Su admin no podrá ingresar (los datos se conservan).`
                            : `¿Reactivar "${c.name}"? Su admin podrá ingresar de nuevo.`
                          const ok = await confirmToast({ message: msg })
                          if (!ok) return
                          await toast.promise(toggleCompanyActive(fd), {
                            loading: `${c.active ? 'Desactivando' : 'Activando'} empresa…`,
                            success: c.active ? 'Empresa desactivada' : 'Empresa reactivada',
                            error: 'No se pudo actualizar la empresa',
                          })
                        }}
                      >
                        <input type="hidden" name="companyId" value={c.id} />
                        <input type="hidden" name="next" value={(!c.active).toString()} />
                        <button
                          type="submit"
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            c.active
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
