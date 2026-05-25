'use client'

import type { Tab } from '../AdminApp'
import { TABS } from './Sidebar'
import type { AccessInfo } from '@/lib/billing'

interface Props {
  activeTab: Tab
  setActiveTab: (t: Tab) => void
  suggestionCount: number
  access: AccessInfo
}

export default function BottomNav({ activeTab, setActiveTab, suggestionCount, access }: Props) {
  const onlySubscription = access.state === 'expired'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
      {TABS.map((item) => {
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            disabled={onlySubscription && item.id !== 'suscripcion'}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? 'text-[#f06292]' : 'text-gray-400'
            } ${onlySubscription && item.id !== 'suscripcion' ? 'opacity-35' : ''}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="truncate">{item.label.split(' ')[0]}</span>
            {item.id === 'sugerencias' && suggestionCount > 0 && (
              <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fff176] px-1 text-[9px] font-bold text-gray-800">
                {suggestionCount}
              </span>
            )}
            {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[#f06292]" />}
          </button>
        )
      })}
    </nav>
  )
}
