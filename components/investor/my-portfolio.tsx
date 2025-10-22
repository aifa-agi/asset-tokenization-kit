// File: @/components/investor/my-portfolio.tsx
// ОБНОВЛЕНО: Карточки с кнопкой "Продать", фиксированная высота, правильная цена

'use client'

import { useEffect, useState } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { Address } from 'viem'
import { usePropertyToken } from '@/lib/hooks/use-property-token'
import { toast } from 'sonner'

interface PortfolioCardProps {
  contractAddress: Address
}

function PortfolioCard({ contractAddress }: PortfolioCardProps) {
  const { address } = useWeb3Status()
  
  const {
    name,
    symbol,
    formattedBalance,
    formattedPricePerToken,
    transfer,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
  } = usePropertyToken(contractAddress)

  const [sellAmount, setSellAmount] = useState('1')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  // ✅ Безопасное преобразование
  const getPrice = (price: string): number => {
    const parsed = parseFloat(price)
    return isNaN(parsed) ? 0 : parsed
  }

  const balance = parseFloat(formattedBalance)
  const price = getPrice(formattedPricePerToken)
  const totalValue = (balance * price).toFixed(2)

  // Не показываем если баланс 0
  if (balance === 0) {
    return null
  }

  const handleSell = async () => {
    if (!address) {
      toast.error('❌ Кошелёк не подключён')
      return
    }

    if (!recipientAddress || !recipientAddress.startsWith('0x')) {
      toast.error('❌ Введите корректный адрес получателя')
      return
    }

    const amount = parseInt(sellAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('❌ Введите корректное количество')
      return
    }

    if (amount > balance) {
      toast.error(`❌ Недостаточно токенов (у вас ${balance})`)
      return
    }

    setTxStatus('pending')

    try {
      const toastId = toast.loading(`💸 Продажа ${amount} токена(ов)...`)
      
      const hash = await transfer(recipientAddress as Address, sellAmount)
      
      toast.success('📤 Транзакция отправлена', { id: toastId })
      toast.loading('⏳ Ожидание подтверждения...', { id: 'confirm' })
      
      console.log('✅ Sell transaction:', hash)
    } catch (error: any) {
      console.error('❌ Sell error:', error)
      setTxStatus('error')

      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        toast.error('🚫 Транзакция отклонена')
      } else {
        toast.error('❌ Ошибка продажи: ' + (error.shortMessage || error.message))
      }

      toast.dismiss('confirm')
    }
  }

  useEffect(() => {
    if (isConfirmed && txStatus === 'pending') {
      setTxStatus('success')
      toast.success('✅ Токены успешно проданы!', { id: 'confirm' })
      
      setTimeout(() => {
        setTxStatus('idle')
        setSellAmount('1')
        setRecipientAddress('')
      }, 3000)
    }
  }, [isConfirmed, txStatus])

  const sellValue = (price * parseInt(sellAmount || '0')).toFixed(2)

  const getButtonText = () => {
    if (isWritePending) return '📤 Отправка...'
    if (isConfirming) return '⏳ Подтверждение...'
    if (txStatus === 'success') return '✅ Успешно!'
    if (txStatus === 'error') return '❌ Ошибка'
    return 'Продать'
  }

  const isButtonDisabled = isWritePending || isConfirming

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{formattedBalance}</p>
            <p className="text-xs text-gray-500">токенов</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Цена за токен</p>
            <p className="text-lg font-bold text-emerald-600">
              {price.toFixed(2)} USDT
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Общая стоимость</p>
            <p className="text-lg font-bold text-blue-600">
              {totalValue} USDT
            </p>
          </div>
        </div>

        {/* ✅ Форма продажи - прижата к низу */}
        <div className="mt-auto space-y-4 border-t pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Адрес получателя
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              disabled={isButtonDisabled}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Количество токенов
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={balance}
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                disabled={isButtonDisabled}
                className="flex-1 px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  placeholder:text-gray-400"
              />

              <button
                onClick={handleSell}
                disabled={isButtonDisabled}
                className={`px-6 py-2 font-semibold rounded-md transition-colors
                  ${isButtonDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : txStatus === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {getButtonText()}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Стоимость:{' '}
              <span className="font-bold text-gray-900">{sellValue} USDT</span>
            </p>
          </div>

          {/* Ссылка на Etherscan */}
          <a
            href={`https://sepolia.etherscan.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline block truncate"
          >
            📊 Контракт: {contractAddress.slice(0, 10)}...
          </a>

          {/* Транзакция */}
          {txHash && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-xs font-medium mb-1 text-blue-900">Транзакция</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline break-all"
              >
                {txHash}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MyPortfolio() {
  const { address, isConnected } = useWeb3Status()
  const [tokenAddresses, setTokenAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-4xl mb-3">🔌</div>
        <p className="text-gray-600 mb-4">Подключите кошелёк для просмотра портфеля</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка портфеля...</p>
        </div>
      </div>
    )
  }

  if (tokenAddresses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-600">Токены не найдены</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Мой портфель</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokenAddresses.map((address) => (
          <PortfolioCard key={address} contractAddress={address} />
        ))}
      </div>
    </div>
  )
}
