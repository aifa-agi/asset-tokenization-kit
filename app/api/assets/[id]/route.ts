// File: @/app/api/assets/[id]/route.ts
// Описание: API endpoint для получения одного актива по ID или contractAddress
// URL: /api/assets/cuid123 или /api/assets/0x...
// Возвращает: Объект Asset с transactions и holders


import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    console.log('📥 Fetching asset:', id)
    
    // Определяем тип ID (cuid или contractAddress)
    const isAddress = id.startsWith('0x')
    
    // Поиск актива
    const asset = await prisma.asset.findUnique({
      where: isAddress 
        ? { contractAddress: id }
        : { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Последние 10 транзакций
        },
        holders: {
          where: { balance: { gt: 0 } }, // Только с балансом > 0
          orderBy: { balance: 'desc' },
        },
        _count: {
          select: {
            transactions: true,
            holders: true,
          },
        },
      },
    })
    
    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Asset found:', asset.id)
    
    return NextResponse.json(asset)
    
  } catch (error) {
    console.error('❌ Error fetching asset:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT endpoint для обновления актива (опционально)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('📥 Updating asset:', id, body)
    
    // Разрешённые поля для обновления
    const allowedFields = ['description', 'imageUrl', 'status']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    // Обновление актива
    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
    })
    
    console.log('✅ Asset updated:', asset.id)
    
    return NextResponse.json(asset)
    
  } catch (error) {
    console.error('❌ Error updating asset:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
