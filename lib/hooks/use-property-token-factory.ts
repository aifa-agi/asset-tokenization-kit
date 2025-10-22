// File: @/lib/hooks/use-property-token-factory.ts
// Description: React hook for PropertyTokenFactory contract
// Fixed: Added imageURI, usdt, treasury parameters to createToken

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { Address, decodeEventLog, parseEther } from 'viem'
import { useState, useEffect } from 'react'
import { propertyTokenFactoryABI } from '../web3/conntracts/property-token-factory'
import { CONTRACTS } from '../web3/conntracts/addresses'

/**
 * Parameters for creating a new property token
 */
export interface CreateTokenParams {
  name: string           // Name (e.g. "Beach House")
  symbol: string         // Symbol (e.g. "BEACH")
  maxSupply: string      // Max tokens (e.g. "10")
  pricePerToken: string  // Price per token in USDT (e.g. "1.0")
  description: string    // Description
  imageURI?: string      // ✅ Image URL (optional)
}

/**
 * Hook for working with PropertyTokenFactory
 */
export function usePropertyTokenFactory() {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [newTokenAddress, setNewTokenAddress] = useState<Address | null>(null)
  const publicClient = usePublicClient()
  
  // ==================== READ FUNCTIONS ====================
  
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
  
  const getTokenBySymbol = async (symbol: string): Promise<Address | null> => {
    try {
      const result = await publicClient?.readContract({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'tokenBySymbol',
        args: [symbol],
      })
      
      const address = result as Address
      
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
  
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  // Parse TokenCreated event to get new token address
  useEffect(() => {
    if (isConfirmed && receipt) {
      try {
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
            console.log('✅ New token created:', tokenAddress)
            setNewTokenAddress(tokenAddress)
          }
        }
        
        refetchTotalTokens()
        refetchAllTokens()
        
      } catch (error) {
        console.error('Error parsing TokenCreated event:', error)
      }
    }
  }, [isConfirmed, receipt, refetchTotalTokens, refetchAllTokens])
  
  // ==================== CREATE TOKEN FUNCTION ====================
  
  /**
   * Create new PropertyToken contract
   */
  const createToken = async (params: CreateTokenParams): Promise<`0x${string}`> => {
    try {
      // Validation
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
      
      // Check if symbol already exists
      const exists = await checkTokenExists(params.symbol.toUpperCase())
      if (exists) {
        throw new Error(`Токен с символом ${params.symbol} уже существует`)
      }
      
      // ✅ Convert maxSupply to wei (18 decimals for ERC20)
      const maxSupplyInWei = parseEther(params.maxSupply)
      
      // Convert price to wei (USDT has 6 decimals)
      const priceInWei = BigInt(Math.floor(priceNum * 1_000_000))
      
      // ✅ Get contract addresses
      const usdtAddress = CONTRACTS.mockUSDT
      const treasuryAddress = CONTRACTS.treasury
      
      console.log('🚀 Creating token:', {
        name: params.name,
        symbol: params.symbol.toUpperCase(),
        maxSupply: maxSupplyInWei.toString(),
        pricePerToken: priceInWei.toString(),
        description: params.description,
        imageURI: params.imageURI || '',
        usdt: usdtAddress,
        treasury: treasuryAddress,
      })
      
      // ✅ Call createToken with all 8 parameters
      const hash = await writeContractAsync({
        address: CONTRACTS.propertyTokenFactory,
        abi: propertyTokenFactoryABI,
        functionName: 'createToken',
        args: [
          params.name,
          params.symbol.toUpperCase(),
          maxSupplyInWei,
          priceInWei,
          params.description,
          params.imageURI || '',
          usdtAddress,
          treasuryAddress,
        ],
      })
      
      console.log('📤 Transaction sent:', hash)
      setTxHash(hash)
      return hash
      
    } catch (error: any) {
      console.error('❌ Create token error:', error)
      
      // Better error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('Транзакция отклонена пользователем')
      }
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Недостаточно ETH для gas')
      }
      
      throw error
    }
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
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
  
  const reset = () => {
    setTxHash(undefined)
    setNewTokenAddress(null)
  }
  
  // ==================== RETURN ====================
  
  return {
    // Factory data
    totalTokens: totalTokens ? Number(totalTokens) : 0,
    allTokens: (allTokens as Address[]) || [],
    
    // Create functions
    createToken,
    
    // Read functions
    checkTokenExists,
    getTokenBySymbol,
    getTokenByIndex,
    
    // Token creation status
    isCreating: isWritePending || isConfirming,
    isWritePending,
    isConfirming,
    isConfirmed,
    
    // Creation result
    txHash,
    newTokenAddress,
    
    // Errors
    writeError,
    confirmError,
    error: writeError || confirmError,
    
    // Loading status
    isLoading: isTotalTokensLoading || isAllTokensLoading,
    
    // Refetch functions
    refetchTotalTokens,
    refetchAllTokens,
    
    // Utilities
    reset,
  }
}

export type UsePropertyTokenFactoryReturn = ReturnType<typeof usePropertyTokenFactory>
