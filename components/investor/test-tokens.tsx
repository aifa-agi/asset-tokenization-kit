// File: @/components/investor/test-tokens.tsx
// Faucet для получения тестовых USDT и ETH

'use client'

import { useState } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { toast } from 'sonner'
import { CONTRACTS } from '@/lib/web3/conntracts/addresses'

// Minimal MockUSDT ABI
const mockUsdtABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8', name: '' }],
  },
] as const

export function TestTokens() {
  const { address, isConnected } = useWeb3Status()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // Чтение баланса USDT
  const { data: usdtBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.mockUSDT,
    abi: mockUsdtABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Write функция для mint
  const { writeContractAsync, isPending } = useWriteContract()

  // Ожидание подтверждения
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Автообновление баланса после подтверждения
  if (isSuccess && txHash) {
    refetchBalance()
    toast.success('✅ USDT получены!', { id: 'mint-success' })
    setTxHash(undefined)
  }

  // Функция получения USDT
  const handleMintUSDT = async () => {
    if (!address) {
      toast.error('🔌 Подключите кошелёк')
      return
    }

    try {
      const toastId = toast.loading('🪙 Получение 10 USDT...')

      // Mint 10 USDT (6 decimals)
      const hash = await writeContractAsync({
        address: CONTRACTS.mockUSDT,
        abi: mockUsdtABI,
        functionName: 'mint',
        args: [address, parseUnits('10', 6)], // 10 USDT
      })

      setTxHash(hash)
      toast.success('📤 Транзакция отправлена', { id: toastId })
      toast.loading('⏳ Ожидание подтверждения...', { id: 'mint-success' })

      console.log('✅ Mint USDT transaction:', hash)
    } catch (error: any) {
      console.error('❌ Mint error:', error)

      if (error.message?.includes('User rejected')) {
        toast.error('🚫 Транзакция отклонена')
      } else {
        toast.error('❌ Ошибка: ' + (error.shortMessage || error.message))
      }
    }
  }

  // Форматирование баланса
  const formattedBalance = usdtBalance ? formatUnits(usdtBalance, 6) : '0'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-lg border-2 border-orange-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🪙</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Тестовые токены
          </h2>
          <p className="text-gray-600">
            Получите бесплатные USDT для тестирования покупки активов
          </p>
        </div>

        {/* Wallet Status */}
        {!isConnected ? (
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-6 text-center">
            <p className="text-yellow-800 font-medium">
              🔌 Подключите кошелёк для получения токенов
            </p>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="bg-white rounded-lg p-6 mb-6 border-2 border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ваш баланс USDT</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formattedBalance} USDT
                  </p>
                </div>
                <div className="text-5xl">💰</div>
              </div>
            </div>

            {/* Mint Button */}
            <button
              onClick={handleMintUSDT}
              disabled={isPending || isConfirming}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all shadow-lg
                ${isPending || isConfirming
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 hover:shadow-xl'
                }`}
            >
              {isPending ? '📤 Отправка...' : isConfirming ? '⏳ Подтверждение...' : '🎁 Получить 10 USDT'}
            </button>

            {/* Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">ℹ️</span>
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Как это работает?</p>
                  <p className="text-blue-700">
                    При нажатии кнопки MetaMask откроется для подтверждения. 
                    Вы платите только gas (≈ $0.01), USDT выдаются бесплатно.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-2xl">💡</span>
                <div className="text-sm text-green-900">
                  <p className="font-medium mb-1">Что дальше?</p>
                  <p className="text-green-700">
                    После получения USDT перейдите в "Каталог активов" 
                    и купите токены недвижимости.
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Link */}
            {txHash && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-900 mb-2">
                  📡 Транзакция
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {txHash}
                </a>
              </div>
            )}

            {/* Contract Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                🔗 MockUSDT контракт
              </p>
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACTS.mockUSDT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:underline break-all font-mono"
              >
                {CONTRACTS.mockUSDT}
              </a>
            </div>
          </>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">📚 Полезная информация</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Это тестовая сеть Sepolia — все токены бесплатны</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Для gas нужен тестовый ETH (получите на sepoliafaucet.com)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Можно получать USDT неограниченное количество раз</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Транзакции подтверждаются за 10-30 секунд</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
