// File: @/lib/web3/contracts/addresses.ts
// Описание: Адреса задеплоенных контрактов в Sepolia
// Обновляется после деплоя контрактов через Remix


import { Address } from 'viem'

// Sepolia Testnet Chain ID
export const SEPOLIA_CHAIN_ID = 11155111

// Адреса контрактов (из .env.local)
export const CONTRACTS = {
  // PropertyTokenFactory - фабрика для создания токенов
  propertyTokenFactory: (process.env.NEXT_PUBLIC_FACTORY_CONTRACT || '0x0000000000000000000000000000000000000000') as Address,
  
  // Mock USDT для тестирования оплаты
  mockUSDT: (process.env.NEXT_PUBLIC_USDT_CONTRACT || '0x0000000000000000000000000000000000000000') as Address,
} as const

// Проверка что адреса установлены
export function validateContractAddresses(): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  
  if (CONTRACTS.propertyTokenFactory === '0x0000000000000000000000000000000000000000') {
    missing.push('NEXT_PUBLIC_FACTORY_CONTRACT')
  }
  
  if (CONTRACTS.mockUSDT === '0x0000000000000000000000000000000000000000') {
    missing.push('NEXT_PUBLIC_USDT_CONTRACT')
  }
  
  return {
    valid: missing.length === 0,
    missing,
  }
}

// Helper для получения explorer URL
export function getExplorerUrl(type: 'address' | 'tx', value: string): string {
  const baseUrl = 'https://sepolia.etherscan.io'
  return `${baseUrl}/${type}/${value}`
}
