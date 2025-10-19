// File: @/components/investor/my-portfolio.tsx
// Описание: Портфель инвестора - активы, которыми он владеет
// Показывает только токены с балансом > 0


'use client'

import { useEffect, useState } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { Address } from 'viem'
import { usePropertyToken } from '@/lib/hooks/use-property-token'

interface PortfolioItem {
  contractAddress: Address
  name: string
  balance: string
  value: string
}

function PortfolioCard({ contractAddress }: { contractAddress: Address }) {
  const {
    name,
    symbol,
    formattedBalance,
    formattedPricePerToken,
  } = usePropertyToken(contractAddress)

  // Расчёт стоимости
  const balance = parseFloat(formattedBalance)
  const price = parseFloat(formattedPricePerToken)
  const totalValue = (balance * price).toFixed(2)

  // Не показываем если баланс 0
  if (balance === 0) {
    return null
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-gray-500">{symbol}</p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-gray-600">
          Баланс: <span className="font-bold text-blue-600">{formattedBalance}</span>
        </p>
        <p className="text-gray-600">
          Цена: <span className="font-medium">{formattedPricePerToken} USDT</span>
        </p>
        <p className="text-gray-900 font-bold">
          Стоимость: {totalValue} USDT
        </p>
      </div>

      <a
        href={`https://sepolia.etherscan.io/address/${contractAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-xs text-blue-600 hover:underline block truncate"
      >
        {contractAddress}
      </a>
    </div>
  )
}

export function MyPortfolio() {
  const { address, isConnected } = useWeb3Status()
  const [tokenAddresses, setTokenAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка токенов из Factory
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/assets/list')
        const data = await response.json()

        const addresses = data.assets.map((a: any) => a.contractAddress)
        setTokenAddresses(addresses)

      } catch (error) {
        console.error('Error fetching tokens:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isConnected) {
      fetchTokens()
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Подключите кошелёк для просмотра портфеля</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Загрузка портфеля...</p>
      </div>
    )
  }

  if (tokenAddresses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Токены не найдены</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Мой портфель</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenAddresses.map((address) => (
          <PortfolioCard key={address} contractAddress={address} />
        ))}
      </div>
    </div>
  )
}
