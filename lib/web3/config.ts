// File: @/lib/web3/config.ts
// Описание: Финальная конфигурация (без изменений в логике).
// Исправлена theme с правильными enum значениями для RainbowKit v2.2.9.
// borderRadius теперь 'medium' (enum), а не string.

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'

// QueryClient для кэширования
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

// Кастомный транспорт для Sepolia
const createSepoliaTransport = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
  if (rpcUrl) {
    console.log(`✅ Используется RPC: ${rpcUrl}`)
    return http(rpcUrl)
  }
  
  console.warn('⚠️ NEXT_PUBLIC_RPC_URL не установлен, используется публичный RPC Sepolia')
  return http('https://rpc.sepolia.org')
}

// Основная конфигурация
export const config = getDefaultConfig({
  appName: 'Property Tokenization',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: createSepoliaTransport(),
  },
})

// ИСПРАВЛЕННАЯ тема для RainbowKit v2 (правильные enum значения)
export const rainbowTheme = {
  lightMode: {
    accentColor: '#10b981', // Emerald green
    accentColorForeground: '#ffffff',
    // borderRadius теперь enum: 'small' | 'medium' | 'large' | 'none'
    borderRadius: 'medium' as const, // Типизированное значение
  },
  darkMode: {
    accentColor: '#10b981',
    accentColorForeground: '#ffffff',
    borderRadius: 'medium' as const,
  },
}

// Типы
export type { Config } from 'wagmi'
