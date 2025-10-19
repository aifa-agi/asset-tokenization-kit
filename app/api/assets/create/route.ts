// File: @/app/api/assets/create/route.ts
// Описание: API endpoint для сохранения нового актива в базу данных
// Принимает: contractAddress, name, description, totalTokens, pricePerToken, imageUrl, createdBy
// Возвращает: Созданный объект Asset


import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { z } from 'zod'

// Схема валидации входных данных
const createAssetSchema = z.object({
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  symbol: z.string().min(2, 'Symbol must be at least 2 characters').optional(),
  description: z.string().optional(),
  totalTokens: z.number().int().positive('Total tokens must be positive'),
  pricePerToken: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional().nullable(),
  createdBy: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid creator address'),
})

export async function POST(request: NextRequest) {
  try {
    // Парсинг body
    const body = await request.json()
    
    console.log('📥 Received asset creation request:', body)
    
    // Валидация данных
    const validatedData = createAssetSchema.parse(body)
    
    // Проверка уникальности contractAddress
    const existingAsset = await prisma.asset.findUnique({
      where: { contractAddress: validatedData.contractAddress },
    })
    
    if (existingAsset) {
      return NextResponse.json(
        { error: 'Asset with this contract address already exists' },
        { status: 409 }
      )
    }
    
    // Создание актива в БД
    const asset = await prisma.asset.create({
      data: {
        contractAddress: validatedData.contractAddress,
        name: validatedData.name,
        description: validatedData.description || null,
        imageUrl: validatedData.imageUrl || null,
        totalTokens: validatedData.totalTokens,
        pricePerToken: validatedData.pricePerToken,
        currency: 'USDT',
        createdBy: validatedData.createdBy,
        status: 'ACTIVE',
      },
    })
    
    console.log('✅ Asset created in DB:', asset.id)
    
    // Возврат созданного актива
    return NextResponse.json(asset, { status: 201 })
    
  } catch (error) {
    console.error('❌ Error creating asset:', error)
    
    // Ошибка валидации Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
           details: error.issues 
        },
        { status: 400 }
      )
    }
    
    // Ошибка Prisma (например unique constraint)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Asset already exists' },
        { status: 409 }
      )
    }
    
    // Общая ошибка
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
