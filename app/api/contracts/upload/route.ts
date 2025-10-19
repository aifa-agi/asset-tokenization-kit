// File: @/app/api/contracts/upload/route.ts
// Описание: Сохранение .sol файлов в GitHub
// Основан на вашем паттерне с GitHub API


import { NextRequest, NextResponse } from 'next/server'

interface ContractFile {
  name: string
  content: string
  size: number
}

interface UploadResponse {
  success: boolean
  filesUploaded: number
  files?: string[]
  error?: string
  details?: any
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<UploadResponse>> {
  const requestId = crypto.randomUUID()

  console.log(`\n${'='.repeat(70)}`)
  console.log(`[${requestId}] 🚀 NEW REQUEST: Upload Contracts API`)
  console.log(`${'='.repeat(70)}`)

  try {
    // Проверка GitHub конфигурации
    const githubToken = process.env.GITHUB_TOKEN?.trim()
    const githubRepo = process.env.GITHUB_REPO?.trim()

    if (!githubToken || !githubRepo) {
      console.error(`[${requestId}] ❌ Missing GitHub configuration`)

      return NextResponse.json(
        {
          success: false,
          filesUploaded: 0,
          error: 'GitHub configuration missing',
          details: {
            hasToken: !!githubToken,
            hasRepo: !!githubRepo,
          },
        },
        { status: 500 }
      )
    }

    // Получение файлов из body
    const body = await req.json()
    const { files } = body as { files: ContractFile[] }

    if (!Array.isArray(files) || files.length === 0) {
      console.error(`[${requestId}] ❌ Invalid files data`)

      return NextResponse.json(
        {
          success: false,
          filesUploaded: 0,
          error: 'No files provided',
        },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] 📝 Uploading ${files.length} files to GitHub`)

    const uploadedFiles: string[] = []
    const basePath = 'contracts/src'

    // Загружаем каждый файл
    for (const file of files) {
      const filePath = `${basePath}/${file.name}`

      console.log(`[${requestId}] 📤 Uploading ${file.name}...`)

      // Проверяем существование файла
      let currentSha: string | undefined

      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )

        if (getResponse.ok) {
          const data = await getResponse.json()
          currentSha = data.sha
          console.log(`[${requestId}] 📝 File exists, will update`)
        }
      } catch (e) {
        console.log(`[${requestId}] 📝 File does not exist, will create`)
      }

      // Создаём/обновляем файл
      const putResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `chore: upload ${file.name} - ${new Date().toISOString()}`,
            content: Buffer.from(file.content).toString('base64'),
            branch: process.env.GITHUB_BRANCH || 'main',
            ...(currentSha && { sha: currentSha }),
          }),
        }
      )

      if (!putResponse.ok) {
        const errorData = await putResponse.json().catch(() => ({}))
        console.error(`[${requestId}] ❌ Failed to upload ${file.name}:`, errorData)

        return NextResponse.json(
          {
            success: false,
            filesUploaded: uploadedFiles.length,
            error: `Failed to upload ${file.name}`,
            details: errorData,
          },
          { status: 500 }
        )
      }

      uploadedFiles.push(file.name)
      console.log(`[${requestId}] ✅ Uploaded ${file.name}`)
    }

    console.log(`[${requestId}] 🎯 All files uploaded successfully`)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json({
      success: true,
      filesUploaded: uploadedFiles.length,
      files: uploadedFiles,
    })

  } catch (error: any) {
    console.error(`[${requestId}] 💥 Unexpected error:`, error)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json(
      {
        success: false,
        filesUploaded: 0,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint для проверки
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Contracts Upload API endpoint',
    requiredEnv: ['GITHUB_TOKEN', 'GITHUB_REPO'],
  })
}
