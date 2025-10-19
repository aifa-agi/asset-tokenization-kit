// File: @/app/api/upload-image/route.ts
// Описание: Загрузка изображений в Vercel Blob


import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB' },
        { status: 400 }
      )
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Загрузка в Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log('✅ Image uploaded to Vercel Blob:', blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
    })

  } catch (error: any) {
    console.error('❌ Image upload error:', error)

    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
