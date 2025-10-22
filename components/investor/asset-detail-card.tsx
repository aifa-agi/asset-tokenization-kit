// File: @/components/investor/asset-detail-card.tsx
// ДОБАВЛЕНО: Tooltip с информацией о 2 транзакциях

'use client'

import { useState, useEffect } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { Address, parseUnits } from 'viem'
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
    formattedUsdtBalance,
    formattedUsdtAllowance,
    approveUSDT,
    buy,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
    isPaused,
    writeError,
    confirmError,
  } = usePropertyToken(contractAddress)

  const [buyAmount, setBuyAmount] = useState('1')
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'buying' | 'success' | 'error'>('idle')

  const getPrice = (price: string): number => {
    const parsed = parseFloat(price)
    
    if (isNaN(parsed)) {
      console.warn('⚠️ Invalid price:', price)
      return 0
    }
    
    if (parsed > 0 && parsed < 0.000001) {
      return parsed * 1e12
    }
    
    return parsed
  }

  const pricePerToken = getPrice(formattedPricePerToken)
  const usdtBalance = parseFloat(formattedUsdtBalance)
  const usdtAllowance = parseFloat(formattedUsdtAllowance)

 const handleBuy = async () => {
  if (!isConnected || !address) {
    toast.error('🔌 Подключите кошелёк')
    return
  }

  if (chainId !== sepolia.id) {
    toast.error('⚠️ Переключитесь на Sepolia', {
      action: {
        label: 'Переключить',
        onClick: () => switchToSepolia(),
      },
    })
    return
  }

  if (!isReady) {
    toast.error('⏳ Web3 не готов, подождите')
    return
  }

  if (isPaused) {
    toast.error('⏸️ Контракт приостановлен')
    return
  }

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

  const totalCost = pricePerToken * amount

  if (usdtBalance < totalCost) {
    toast.error(`❌ Недостаточно USDT. Нужно ${totalCost.toFixed(2)}, у вас ${usdtBalance.toFixed(2)}`, {
      action: {
        label: 'Получить USDT',
        onClick: () => window.location.href = '/investor?tab=tokens',
      },
    })
    return
  }

  // ✅ ID для тостов, чтобы можно было их закрыть
  let approveToastId: string | number | undefined
  let buyToastId: string | number | undefined

  try {
    if (usdtAllowance < totalCost) {
      setTxStatus('approving')
      approveToastId = toast.loading('🔓 Разрешение на списание USDT...')

      const approveAmount = parseUnits((totalCost * 2).toFixed(6), 6)
      
      await approveUSDT(approveAmount)
      
      toast.success('✅ Разрешение получено', { id: approveToastId })
      approveToastId = undefined // Сбрасываем ID после успеха
      
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setTxStatus('buying')
    buyToastId = toast.loading(`🛒 Покупка ${amount} токена(ов) за ${totalCost.toFixed(2)} USDT...`)
    
    const hash = await buy(buyAmount)
    
    toast.success('📤 Транзакция отправлена', { id: buyToastId })
    buyToastId = undefined // Сбрасываем ID после успеха
    
    toast.loading('⏳ Ожидание подтверждения...', { id: 'confirm' })
    
    console.log('✅ Buy transaction:', hash)
  } catch (error: any) {
    console.error('❌ Buy error:', error)
    setTxStatus('error')

    // ✅ ВАЖНО: Закрываем все активные тосты
    if (approveToastId) toast.dismiss(approveToastId)
    if (buyToastId) toast.dismiss(buyToastId)
    toast.dismiss('confirm')

    // ✅ Сбрасываем состояние через 2 секунды
    setTimeout(() => {
      setTxStatus('idle')
    }, 2000)

    if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
      toast.error('🚫 Транзакция отклонена пользователем')
    } else if (error.message?.includes('insufficient')) {
      toast.error('💰 Недостаточно средств для оплаты газа')
    } else if (error.message?.includes('ERC20: insufficient allowance')) {
      toast.error('❌ Недостаточное разрешение USDT. Попробуйте ещё раз.')
    } else {
      toast.error('❌ Ошибка покупки: ' + (error.shortMessage || error.message))
    }
  }
}


  useEffect(() => {
    if (isConfirmed && (txStatus === 'approving' || txStatus === 'buying')) {
      setTxStatus('success')
      toast.success('✅ Покупка успешна! Токены у вас на балансе.', { id: 'confirm' })
      
      setTimeout(() => {
        setTxStatus('idle')
        setBuyAmount('1')
      }, 3000)
    }
  }, [isConfirmed, txStatus])

  const totalCost = (pricePerToken * parseInt(buyAmount || '0')).toFixed(2)
  const approveAmount = (parseFloat(totalCost) * 2).toFixed(2)
  const needApprove = usdtAllowance < parseFloat(totalCost)

  const getButtonText = () => {
    if (txStatus === 'approving') return '🔓 Разрешение...'
    if (txStatus === 'buying') return '💳 Оплата...'
    if (isWritePending) return '📤 Отправка...'
    if (isConfirming) return '⏳ Подтверждение...'
    if (txStatus === 'success') return '✅ Успешно!'
    if (txStatus === 'error') return '❌ Ошибка'
    
    return needApprove ? '🔓 Разрешить и купить' : '💰 Купить'
  }

  const isButtonDisabled = 
    !isConnected || 
    !isReady || 
    chainId !== sepolia.id || 
    isWritePending || 
    isConfirming || 
    isPaused ||
    txStatus === 'approving' ||
    txStatus === 'buying'

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {/* Изображение */}
      {imageUrl ? (
        <div className="w-full h-64 bg-gray-200 flex-shrink-0">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-6xl">🏠</span>
        </div>
      )}

      {/* Контент */}
      <div className="p-6 flex flex-col flex-1">
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

        {/* Баланс USDT */}
        {isConnected && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              💰 Ваш баланс USDT: <span className="font-bold">{usdtBalance.toFixed(2)} USDT</span>
            </p>
          </div>
        )}

        {/* Описание */}
        {description && (
          <div className="mb-4 max-h-24 overflow-y-auto">
            <p className="text-gray-700 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        )}

        {/* Нижний блок */}
        <div className="mt-auto space-y-6">
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Цена за токен</p>
              <p className="text-xl font-bold text-emerald-600">
                {pricePerToken.toFixed(2)} USDT
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
            {/* ✅ Label с tooltip */}
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Количество токенов
              </label>
              
             
{needApprove && (
  <div className="relative group">
    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold cursor-help hover:bg-blue-600 transition-colors">
      i
    </div>
    
    {/* ✅ ИСПРАВЛЕННЫЙ Tooltip content */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-[calc(100vw-3rem)] max-w-sm pointer-events-none">
      <p className="text-sm font-bold mb-2">
        ⚠️ Потребуется 2 подтверждения:
      </p>
      <ol className="text-xs space-y-2 ml-4 list-decimal">
        <li>
          <span className="font-semibold">Разрешение (Approve):</span>
          <br />
          Разрешаете контракту тратить {approveAmount} USDT.
          <br />
          <span className="italic opacity-90">💡 Деньги НЕ спишутся</span>
        </li>
        <li>
          <span className="font-semibold">Покупка (Buy):</span>
          <br />
          Спишется {totalCost} USDT → получите {buyAmount} токенов
        </li>
      </ol>
      <p className="text-xs mt-2 opacity-90 italic">
        Это стандартная процедура Web3
      </p>
    </div>
  </div>
)}

            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="number"
                min="1"
                max={formattedRemainingSupply}
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                disabled={isButtonDisabled}
                className="flex-1 px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md
                  focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  placeholder:text-gray-400"
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
