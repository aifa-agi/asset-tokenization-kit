// File: @/providers/web-3-provider.tsx
// ИСПРАВЛЕНО: Обновлённый provider с правильной конфигурацией

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

import '@rainbow-me/rainbowkit/styles.css'

interface Web3ProviderProps {
  children: ReactNode
}

function AutoConnectWallet() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  
  useEffect(() => {
    if (isConnected || connectors.length === 0) return
    
    try {
      const savedData = localStorage.getItem('wagmi.store')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const savedConnectorId = parsed.state?.connections?.value?.[0]?.connector
        
        if (savedConnectorId) {
          const savedConnector = connectors.find(
            connector => connector.id === savedConnectorId
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
  const { data: walletClient } = useWalletClient({ 
    chainId: chainId || sepolia.id 
  })
  const { disconnect } = useDisconnect()
  
  const isCorrectChain = chainId === sepolia.id
  const isReady = isConnected && isCorrectChain && !!publicClient && !!walletClient
  
  const networkName = chain?.name || 'Unknown'
  const explorerUrl = chain?.blockExplorers?.default.url || 'https://sepolia.etherscan.io'
  
  const switchToSepolia = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Установите MetaMask!')
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
          alert('Ошибка добавления Sepolia')
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

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: rainbowTheme.lightMode.accentColor,
            accentColorForeground: rainbowTheme.lightMode.accentColorForeground,
            borderRadius: 'medium',
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

export { 
  useAccount,
  useConnect, 
  useDisconnect, 
  usePublicClient, 
  useWalletClient,
}
