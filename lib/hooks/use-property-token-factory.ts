// File: @/hooks/use-property-token-factory.ts
// Описание: React хук для работы с PropertyTokenFactory контрактом
// Предоставляет функции: createToken, getAllTokens, tokenBySymbol
// Используется админом для создания новых токенов недвижимости


import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { Address, decodeEventLog } from 'viem'
import { useState, useEffect } from 'react'
import { propertyTokenFactoryABI } from '../web3/conntracts/property-token-factory'
import { CONTRACTS } from '../web3/conntracts/addresses'

/**
 * Параметры для создания нового токена
 */
export interface CreateTokenParams {
  name: string           // Название (например "Домик у моря")
  symbol: string         // Символ (например "HOUSE1")
  maxSupply: string      // Макс. количество токенов (например "10")
  pricePerToken: string  // Цена за токен в USDT (например "1.0")
  description: string    // Описание домика
}

/**
 * Хук для работы с PropertyTokenFactory
 * @returns Объект с функциями и данными Factory
 */
export function usePropertyTokenFactory() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [newTokenAddress, setNewTokenAddress] = useState<Address | null>(null)
  const publicClient = usePublicClient()
  
  // ==================== READ FUNCTIONS ====================
  
  // 1. Общее количество созданных токенов
  const { 
    data: totalTokens,
    isLoading: isTotalTokensLoading,
    refetch: refetchTotalTokens 
  } = useReadContract({
    address: CONTRACTS.propertyTokenFactory,
    abi: propertyTokenFactoryABI,
    functionName: 'totalTokens',
    query: { staleTime: 30_000 },
  })
  
  // 2. Все созданные токены (массив адресов)
  const { 
    data: allTokens,
    isLoading: isAllTokensLoading,
    refetch: refetchAllTokens 
  } = useReadContract({
    address: CONTRACTS.propertyTokenFactory,
    abi: propertyTokenFactoryABI,
    functionName: 'getAllTokens',
    query: { staleTime: 30_000 },
  })
  
  // 3. Проверка существования токена по символу
  const checkTokenExists = async (symbol: string): Promise<boolean> => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'tokenExists',
        args: [symbol],
      })
      return result as boolean
    } catch (error) {
      console.error('Check token exists error:', error)
      return false
    }
  }
  
  // 4. Получить адрес токена по символу
  const getTokenBySymbol = async (symbol: string): Promise<Address | null> => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'tokenBySymbol',
        args: [symbol],
      })
      
      const address = result as Address
      
      // Проверка что адрес не нулевой (токен существует)
      if (address === '0x0000000000000000000000000000000000000000') {
        return null
      }
      
      return address
    } catch (error) {
      console.error('Get token by symbol error:', error)
      return null
    }
  }
  
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
    error: confirmError,
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Парсинг события TokenCreated для получения адреса нового токена
  useEffect(() => {
    if (isConfirmed && receipt) {
      try {
        // Ищем событие TokenCreated в логах транзакции
        const tokenCreatedLog = receipt.logs.find(log => {
          try {
            const decoded = decodeEventLog({
              abi: propertyTokenFactoryABI,
              data: log.data,
              topics: log.topics,
            })
            return decoded.eventName === 'TokenCreated'
          } catch {
            return false
          }
        })
        
        if (tokenCreatedLog) {
          const decoded = decodeEventLog({
            abi: propertyTokenFactoryABI,
            data: tokenCreatedLog.data,
            topics: tokenCreatedLog.topics,
          })
          
          if (decoded.eventName === 'TokenCreated') {
            const tokenAddress = decoded.args.tokenAddress
            console.log('✅ Новый токен создан:', tokenAddress)
            setNewTokenAddress(tokenAddress)
          }
        }
        
        // Обновляем списки
        refetchTotalTokens()
        refetchAllTokens()
        
        // Сброс через 5 секунд
        setTimeout(() => {
          setTxHash(undefined)
          setNewTokenAddress(null)
        }, 5000)
        
      } catch (error) {
        console.error('Error parsing TokenCreated event:', error)
      }
    }
  }, [isConfirmed, receipt, refetchTotalTokens, refetchAllTokens])
  
  // ==================== CREATE TOKEN FUNCTION ====================
  
  /**
   * Создать новый PropertyToken контракт
   * @param params - Параметры токена (название, символ, количество, цена, описание)
   * @returns Transaction hash
   */
  const createToken = async (params: CreateTokenParams): Promise<`0x${string}`> => {
    try {
      // Валидация параметров
      if (!params.name || params.name.length < 3) {
        throw new Error('Название должно быть минимум 3 символа')
      }
      
      if (!params.symbol || params.symbol.length < 2) {
        throw new Error('Символ должен быть минимум 2 символа')
      }
      
      const maxSupplyNum = parseInt(params.maxSupply)
      if (isNaN(maxSupplyNum) || maxSupplyNum <= 0) {
        throw new Error('Количество токенов должно быть > 0')
      }
      
      const priceNum = parseFloat(params.pricePerToken)
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Цена должна быть > 0')
      }
      
      // Проверка существования символа
      const exists = await checkTokenExists(params.symbol.toUpperCase())
      if (exists) {
        throw new Error(`Токен с символом ${params.symbol} уже существует`)
      }
      
      // Конвертация цены в wei (USDT имеет 6 decimals)
      const priceInWei = BigInt(Math.floor(priceNum * 1_000_000)) // 6 decimals
      
      console.log('🚀 Создание токена:', {
        name: params.name,
        symbol: params.symbol.toUpperCase(),
        maxSupply: BigInt(maxSupplyNum),
        pricePerToken: priceInWei,
        description: params.description,
      })
      
      // Вызов createToken в Factory контракте
      const hash = await writeContractAsync({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'createToken',
        args: [
          params.name,
          params.symbol.toUpperCase(),
          BigInt(maxSupplyNum),
          priceInWei,
          params.description,
        ],
      })
      
      console.log('📤 Транзакция отправлена:', hash)
      setTxHash(hash)
      return hash
      
    } catch (error) {
      console.error('❌ Create token error:', error)
      throw error
    }
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Получить токен по индексу
   */
  const getTokenByIndex = async (index: number): Promise<Address | null> => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'getToken',
        args: [BigInt(index)],
      })
      return result as Address
    } catch (error) {
      console.error('Get token by index error:', error)
      return null
    }
  }
  
  /**
   * Сбросить состояние создания токена
   */
  const reset = () => {
    setTxHash(undefined)
    setNewTokenAddress(null)
  }
  
  // ==================== RETURN ====================
  
  return {
    // Данные Factory
    totalTokens: totalTokens ? Number(totalTokens) : 0,
    allTokens: (allTokens as Address[]) || [],
    
    // Функции создания
    createToken,
    
    // Функции чтения
    checkTokenExists,
    getTokenBySymbol,
    getTokenByIndex,
    
    // Статус создания токена
    isCreating: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    
    // Результат создания
    txHash,
    newTokenAddress,
    
    // Ошибки
    writeError,
    confirmError,
    error: writeError || confirmError,
    
    // Статус загрузки
    isLoading: isTotalTokensLoading || isAllTokensLoading,
    
    // Refetch функции
    refetchTotalTokens,
    refetchAllTokens,
    
    // Утилиты
    reset,
  }
}

// TypeScript типы для возвращаемого значения
export type UsePropertyTokenFactoryReturn = ReturnType<typeof usePropertyTokenFactory>
