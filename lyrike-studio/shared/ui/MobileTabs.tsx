'use client'

import { type ReactNode } from 'react'

type TabId = 'source' | 'timeline' | 'lyrics'

interface MobileTabsProps {
  activeTab: TabId
  tabs: { id: TabId; label: string }[]
  onSelect: (tab: TabId) => void
}

export function MobileTabs({ activeTab, tabs, onSelect }: MobileTabsProps) {
  return (
    <nav className="mobile-tabs panel" aria-label="Editor sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}