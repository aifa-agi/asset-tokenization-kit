// File: @/lib/db/prisma.ts
// Описание: Инициализация Prisma Client с Neon Serverless Adapter.
// Использует WebSocket для serverless окружений (Vercel).
// Поддерживает connection pooling для оптимальной производительности.

import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Настройка WebSocket для Neon (требуется для serverless окружений)
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Функция для создания единственного экземпляра Prisma Client
const prismaClientSingleton = () => {
  // НОВЫЙ API: передаём PoolConfig напрямую в PrismaNeon
  const adapter = new PrismaNeon({ connectionString })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Глобальный тип для хранения Prisma Client
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Создаём или используем существующий экземпляр (важно для Hot Reload в Next.js)
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

export default prisma
