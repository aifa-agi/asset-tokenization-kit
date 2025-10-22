// File: @/app/investor/page.tsx
// ДОБАВЛЕНА вкладка "Тестовые токены"

'use client'

import { AssetCatalog } from '@/components/investor/asset-catalog'
import { MyPortfolio } from '@/components/investor/my-portfolio'
import { TestTokens } from '@/components/investor/test-tokens'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useState } from 'react'

export default function InvestorPage() {
  const { isConnected } = useWeb3Status()
  const [activeTab, setActiveTab] = useState<'catalog' | 'portfolio' | 'tokens'>('catalog')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            💼 Investor Dashboard
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'catalog'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏠 Каталог активов
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'portfolio'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💎 Мой портфель
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'tokens'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🪙 Тестовые токены
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'catalog' && <AssetCatalog />}
        {activeTab === 'portfolio' && <MyPortfolio />}
        {activeTab === 'tokens' && <TestTokens />}
      </div>
    </div>
  )
}
