// File: @/components/investor/asset-detail-card.tsx
// ОБНОВЛЁННАЯ ВЕРСИЯ с улучшенной обработкой ошибок и статусов


'use client'

import { useState } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { Address } from 'viem'
import { toast } from 'sonner'
import { sepolia } from 'wagmi/chains'
import { usePropertyToken } from '@/lib/hooks/use-property-token'

interface AssetDetailCardProps {
  contractAddress: Address
  name: string
  description?: string
  imageUrl?: string
}

export function AssetDetailCard({
  contractAddress,
  name,
  description,
  imageUrl,
}: AssetDetailCardProps) {
  const { 
    address, 
    isConnected, 
    chainId,
    switchToSepolia,
    isReady 
  } = useWeb3Status()
  
  const {
    symbol,
    formattedBalance,
    formattedTotalSupply,
    formattedMaxSupply,
    formattedRemainingSupply,
    formattedPricePerToken,
    mint,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
    isPaused,
    writeError,
    confirmError,
  } = usePropertyToken(contractAddress)

  const [buyAmount, setBuyAmount] = useState('1')
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  // Обработка покупки с улучшенными проверками
  const handleBuy = async () => {
    // Проверка 1: Подключение кошелька
    if (!isConnected || !address) {
      toast.error('🔌 Подключите кошелёк')
      return
    }

    // Проверка 2: Правильная сеть
    if (chainId !== sepolia.id) {
      toast.error('⚠️ Переключитесь на Sepolia', {
        action: {
          label: 'Переключить',
          onClick: () => switchToSepolia(),
        },
      })
      return
    }

    // Проверка 3: Web3 готов
    if (!isReady) {
      toast.error('⏳ Web3 не готов, подождите')
      return
    }

    // Проверка 4: Контракт не на паузе
    if (isPaused) {
      toast.error('⏸️ Контракт приостановлен')
      return
    }

    // Проверка 5: Валидация количества
    const amount = parseInt(buyAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('❌ Введите корректное количество')
      return
    }

    const remaining = parseInt(formattedRemainingSupply)
    if (amount > remaining) {
      toast.error(`❌ Доступно только ${remaining} токенов`)
      return
    }

    // Начало покупки
    setTxStatus('pending')

    try {
      const toastId = toast.loading(`🛒 Покупка ${amount} токена(ов)...`)

      const hash = await mint(address, buyAmount)

      toast.success('📤 Транзакция отправлена', { id: toastId })
      toast.loading('⏳ Ожидание подтверждения...', { id: 'confirm' })

      console.log('✅ Buy transaction:', hash)

    } catch (error: any) {
      console.error('❌ Buy error:', error)
      setTxStatus('error')

      // Детальная обработка ошибок (из старой версии)
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        toast.error('🚫 Транзакция отклонена пользователем')
      } else if (error.message?.includes('insufficient')) {
        toast.error('💰 Недостаточно средств для оплаты газа')
      } else if (error.message?.includes('Exceeds max supply')) {
        toast.error('❌ Превышен максимальный выпуск')
      } else {
        toast.error('❌ Ошибка покупки: ' + (error.shortMessage || error.message))
      }

      toast.dismiss('confirm')
    }
  }

  // Автообновление статуса при подтверждении
  if (isConfirmed && txStatus === 'pending') {
    setTxStatus('success')
    toast.success('✅ Токены успешно куплены!', { id: 'confirm' })
    
    setTimeout(() => {
      setTxStatus('idle')
    }, 3000)
  }

  // Расчёт общей стоимости
  const totalCost = (parseFloat(formattedPricePerToken) * parseInt(buyAmount || '0')).toFixed(2)

  // Состояние кнопки
  const getButtonText = () => {
    if (isWritePending) return '📤 Отправка...'
    if (isConfirming) return '⏳ Подтверждение...'
    if (txStatus === 'success') return '✅ Успешно!'
    if (txStatus === 'error') return '❌ Ошибка'
    return 'Купить'
  }

  const isButtonDisabled = 
    !isConnected || 
    !isReady || 
    chainId !== sepolia.id || 
    isWritePending || 
    isConfirming || 
    isPaused

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Изображение */}
      {imageUrl ? (
        <div className="w-full h-64 bg-gray-200">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
          <span className="text-white text-6xl">🏠</span>
        </div>
      )}

      {/* Контент */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
          {isPaused && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
              ⏸️ Приостановлен
            </span>
          )}
        </div>

        {/* Статусы сети */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-center">
            <p className="text-yellow-800 text-sm">🔌 Подключите кошелёк для покупки</p>
          </div>
        )}

        {isConnected && chainId !== sepolia.id && (
          <div className="mb-4 p-3 bg-orange-50 rounded-lg text-center">
            <p className="text-orange-800 text-sm mb-2">⚠️ Неправильная сеть</p>
            <button
              onClick={switchToSepolia}
              className="text-sm text-orange-600 hover:underline font-medium"
            >
              Переключиться на Sepolia
            </button>
          </div>
        )}

        {description && (
          <p className="text-gray-700 mb-6">{description}</p>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Цена за токен</p>
            <p className="text-xl font-bold text-emerald-600">
              {formattedPricePerToken} USDT
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Доступно</p>
            <p className="text-xl font-bold text-gray-900">
              {formattedRemainingSupply} / {formattedMaxSupply}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Ваш баланс</p>
            <p className="text-xl font-bold text-blue-600">
              {formattedBalance}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Продано</p>
            <p className="text-xl font-bold text-gray-900">
              {formattedTotalSupply}
            </p>
          </div>
        </div>

        {/* Форма покупки */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium mb-2">
            Количество токенов
          </label>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              min="1"
              max={formattedRemainingSupply}
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              disabled={isButtonDisabled}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md
                focus:ring-2 focus:ring-emerald-500
                disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            <button
              onClick={handleBuy}
              disabled={isButtonDisabled}
              className={`px-6 py-2 font-semibold rounded-md transition-colors
                ${isButtonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : txStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
            >
              {getButtonText()}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Общая стоимость:{' '}
            <span className="font-bold text-gray-900">{totalCost} USDT</span>
          </p>
        </div>

        {/* Транзакция */}
        {txHash && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs font-medium mb-1">Транзакция</p>
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

        {/* Debug info (из старой версии) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <p>Контракт: {contractAddress.slice(0, 10)}...</p>
            <p>Сеть: {chainId === sepolia.id ? 'Sepolia ✅' : `ID: ${chainId}`}</p>
            <p>Адрес: {address ? address.slice(0, 6) + '...' : 'Не подключён'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
