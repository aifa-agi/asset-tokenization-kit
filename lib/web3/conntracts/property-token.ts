// File: @/lib/web3/contracts/property-token.ts
// Описание: ABI контракта PropertyToken для токенизации недвижимости
// Упрощённая версия на основе SettleMint ATKDeposit
// Используется для mint, transfer, balanceOf и других операций с токенами


/**
 * ABI PropertyToken контракта
 * Функции:
 * - mint: Создание токенов (только MINTER_ROLE)
 * - transfer: Перевод токенов
 * - balanceOf: Проверка баланса
 * - totalSupply: Общий выпуск
 * - remainingSupply: Оставшиеся токены
 * - pause/unpause: Экстренная остановка
 * - updatePrice: Обновление цены (только admin)
 */
export const propertyTokenABI = [
  // Read Functions
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string', name: '' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string', name: '' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8', name: '' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
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
    name: 'maxSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'pricePerToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'assetDescription',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string', name: '' }],
  },
  {
    type: 'function',
    name: 'remainingSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool', name: '' }],
  },
  {
    type: 'function',
    name: 'getTokenInfo',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { type: 'string', name: '_name' },
      { type: 'string', name: '_symbol' },
      { type: 'uint256', name: '_totalSupply' },
      { type: 'uint256', name: '_maxSupply' },
      { type: 'uint256', name: '_pricePerToken' },
      { type: 'string', name: '_description' },
      { type: 'bool', name: '_paused' },
    ],
  },
  {
    type: 'function',
    name: 'hasRole',
    stateMutability: 'view',
    inputs: [
      { type: 'bytes32', name: 'role' },
      { type: 'address', name: 'account' },
    ],
    outputs: [{ type: 'bool', name: '' }],
  },
  
  // Write Functions
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool', name: '' }],
  },
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
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'address', name: 'from' },
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
    ],
    outputs: [{ type: 'bool', name: '' }],
  },
  {
    type: 'function',
    name: 'burn',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'amount' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updatePrice',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'newPrice' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unpause',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  
  // Events
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { type: 'address', indexed: true, name: 'from' },
      { type: 'address', indexed: true, name: 'to' },
      { type: 'uint256', indexed: false, name: 'value' },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { type: 'address', indexed: true, name: 'owner' },
      { type: 'address', indexed: true, name: 'spender' },
      { type: 'uint256', indexed: false, name: 'value' },
    ],
  },
  {
    type: 'event',
    name: 'TokenMinted',
    inputs: [
      { type: 'address', indexed: true, name: 'to' },
      { type: 'uint256', indexed: false, name: 'amount' },
      { type: 'uint256', indexed: false, name: 'timestamp' },
    ],
  },
  {
    type: 'event',
    name: 'PriceUpdated',
    inputs: [
      { type: 'uint256', indexed: false, name: 'oldPrice' },
      { type: 'uint256', indexed: false, name: 'newPrice' },
      { type: 'uint256', indexed: false, name: 'timestamp' },
    ],
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [{ type: 'address', indexed: false, name: 'account' }],
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [{ type: 'address', indexed: false, name: 'account' }],
  },
] as const

// Типы для TypeScript
export type PropertyTokenABI = typeof propertyTokenABI

// Role константы (для проверки прав доступа)
export const PROPERTY_TOKEN_ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6' as const, // keccak256("MINTER_ROLE")
  PAUSER_ROLE: '0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a' as const, // keccak256("PAUSER_ROLE")
} as const

// Helper функция для форматирования токенов (18 decimals → человеческий формат)
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals)
  const wholePart = amount / divisor
  const fractionalPart = amount % divisor
  
  if (fractionalPart === 0n) {
    return wholePart.toString()
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
  const trimmed = fractionalStr.replace(/0+$/, '')
  
  return `${wholePart}.${trimmed}`
}

// Helper функция для парсинга токенов (человеческий формат → wei)
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [whole, fractional = '0'] = amount.split('.')
  const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFractional)
}
