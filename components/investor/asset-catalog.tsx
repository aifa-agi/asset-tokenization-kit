// File: @/components/investor/asset-catalog.tsx
// Описание: Каталог всех доступных активов
// Получает данные из API /api/assets/list


'use client'

import { useEffect, useState } from 'react'
import { AssetDetailCard } from './asset-detail-card'
import { Address } from 'viem'

interface Asset {
  id: string
  contractAddress: Address
  name: string
  description: string | null
  imageUrl: string | null
  totalTokens: number
  pricePerToken: number
  status: string
}

export function AssetCatalog() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загрузка активов из API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets/list?status=ACTIVE')

        if (!response.ok) {
          throw new Error('Failed to fetch assets')
        }

        const data = await response.json()
        setAssets(data.assets)

      } catch (err: any) {
        console.error('Error fetching assets:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssets()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка активов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">Ошибка загрузки: {error}</p>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Активы пока не созданы</p>
        <p className="text-sm text-gray-500 mt-2">
          Ожидайте появления первых активов для инвестирования
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">
        Доступные активы ({assets.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <AssetDetailCard
            key={asset.id}
            contractAddress={asset.contractAddress}
            name={asset.name}
            description={asset.description || undefined}
            imageUrl={asset.imageUrl || undefined}
          />
        ))}
      </div>
    </div>
  )
}
