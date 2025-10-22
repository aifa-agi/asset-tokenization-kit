// File: @/lib/web3/contracts/property-token-factory.ts
// Description: ABI for PropertyTokenFactory contract
// Updated: Added missing parameters (imageURI, usdt, treasury) to createToken

/**
 * ABI PropertyTokenFactory контракта
 * Функции:
 * - createToken: Создание нового токена для домика (8 параметров)
 * - getAllTokens: Получение всех созданных токенов
 * - tokenBySymbol: Поиск токена по символу
 * - totalTokens: Количество созданных токенов
 */
export const propertyTokenFactoryABI = [
  // Read Functions
  {
    type: 'function',
    name: 'allTokens',
    stateMutability: 'view',
    inputs: [{ type: 'uint256', name: '' }],
    outputs: [{ type: 'address', name: '' }],
  },
  {
    type: 'function',
    name: 'tokenBySymbol',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: '' }],
    outputs: [{ type: 'address', name: '' }],
  },
  {
    type: 'function',
    name: 'totalTokens',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    type: 'function',
    name: 'getToken',
    stateMutability: 'view',
    inputs: [{ type: 'uint256', name: 'index' }],
    outputs: [{ type: 'address', name: '' }],
  },
  {
    type: 'function',
    name: 'getAllTokens',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]', name: '' }],
  },
  {
    type: 'function',
    name: 'tokenExists',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: 'symbol' }],
    outputs: [{ type: 'bool', name: '' }],
  },
  
  // Write Functions
  {
    type: 'function',
    name: 'createToken',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'string', name: '_name' },
      { type: 'string', name: '_symbol' },
      { type: 'uint256', name: '_maxSupply' },
      { type: 'uint256', name: '_pricePerTokenUSDT' },
      { type: 'string', name: '_description' },
      { type: 'string', name: '_imageURI' },          // ✅ ДОБАВЛЕНО
      { type: 'address', name: '_usdt' },             // ✅ ДОБАВЛЕНО
      { type: 'address', name: '_treasury' },         // ✅ ДОБАВЛЕНО
    ],
    outputs: [{ type: 'address', name: 'newToken' }],
  },
  
  // Events
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { type: 'address', indexed: true, name: 'tokenAddress' },
      { type: 'string', indexed: false, name: 'name' },
      { type: 'string', indexed: false, name: 'symbol' },
      { type: 'uint256', indexed: false, name: 'maxSupply' },
      { type: 'uint256', indexed: false, name: 'pricePerTokenUSDT' },
      { type: 'address', indexed: true, name: 'creator' },
      { type: 'uint256', indexed: false, name: 'timestamp' },
    ],
  },
] as const

// Типы для TypeScript
export type PropertyTokenFactoryABI = typeof propertyTokenFactoryABI
