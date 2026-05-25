'use client'

import Image from 'next/image'
import { logout } from '@/app/login/actions'
import type { Company } from '@/lib/types'
import type { Tab } from '../AdminApp'
import type { AccessInfo } from '@/lib/billing'

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'ventas', label: 'Ventas & Combos', icon: '💰' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'sugerencias', label: 'Sugerencias IA', icon: '🤖' },
  { id: 'reportes', label: 'Reportes', icon: '📊' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙️' },
  { id: 'suscripcion', label: 'Suscripción', icon: '💳' },
]

interface Props {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  company: Company
  suggestionCount: number
  access: AccessInfo
}

export default function Sidebar({ activeTab, setActiveTab, company, suggestionCount, access }: Props) {
  const onlySubscription = access.state === 'expired'

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-gray-200 bg-white md:flex">
      {/* Co-branding */}
      <div className="flex items-center gap-2 border-b border-gray-100 p-5">
        <div className="relative h-10 w-10 shrink-0">
          <Image src="/Logo/Chuchu_logo.png" alt="Chuchu" fill sizes="40px" className="object-contain" />
        </div>
        <span className="text-xl font-light text-gray-300">|</span>
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} fill sizes="36px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-base">🏪</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black uppercase leading-none tracking-tight text-[#8e44ad]">
            {company.name}
          </p>
          <p className="text-[10px] font-medium text-gray-400">by Chuchu</p>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            disabled={onlySubscription && item.id !== 'suscripcion'}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
              activeTab === item.id
                ? 'bg-[#f06292] text-white shadow-lg shadow-[#f06292]/30'
                : 'text-gray-600 hover:bg-gray-100'
            } ${onlySubscription && item.id !== 'suscripcion' ? 'cursor-not-allowed opacity-35' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {item.id === 'sugerencias' && suggestionCount > 0 && (
              <span className="ml-auto rounded-full bg-[#fff176] px-2 py-0.5 text-xs font-bold text-gray-800">
                {suggestionCount}
              </span>
            )}
          </button>
        ))}
        {onlySubscription && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            Tu prueba venció. Solo está habilitada la pestaña Suscripción.
          </p>
        )}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <form action={logout}>
          <button type="submit" className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
            Cerrar sesión
          </button>
        </form>
        <p className="mt-3 text-center text-[10px] text-gray-300">✨ Chuchu Smart Menu v2.0</p>
      </div>
    </aside>
  )
}
