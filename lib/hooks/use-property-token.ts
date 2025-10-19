// File: @/hooks/use-property-token.ts
// Описание: React хук для работы с PropertyToken контрактом
// Предоставляет функции: mint, transfer, balanceOf, totalSupply, pricePerToken
// Использует wagmi v2 API для чтения и записи в контракт


import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, formatUnits } from 'viem'
import { useState, useEffect } from 'react'
import { formatTokenAmount, parseTokenAmount, propertyTokenABI } from '../web3/conntracts/property-token'

/**
 * Хук для работы с PropertyToken контрактом
 * @param tokenAddress - Адрес контракта PropertyToken (0x...)
 * @returns Объект с функциями и данными токена
 */
export function usePropertyToken(tokenAddress: Address) {
  const { address: userAddress } = useAccount()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  
  // ==================== READ FUNCTIONS ====================
  
  // 1. Имя токена
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'name',
  })
  
  // 2. Символ токена
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'symbol',
  })
  
  // 3. Баланс пользователя
  const { 
    data: balance, 
    isLoading: isBalanceLoading,
    refetch: refetchBalance 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { 
      enabled: !!userAddress,
      staleTime: 30_000, // Кэш 30 секунд
    },
  })
  
  // 4. Общий выпуск токенов
  const { 
    data: totalSupply,
    refetch: refetchTotalSupply 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'totalSupply',
    query: { staleTime: 30_000 },
  })
  
  // 5. Максимальное количество токенов
  const { data: maxSupply } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'maxSupply',
  })
  
  // 6. Цена за токен
  const { data: pricePerToken } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'pricePerToken',
  })
  
  // 7. Описание актива
  const { data: assetDescription } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'assetDescription',
  })
  
  // 8. Оставшиеся токены для продажи
  const { 
    data: remainingSupply,
    refetch: refetchRemainingSupply 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'remainingSupply',
    query: { staleTime: 30_000 },
  })
  
  // 9. Статус паузы
  const { data: isPaused } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'paused',
  })
  
  // 10. Вся информация одним запросом
  const { 
    data: tokenInfo,
    isLoading: isTokenInfoLoading 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'getTokenInfo',
  })
  
  // ==================== WRITE FUNCTIONS ====================
  
  const { 
    writeContractAsync, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract()
  
  // Ожидание подтверждения транзакции
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Автообновление балансов после подтверждения
  useEffect(() => {
    if (isConfirmed) {
      refetchBalance()
      refetchTotalSupply()
      refetchRemainingSupply()
      
      // Сброс txHash через 3 секунды
      setTimeout(() => setTxHash(undefined), 3000)
    }
  }, [isConfirmed, refetchBalance, refetchTotalSupply, refetchRemainingSupply])
  
  // ==================== MINT FUNCTION ====================
  
  /**
   * Создать (mint) токены
   * @param to - Адрес получателя
   * @param amount - Количество токенов (в human-readable формате, например "10")
   */
  const mint = async (to: Address, amount: string) => {
    try {
      const amountInWei = parseTokenAmount(amount)
      
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'mint',
        args: [to, amountInWei],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Mint error:', error)
      throw error
    }
  }
  
  // ==================== TRANSFER FUNCTION ====================
  
  /**
   * Перевести токены другому адресу
   * @param to - Адрес получателя
   * @param amount - Количество токенов (в human-readable формате)
   */
  const transfer = async (to: Address, amount: string) => {
    try {
      const amountInWei = parseTokenAmount(amount)
      
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'transfer',
        args: [to, amountInWei],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Transfer error:', error)
      throw error
    }
  }
  
  // ==================== BURN FUNCTION ====================
  
  /**
   * Сжечь (burn) токены
   * @param amount - Количество токенов для сжигания
   */
  const burn = async (amount: string) => {
    try {
      const amountInWei = parseTokenAmount(amount)
      
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'burn',
        args: [amountInWei],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Burn error:', error)
      throw error
    }
  }
  
  // ==================== PAUSE FUNCTIONS ====================
  
  /**
   * Приостановить все операции (только PAUSER_ROLE)
   */
  const pause = async () => {
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'pause',
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Pause error:', error)
      throw error
    }
  }
  
  /**
   * Возобновить операции (только PAUSER_ROLE)
   */
  const unpause = async () => {
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'unpause',
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Unpause error:', error)
      throw error
    }
  }
  
  // ==================== UPDATE PRICE ====================
  
  /**
   * Обновить цену за токен (только DEFAULT_ADMIN_ROLE)
   * @param newPrice - Новая цена в USDT (в wei)
   */
  const updatePrice = async (newPrice: string) => {
    try {
      const priceInWei = parseUnits(newPrice, 6) // USDT имеет 6 decimals
      
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'updatePrice',
        args: [priceInWei],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Update price error:', error)
      throw error
    }
  }
  
  // ==================== FORMATTED DATA ====================
  
  // Форматированные значения для отображения в UI
  const formattedBalance = balance ? formatTokenAmount(balance) : '0'
  const formattedTotalSupply = totalSupply ? formatTokenAmount(totalSupply) : '0'
  const formattedMaxSupply = maxSupply ? formatTokenAmount(maxSupply) : '0'
  const formattedRemainingSupply = remainingSupply ? formatTokenAmount(remainingSupply) : '0'
  const formattedPricePerToken = pricePerToken ? formatUnits(pricePerToken, 6) : '0' // USDT 6 decimals
  
  // ==================== RETURN ====================
  
  return {
    // Данные токена
    name,
    symbol,
    assetDescription,
    
    // Балансы (raw)
    balance,
    totalSupply,
    maxSupply,
    remainingSupply,
    pricePerToken,
    
    // Форматированные балансы
    formattedBalance,
    formattedTotalSupply,
    formattedMaxSupply,
    formattedRemainingSupply,
    formattedPricePerToken,
    
    // Полная информация
    tokenInfo,
    
    // Статус
    isPaused,
    isLoading: isBalanceLoading || isTokenInfoLoading,
    
    // Функции записи
    mint,
    transfer,
    burn,
    pause,
    unpause,
    updatePrice,
    
    // Статус транзакций
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
    
    // Ошибки
    writeError,
    confirmError,
    
    // Refetch функции
    refetchBalance,
    refetchTotalSupply,
    refetchRemainingSupply,
  }
}

// TypeScript типы для возвращаемого значения
export type UsePropertyTokenReturn = ReturnType<typeof usePropertyToken>
