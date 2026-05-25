'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import VentasCombos from './components/VentasCombos'
import Inventario from './components/Inventario'
import Sugerencias from './components/Sugerencias'
import Reportes from './components/Reportes'
import Ajustes from './components/Ajustes'
import Suscripcion from './components/Suscripcion'
import type {
  AdminStats,
  Category,
  Company,
  ComboSuggestion,
  ComboView,
  Payment,
  ProductWithVelocity,
} from '@/lib/types'
import type { Rates } from '@/lib/rates'
import type { AccessInfo } from '@/lib/billing'

gsap.registerPlugin(useGSAP)

export type Tab = 'ventas' | 'inventario' | 'sugerencias' | 'reportes' | 'ajustes' | 'suscripcion'

interface Props {
  company: Company
  products: ProductWithVelocity[]
  combos: ComboView[]
  categories: Category[]
  suggestions: ComboSuggestion[]
  rates: Rates
  stats: AdminStats
  access: AccessInfo
  latestPayment: Payment | null
}

export default function AdminApp({
  company,
  products,
  combos,
  categories,
  suggestions,
  rates,
  stats,
  access,
  latestPayment,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(access.state === 'expired' ? 'suscripcion' : 'ventas')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (access.state === 'expired' && activeTab !== 'suscripcion') {
      setActiveTab('suscripcion')
    }
  }, [access.state, activeTab])

  useGSAP(
    () => {
      gsap.fromTo(
        '.tab-content',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      )
    },
    { scope: contentRef, dependencies: [activeTab] }
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'ventas':
        return <VentasCombos products={products} combos={combos} />
      case 'inventario':
        return (
          <Inventario
            products={products}
            company={company}
            rates={rates}
            categories={categories}
          />
        )
      case 'sugerencias':
        return <Sugerencias suggestions={suggestions} />
      case 'reportes':
        return <Reportes stats={stats} suggestions={suggestions.length} />
      case 'ajustes':
        return <Ajustes company={company} />
      case 'suscripcion':
        return <Suscripcion company={company} access={access} latestPayment={latestPayment} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        company={company}
        suggestionCount={suggestions.length}
        access={access}
      />

      <div className="md:ml-[280px]">
        <div ref={contentRef} className="p-4 pb-28 md:p-6 md:pb-6">
          <div className="tab-content">{renderContent()}</div>
        </div>
      </div>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        suggestionCount={suggestions.length}
        access={access}
      />
    </div>
  )
}
