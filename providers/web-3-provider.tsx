// File: @/providers/Web3Provider.tsx
// Описание: Финальный Provider с исправленной темой и правильными хуками.
// Theme теперь использует правильный enum для borderRadius.
// Экспортируем только базовые хуки + отдельно контрактные хуки для ясности.
// Контрактные хуки импортируются из 'wagmi' напрямую в компонентах.

'use client'

import {
  WagmiProvider,
  useAccount,
  useConnect,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from 'wagmi'
import {
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { 
  QueryClientProvider 
} from '@tanstack/react-query'
import { 
  config, 
  queryClient,
  rainbowTheme 
} from '@/lib/web3/config'
import { ReactNode, useEffect } from 'react'
import { sepolia } from 'wagmi/chains'

// Обязательный CSS
import '@rainbow-me/rainbowkit/styles.css'

// Interface для props
interface Web3ProviderProps {
  children: ReactNode
}

// Компонент автоподключения
function AutoConnectWallet() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  
  useEffect(() => {
    if (isConnected || connectors.length === 0) return
    
    try {
      const savedData = localStorage.getItem('wagmi.store')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const savedConnectorId = parsed.state?.selectedConnectorId
        
        if (savedConnectorId) {
          const savedConnector = connectors.find(
            connector => connector.uid === savedConnectorId
          )
          
          if (savedConnector) {
            console.log(`🔄 Автоподключение: ${savedConnector.name}`)
            connect({ connector: savedConnector })
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка автоподключения:', error)
    }
  }, [isConnected, connect, connectors])
  
  return null
}

// Кастомный хук Web3 статуса (без изменений)
export function useWeb3Status() {
  const { 
    address, 
    isConnected, 
    chainId,
    chain 
  } = useAccount()
  
  const publicClient = usePublicClient({ 
    chainId: chainId || sepolia.id 
  })
  const walletClient = useWalletClient({ 
    chainId: chainId || sepolia.id 
  })
  const { disconnect } = useDisconnect()
  
  const isCorrectChain = chainId === sepolia.id
  const isReady = isConnected && isCorrectChain && publicClient && walletClient
  
  const networkName = chain?.name || 'Unknown'
  const explorerUrl = chain?.blockExplorers?.default.url || 'https://sepolia.etherscan.io'
  
  const switchToSepolia = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Установите MetaMask или другой Web3 кошелёк!')
      return
    }
    
    const chainIdHex = '0xaa36a7'
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
      console.log('✅ Переключено на Sepolia!')
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          })
          console.log('✅ Sepolia добавлена!')
        } catch (addError) {
          console.error('❌ Ошибка добавления Sepolia:', addError)
          alert('Ошибка добавления Sepolia сети')
        }
      } else {
        console.error('❌ Ошибка переключения:', switchError)
      }
    }
  }
  
  return {
    isConnected,
    address: address || null,
    chainId,
    chain,
    networkName,
    explorerUrl,
    isCorrectChain,
    isReady,
    publicClient: publicClient || null,
    walletClient: walletClient || null,
    disconnect,
    switchToSepolia,
  }
}

// Главный провайдер (ИСПРАВЛЕННАЯ тема)
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          // ИСПРАВЛЕНО: правильный enum для borderRadius
          theme={lightTheme({
            accentColor: rainbowTheme.lightMode.accentColor,
            accentColorForeground: rainbowTheme.lightMode.accentColorForeground,
            borderRadius: 'medium', // Enum значение для RainbowKit v2
          })}
          initialChain={sepolia}
        >
          <AutoConnectWallet />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// БАЗОВЫЕ хуки (экспортируем только то, что точно есть в wagmi)
export { 
  useAccount,
  useConnect, 
  useDisconnect, 
  usePublicClient, 
  useWalletClient,
}


