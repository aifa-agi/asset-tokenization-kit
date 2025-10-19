// File: @/components/admin/asset-list.tsx
// Описание: Список всех созданных активов с управлением
// Показывает: название, адрес контракта, количество токенов, статус


'use client'


import { usePropertyToken } from '@/lib/hooks/use-property-token'
import { usePropertyTokenFactory } from '@/lib/hooks/use-property-token-factory'
import { Address } from 'viem'

interface Asset {
  contractAddress: Address
  name: string
  symbol: string
  totalSupply: string
  maxSupply: string
  pricePerToken: string
}

function AssetItem({ address }: { address: Address }) {
  const {
    name,
    symbol,
    formattedTotalSupply,
    formattedMaxSupply,
    formattedRemainingSupply,
    formattedPricePerToken,
    isPaused,
  } = usePropertyToken(address)

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{name || 'Loading...'}</h3>
          <p className="text-sm text-gray-500">{symbol}</p>
        </div>
        {isPaused && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
            Paused
          </span>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-gray-600">
          Продано: <span className="font-medium">{formattedTotalSupply}</span> /{' '}
          <span className="font-medium">{formattedMaxSupply}</span>
        </p>
        <p className="text-gray-600">
          Осталось: <span className="font-medium text-emerald-600">{formattedRemainingSupply}</span>
        </p>
        <p className="text-gray-600">
          Цена: <span className="font-medium">{formattedPricePerToken} USDT</span>
        </p>
      </div>

      <a
        href={`https://sepolia.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-xs text-blue-600 hover:underline block truncate"
      >
        {address}
      </a>
    </div>
  )
}

export function AssetList() {
  const { allTokens, totalTokens, isLoading } = usePropertyTokenFactory()

  if (isLoading) {
    return <div className="text-center py-8">Загрузка активов...</div>
  }

  if (totalTokens === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Активы ещё не созданы</p>
        <p className="text-sm mt-2">Создайте первый актив через форму выше</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Мои активы ({totalTokens})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTokens.map((address) => (
          <AssetItem key={address} address={address} />
        ))}
      </div>
    </div>
  )
}
