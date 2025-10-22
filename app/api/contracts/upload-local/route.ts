// File: app/api/contracts/upload-local/route.ts
// Runtime: Node.js (uses fs/promises)
// Description:
// - Development-only endpoint: saves .sol files to local filesystem (contracts/src/).
// - Rejects usage in production (enforce strict separation: dev → fs, prod → GitHub).
// - Validates payload (files array), creates directory if needed, writes each file.
// - Returns structured JSON with list of saved files for diagnostics.
//
// Understanding (step-by-step before coding):
// 1) Accept POST JSON { files: [{name, content, size},...] }.
// 2) Enforce NODE_ENV !== 'production' (fail fast if prod).
// 3) Resolve base path from CONTRACT_SRC_PATH or default to process.cwd()/contracts/src.
// 4) For each file: validate name (.sol), ensure parent directory exists, write content.
// 5) Return success JSON with filesUploaded count and file list.
// 6) Provide helpful error messages (400 for bad input, 403 for prod usage, 500 for IO failures).
//
// Notes:
// - This route intentionally does not handle GitHub. Use /upload-github for prod.
// - Avoids leaking internal paths in logs. Prints only minimal operational info.

import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

export const runtime = 'nodejs'

interface ContractFile {
  name: string
  content: string
  size: number
}

interface UploadResponse {
  success: boolean
  filesUploaded: number
  files?: string[]
  basePath?: string
  error?: string
  reqId?: string
}

export async function POST(req: NextRequest): Promise<NextResponse<UploadResponse>> {
  const reqId = crypto.randomUUID()

  try {
    // 1) Parse body
    const body = await req.json().catch(() => null) as { files?: ContractFile[] } | null
    if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          filesUploaded: 0,
          error: 'No files provided or invalid format',
          reqId,
        },
        { status: 400 }
      )
    }

    // 2) Enforce dev-only usage
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          filesUploaded: 0,
          error: 'Forbidden in production. Use /api/contracts/upload-github',
          reqId,
        },
        { status: 403 }
      )
    }

    const files = body.files

    // 3) Resolve base path
    const customPath = (process.env.CONTRACT_SRC_PATH || '').trim()
    const basePath = customPath || path.join(process.cwd(), 'contracts', 'src')

    // 4) Write each file
    const fs = await import('fs/promises')
    await fs.mkdir(basePath, { recursive: true })

    const uploadedFiles: string[] = []

    for (const file of files) {
      // Validate name
      if (!file.name || !file.name.endsWith('.sol')) {
        return NextResponse.json(
          {
            success: false,
            filesUploaded: uploadedFiles.length,
            error: `Invalid file name: ${file.name || '(empty)'}`,
            reqId,
          },
          { status: 400 }
        )
      }

      const filePath = path.join(basePath, file.name)

      // Write file
      await fs.writeFile(filePath, file.content, 'utf-8')
      uploadedFiles.push(file.name)
    }

    // 5) Respond success
    return NextResponse.json({
      success: true,
      filesUploaded: uploadedFiles.length,
      files: uploadedFiles,
      basePath,
      reqId,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        filesUploaded: 0,
        error: error?.message || 'Unknown error',
        reqId,
      },
      { status: 500 }
    )
  }
}

// Optional: health check / debugging in dev
export async function GET() {
  const customPath = (process.env.CONTRACT_SRC_PATH || '').trim()
  const basePath = customPath || path.join(process.cwd(), 'contracts', 'src')

  return NextResponse.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'development',
    basePath,
    note: 'POST { files: [{name, content, size},...] } to upload .sol files to local filesystem',
  })
}
