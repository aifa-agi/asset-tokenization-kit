// File: @/lib/hooks/use-property-token.ts
// ДОБАВЛЕНО: approve USDT и buy функция

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, parseUnits, formatUnits } from 'viem'
import { useState, useEffect } from 'react'
import { formatTokenAmount, parseTokenAmount, propertyTokenABI } from '../web3/conntracts/property-token'
import { CONTRACTS } from '../web3/conntracts/addresses'

// Minimal MockUSDT ABI для approve
const mockUsdtABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool', name: '' }],
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
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' },
    ],
    outputs: [{ type: 'uint256', name: '' }],
  },
] as const

export function usePropertyToken(tokenAddress: Address) {
  const { address: userAddress } = useAccount()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  
  // ==================== READ FUNCTIONS ====================
  
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'name',
  })
  
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'symbol',
  })
  
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
      staleTime: 30_000,
    },
  })
  
  const { 
    data: totalSupply,
    refetch: refetchTotalSupply 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'totalSupply',
    query: { staleTime: 30_000 },
  })
  
  const { data: maxSupply } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'maxSupply',
  })
  
  const { data: pricePerToken } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'pricePerTokenUSDT',
  })
  
  const { data: assetDescription } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'assetDescription',
  })
  
  const { 
    data: remainingSupply,
    refetch: refetchRemainingSupply 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'remainingSupply',
    query: { staleTime: 30_000 },
  })
  
  const { data: isPaused } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'paused',
  })
  
  const { 
    data: tokenInfo,
    isLoading: isTokenInfoLoading 
  } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'getTokenInfo',
  })

  // ✅ НОВОЕ: Чтение баланса USDT
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: CONTRACTS.mockUSDT,
    abi: mockUsdtABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  })

  // ✅ НОВОЕ: Проверка allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.mockUSDT,
    abi: mockUsdtABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, tokenAddress] : undefined,
    query: { enabled: !!userAddress },
  })
  
  // ==================== WRITE FUNCTIONS ====================
  
  const { 
    writeContractAsync, 
    isPending: isWritePending,
    error: writeError 
  } = useWriteContract()
  
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })
  
  useEffect(() => {
    if (isConfirmed) {
      refetchBalance()
      refetchTotalSupply()
      refetchRemainingSupply()
      refetchUsdtBalance()
      refetchAllowance()
      
      setTimeout(() => setTxHash(undefined), 3000)
    }
  }, [isConfirmed, refetchBalance, refetchTotalSupply, refetchRemainingSupply, refetchUsdtBalance, refetchAllowance])
  
  // ==================== APPROVE USDT ====================
  
  const approveUSDT = async (amount: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.mockUSDT,
        abi: mockUsdtABI,
        functionName: 'approve',
        args: [tokenAddress, amount],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Approve error:', error)
      throw error
    }
  }

  // ==================== BUY FUNCTION ====================
  
  const buy = async (amount: string) => {
    try {
      const amountInWei = parseTokenAmount(amount)
      
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'buy',
        args: [amountInWei],
      })
      
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error('Buy error:', error)
      throw error
    }
  }
  
  // ==================== MINT FUNCTION ====================
  
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
  
  // ==================== PAUSE FUNCTIONS ====================
  
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
  
  const updatePrice = async (newPrice: string) => {
    try {
      const priceInWei = parseUnits(newPrice, 6)
      
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
  
  const formattedBalance = balance ? formatTokenAmount(balance) : '0'
  const formattedTotalSupply = totalSupply ? formatTokenAmount(totalSupply) : '0'
  const formattedMaxSupply = maxSupply ? formatTokenAmount(maxSupply) : '0'
  const formattedRemainingSupply = remainingSupply ? formatTokenAmount(remainingSupply) : '0'
  const formattedPricePerToken = pricePerToken ? formatUnits(pricePerToken, 6) : '0'
  const formattedUsdtBalance = usdtBalance ? formatUnits(usdtBalance, 6) : '0'
  const formattedUsdtAllowance = usdtAllowance ? formatUnits(usdtAllowance, 6) : '0'
  
  console.log('🔍 [use-property-token] PRICE DEBUG:', {
    contract: tokenAddress.slice(0, 10) + '...',
    raw: pricePerToken?.toString(),
    formatted: formattedPricePerToken,
    decimals: 6,
  })
  
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
    usdtBalance,
    usdtAllowance,
    
    // Форматированные балансы
    formattedBalance,
    formattedTotalSupply,
    formattedMaxSupply,
    formattedRemainingSupply,
    formattedPricePerToken,
    formattedUsdtBalance,
    formattedUsdtAllowance,
    
    // Полная информация
    tokenInfo,
    
    // Статус
    isPaused,
    isLoading: isBalanceLoading || isTokenInfoLoading,
    
    // Функции записи
    approveUSDT,
    buy,
    mint,
    transfer,
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
    refetchUsdtBalance,
    refetchAllowance,
  }
}

export type UsePropertyTokenReturn = ReturnType<typeof usePropertyToken>
