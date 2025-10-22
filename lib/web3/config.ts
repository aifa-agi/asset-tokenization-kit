// File: @/lib/web3/config.ts
// ИСПРАВЛЕНО: Возвращаем getDefaultConfig но с правильным transport

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 30,
      retry: (failureCount, error: Error) => {
        if (error.message.includes('User rejected') || 
            error.message.includes('cancel') || 
            error.message.includes('denied')) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

// Получаем RPC URL
const getRpcUrl = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
  if (rpcUrl) {
    console.log(`✅ Используется RPC: ${rpcUrl}`)
    return rpcUrl
  }
  
  console.warn('⚠️ NEXT_PUBLIC_RPC_URL не установлен')
  return 'https://rpc.sepolia.org'
}

// ✅ ИСПОЛЬЗУЕМ getDefaultConfig + кастомный transport
export const config = getDefaultConfig({
  appName: 'Property Tokenization',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
  // ✅ ДОБАВЛЯЕМ кастомный transport с правильными настройками
  transports: {
    [sepolia.id]: http(getRpcUrl(), {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
})

export const rainbowTheme = {
  lightMode: {
    accentColor: '#10b981',
    accentColorForeground: '#ffffff',
    borderRadius: 'medium' as const,
  },
  darkMode: {
    accentColor: '#10b981',
    accentColorForeground: '#ffffff',
    borderRadius: 'medium' as const,
  },
}

export type { Config } from 'wagmi'
