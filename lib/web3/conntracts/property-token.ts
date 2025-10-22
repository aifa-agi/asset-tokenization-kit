// File: @/lib/web3/contracts/property-token.ts
// ИСПРАВЛЕНО: pricePerToken → pricePerTokenUSDT, обновлён getTokenInfo

/**
 * ABI PropertyToken контракта
 * Функции:
 * - mint: Создание токенов (только owner)
 * - transfer: Перевод токенов
 * - balanceOf: Проверка баланса
 * - totalSupply: Общий выпуск
 * - remainingSupply: Оставшиеся токены
 * - pause/unpause: Экстренная остановка
 * - updatePrice: Обновление цены (только owner)
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
    name: 'pricePerTokenUSDT',  // ✅ ИСПРАВЛЕНО
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
    name: 'imageURI',  // ✅ ДОБАВЛЕНО
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string', name: '' }],
  },
  {
    type: 'function',
    name: 'owner',  // ✅ ДОБАВЛЕНО
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address', name: '' }],
  },
  {
    type: 'function',
    name: 'treasury',  // ✅ ДОБАВЛЕНО
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address', name: '' }],
  },
  {
    type: 'function',
    name: 'usdt',  // ✅ ДОБАВЛЕНО
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address', name: '' }],
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
      { type: 'uint256', name: '_pricePerTokenUSDT' },  // ✅ ИСПРАВЛЕНО
      { type: 'string', name: '_description' },
      { type: 'string', name: '_imageURI' },  // ✅ ДОБАВЛЕНО
      { type: 'bool', name: '_paused' },
      { type: 'address', name: '_usdt' },  // ✅ ДОБАВЛЕНО
      { type: 'address', name: '_treasury' },  // ✅ ДОБАВЛЕНО
      { type: 'address', name: '_owner' },  // ✅ ДОБАВЛЕНО
    ],
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
    name: 'buy',  // ✅ ДОБАВЛЕНО
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'amountTokens' }],
    outputs: [{ type: 'uint256', name: 'usdtPaid' }],
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
    name: 'updatePrice',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'newPricePerTokenUSDT' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setTreasury',  // ✅ ДОБАВЛЕНО
    stateMutability: 'nonpayable',
    inputs: [{ type: 'address', name: 'newTreasury' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setMetadata',  // ✅ ДОБАВЛЕНО
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'string', name: '_imageURI' },
      { type: 'string', name: '_description' },
    ],
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
    name: 'Bought',  // ✅ ДОБАВЛЕНО
    inputs: [
      { type: 'address', indexed: true, name: 'buyer' },
      { type: 'uint256', indexed: false, name: 'tokens' },
      { type: 'uint256', indexed: false, name: 'usdtPaid' },
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
  {
    type: 'event',
    name: 'TreasuryChanged',  // ✅ ДОБАВЛЕНО
    inputs: [
      { type: 'address', indexed: false, name: 'oldTreasury' },
      { type: 'address', indexed: false, name: 'newTreasury' },
    ],
  },
  {
    type: 'event',
    name: 'MetadataUpdated',  // ✅ ДОБАВЛЕНО
    inputs: [
      { type: 'string', indexed: false, name: 'imageURI' },
      { type: 'string', indexed: false, name: 'description' },
    ],
  },
] as const

export type PropertyTokenABI = typeof propertyTokenABI

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
