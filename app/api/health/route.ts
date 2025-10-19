// File: @/app/api/health/route.ts
// Описание: Health check endpoint для мониторинга
// Проверяет: Database connection, Contract addresses


import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { validateContractAddresses } from '@/lib/web3/conntracts/addresses'

export async function GET() {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`
    
    // Проверка адресов контрактов
    const contractsValidation = validateContractAddresses()
    
    // Получение статистики
    const [totalAssets, totalTransactions, totalHolders] = await Promise.all([
      prisma.asset.count(),
      prisma.transaction.count(),
      prisma.holder.count(),
    ])
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        assets: totalAssets,
        transactions: totalTransactions,
        holders: totalHolders,
      },
      contracts: {
        valid: contractsValidation.valid,
        missing: contractsValidation.missing,
      },
    })
    
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
