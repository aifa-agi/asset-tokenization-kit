// File: app/api/contracts/upload-github/route.ts
// Runtime: Node.js (uses GitHub API)
// Description:
// - Production endpoint: saves .sol files to GitHub repository (contracts/src/).
// - Uses GITHUB_TOKEN from server env (never exposed to client).
// - Handles SHA conflicts (409) by refetching and retrying.
// - Returns structured JSON with uploaded files list.

import { NextRequest, NextResponse } from 'next/server'

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
  repo?: string
  branch?: string
  basePath?: string
  error?: string
  details?: any
  reqId?: string
}

// GitHub API helpers
async function ghGetFile(repo: string, path: string, token: string) {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  })
  if (r.status === 404) return { sha: undefined as string | undefined }
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`GitHub GET failed: ${r.status} ${t}`)
  }
  const j = await r.json()
  return { sha: j.sha as string }
}

async function ghPutFile(
  repo: string,
  path: string,
  token: string,
  branch: string,
  contentUtf8: string,
  message: string,
  sha?: string
) {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(contentUtf8).toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!r.ok) {
    const payload = await r.json().catch(async () => ({ text: await r.text().catch(() => '') }))
    const err = new Error(`GitHub PUT failed: ${r.status} ${JSON.stringify(payload)}`)
    ;(err as any).status = r.status
    ;(err as any).payload = payload
    throw err
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<UploadResponse>> {
  const reqId = crypto.randomUUID()

  console.log(`\n${'='.repeat(70)}`)
  console.log(`[${reqId}] 🚀 Upload to GitHub: START`)
  console.log(`${'='.repeat(70)}`)

  try {
    // 1) Parse body
    const body = await req.json().catch(() => null) as { files?: ContractFile[] } | null
    if (!body?.files || !Array.isArray(body.files) || body.files.length === 0) {
      console.error(`[${reqId}] ❌ No files provided`)
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

    const files = body.files

    // 2) Read GitHub config from env
    const token = (process.env.GITHUB_TOKEN || '').trim()
    const repo = (process.env.GITHUB_REPO || '').trim()
    const branch = (process.env.GITHUB_BRANCH || 'main').trim()
    const customPath = (process.env.CONTRACT_SRC_PATH || '').trim()
    const basePath = customPath || 'contracts/src'

    if (!token || !repo) {
      console.error(`[${reqId}] ❌ GitHub config missing`)
      return NextResponse.json(
        {
          success: false,
          filesUploaded: 0,
          error: 'GitHub configuration missing (GITHUB_TOKEN, GITHUB_REPO)',
          reqId,
          details: { hasToken: !!token, hasRepo: !!repo },
        },
        { status: 500 }
      )
    }

    console.log(`[${reqId}] 📝 Uploading ${files.length} files to ${repo}/${basePath}`)

    // 3) Upload each file
    const uploadedFiles: string[] = []

    for (const file of files) {
      // Validate name
      if (!file.name || !file.name.endsWith('.sol')) {
        console.error(`[${reqId}] ❌ Invalid file: ${file.name}`)
        return NextResponse.json(
          {
            success: false,
            filesUploaded: uploadedFiles.length,
            error: `Invalid file name: ${file.name || '(empty)'}. Must be .sol`,
            reqId,
          },
          { status: 400 }
        )
      }

      const filePath = `${basePath}/${file.name}`
      const message = `chore: upload ${file.name} - ${new Date().toISOString()}`

      console.log(`[${reqId}] 📤 Uploading ${file.name}...`)

      // GET current SHA (if file exists)
      let { sha } = await ghGetFile(repo, filePath, token)

      // PUT file (handle 409 conflict)
      try {
        await ghPutFile(repo, filePath, token, branch, file.content, message, sha)
        console.log(`[${reqId}] ✅ Uploaded ${file.name}`)
      } catch (e: any) {
        if (e?.status === 409) {
          console.log(`[${reqId}] ⚠️ SHA conflict for ${file.name}, retrying...`)
          // Refetch latest SHA and retry once
          const latest = await ghGetFile(repo, filePath, token)
          await ghPutFile(repo, filePath, token, branch, file.content, message, latest.sha)
          console.log(`[${reqId}] ✅ Uploaded ${file.name} (retry)`)
        } else {
          throw e
        }
      }

      uploadedFiles.push(file.name)
    }

    console.log(`[${reqId}] 🎯 All files uploaded successfully`)
    console.log(`${'='.repeat(70)}\n`)

    // 4) Return success
    return NextResponse.json({
      success: true,
      filesUploaded: uploadedFiles.length,
      files: uploadedFiles,
      repo,
      branch,
      basePath,
      reqId,
    })
  } catch (error: any) {
    console.error(`[${reqId}] 💥 Error:`, error)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json(
      {
        success: false,
        filesUploaded: 0,
        error: error?.message || 'Unknown error',
        details: error?.payload || null,
        reqId,
      },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  const repo = (process.env.GITHUB_REPO || '').trim()
  const branch = (process.env.GITHUB_BRANCH || 'main').trim()
  const basePath = (process.env.CONTRACT_SRC_PATH || 'contracts/src').trim()

  return NextResponse.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'unknown',
    repo: repo || '(not configured)',
    branch,
    basePath,
    requires: ['GITHUB_TOKEN', 'GITHUB_REPO'],
    note: 'POST { files: [{name, content, size},...] } to upload .sol files to GitHub',
  })
}
