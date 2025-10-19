// File: @/app/api/assets/list/route.ts
// Описание: API endpoint для получения списка активов
// Query params: ?status=ACTIVE&limit=10&offset=0
// Возвращает: Массив активов с пагинацией


import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Получение query параметров
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'ACTIVE'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    
    console.log('📥 Fetching assets:', { status, limit, offset, search })
    
    // Построение where условия
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contractAddress: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    // Получение активов с пагинацией
    const [assets, totalCount] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              transactions: true,
              holders: true,
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ])
    
    console.log(`✅ Found ${assets.length} assets (total: ${totalCount})`)
    
    // Возврат с метаданными пагинации
    return NextResponse.json({
      assets,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    })
    
  } catch (error) {
    console.error('❌ Error fetching assets:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
