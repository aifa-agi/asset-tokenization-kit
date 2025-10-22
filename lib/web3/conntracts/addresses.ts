// File: @/lib/web3/contracts/addresses.ts
// ИСПРАВЛЕНО: правильные имена переменных из .env

import { Address } from 'viem'

export const SEPOLIA_CHAIN_ID = 11155111

export const CONTRACTS = {
  // ✅ ИСПРАВЛЕНО: было FACTORY_CONTRACT, стало PROPERTYTOKENFACTORY_CONTRACT
  propertyTokenFactory: (
    process.env.NEXT_PUBLIC_PROPERTYTOKENFACTORY_CONTRACT || 
    '0x0000000000000000000000000000000000000000'
  ) as Address,
  
  // ✅ ИСПРАВЛЕНО: было USDT_CONTRACT, стало MOCKUSDT_CONTRACT
  mockUSDT: (
    process.env.NEXT_PUBLIC_MOCKUSDT_CONTRACT || 
    '0x0000000000000000000000000000000000000000'
  ) as Address,
  
  // ✅ Treasury (используем USDT как fallback)
  treasury: (
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS || 
    process.env.NEXT_PUBLIC_MOCKUSDT_CONTRACT ||
    '0x0000000000000000000000000000000000000000'
  ) as Address,
} as const

export function validateContractAddresses(): { 
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []
  
  if (CONTRACTS.propertyTokenFactory === '0x0000000000000000000000000000000000000000') {
    missing.push('NEXT_PUBLIC_PROPERTYTOKENFACTORY_CONTRACT')
  }
  
  if (CONTRACTS.mockUSDT === '0x0000000000000000000000000000000000000000') {
    missing.push('NEXT_PUBLIC_MOCKUSDT_CONTRACT')
  }
  
  if (
    CONTRACTS.treasury === '0x0000000000000000000000000000000000000000' ||
    CONTRACTS.treasury === CONTRACTS.mockUSDT
  ) {
    warnings.push('NEXT_PUBLIC_TREASURY_ADDRESS not set, using USDT address as fallback')
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

export function getExplorerUrl(type: 'address' | 'tx', value: string): string {
  const baseUrl = 'https://sepolia.etherscan.io'
  return `${baseUrl}/${type}/${value}`
}

export function getContractAddresses() {
  const validation = validateContractAddresses()
  
  if (!validation.valid) {
    console.error('❌ Missing contract addresses:', validation.missing)
    throw new Error(`Missing env variables: ${validation.missing.join(', ')}`)
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Contract warnings:', validation.warnings)
  }
  
  return CONTRACTS
}
