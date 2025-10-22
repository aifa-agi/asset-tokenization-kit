// File: @/app/admin/page.tsx
// Description: Admin dashboard with modal form overlay
// Features: Fixed-height cards, modal with backdrop, 80% height form

'use client'

import { useState, useEffect } from 'react'
import { AssetCreateForm } from '@/components/admin/asset-create-form'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

interface Asset {
  id: string
  contractAddress: string
  name: string
  description: string | null
  imageUrl: string | null
  totalTokens: number
  pricePerToken: number | string
  currency: string
  status: string
  createdAt: string
}

export default function AdminPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAssets()
  }, [])

  // ✅ Блокировка скролла при открытом модальном окне
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showForm])

  async function loadAssets() {
    setLoading(true)
    try {
      const res = await fetch('/api/assets/list')
      if (res.ok) {
        const data = await res.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getPrice = (price: number | string): number => {
    return typeof price === 'string' ? parseFloat(price) : price
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🏠 Управление объектами недвижимости
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {assets.length} объектов создано
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        
        {/* Property Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-3 text-gray-600">Загрузка объектов...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-3">🏡</div>
            <p className="text-gray-600 mb-4">Объекты ещё не созданы</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Создать первый объект
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map((asset) => {
              const isExpanded = expandedCards.has(asset.id)
              const hasLongDescription = (asset.description?.length || 0) > 150
              const price = getPrice(asset.pricePerToken)

              return (
                <div
                  key={asset.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex h-[252px]">
                    
                    {/* Image */}
                    <div className="w-[252px] h-full flex-shrink-0 bg-gray-100">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover object-left-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-5xl mb-2">🏠</div>
                            <p className="text-sm">Нет изображения</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                            {asset.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            Контракт: <span className="font-mono font-medium">{asset.contractAddress.slice(0, 10)}...</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-emerald-600 whitespace-nowrap">
                            {price.toFixed(2)} {asset.currency}
                          </div>
                          <p className="text-xs text-gray-500">за токен</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-4 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Токенов:</span>
                          <span className="font-semibold">{asset.totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Стоимость:</span>
                          <span className="font-semibold text-emerald-600">
                            {(asset.totalTokens * price).toFixed(2)} {asset.currency}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {asset.description && (
                        <div className="mb-3">
                          <p className={`text-sm text-gray-700 ${!isExpanded && hasLongDescription ? 'line-clamp-3' : ''}`}>
                            {asset.description}
                          </p>
                          {hasLongDescription && (
                            <button
                              onClick={() => toggleCard(asset.id)}
                              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  Свернуть <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Показать полностью <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex gap-3 flex-wrap">
                        <a
                          href={`https://sepolia.etherscan.io/address/${asset.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          📊 Etherscan
                        </a>
                        <a
                          href={`/investor?contract=${asset.contractAddress}`}
                          className="text-sm text-emerald-600 hover:underline"
                        >
                          🚀 Страница инвестора
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 bg-emerald-600 text-white rounded-lg font-semibold text-lg
            hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl
            flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать новый объект недвижимости
        </button>
      </div>

      {/* ✅ Modal Overlay */}
      {showForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ top: '64px' }}  // Offset for header height
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowForm(false)}
          />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl 
              animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
              flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900">
                Создать новый объект недвижимости
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <AssetCreateForm />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
