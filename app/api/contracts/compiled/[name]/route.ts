// File: app/api/contracts/compiled/[name]/route.ts
// Runtime: Node.js (uses fs in dev, GitHub API in prod)
// Description:
// - Universal endpoint to read compiled contract artifacts (.json)
// - In development: reads from local filesystem (contracts/compiled/)
// - In production: reads from GitHub repository (contracts/compiled/)
// - Returns parsed JSON with contract ABI, bytecode, etc.
//
// Understanding (step-by-step before coding):
// 1) Extract contract name from dynamic route params
// 2) Check NODE_ENV to determine source (fs vs GitHub)
// 3) In dev: read from contracts/compiled/{name}.json using fs
// 4) In prod: fetch from GitHub Contents API and decode base64
// 5) Parse JSON and return contract object
// 6) Return 404 if file not found, 500 on errors

import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

export const runtime = 'nodejs'

interface CompiledContract {
  name: string
  abi: any[]
  bytecode: string
  deployedBytecode?: string
  compiler?: { version: string }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse<CompiledContract | { error: string }>> {
  try {
    // 1) Extract contract name
    const { name } = await params

    const isDev = process.env.NODE_ENV !== 'production'

    if (isDev) {
      // 2) Development: read from filesystem
      const fs = await import('fs/promises')
      const customPath = (process.env.CONTRACT_COMPILED_PATH || '').trim()
      const basePath = customPath || path.join(process.cwd(), 'contracts', 'compiled')
      const filePath = path.join(basePath, `${name}.json`)

      console.log(`📥 [DEV] Loading compiled contract: ${name} from ${filePath}`)

      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const contract = JSON.parse(content) as CompiledContract

        console.log(`✅ [DEV] Loaded contract: ${name}`)
        return NextResponse.json(contract)
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.error(`❌ [DEV] Contract not found: ${name}`)
          return NextResponse.json(
            { error: `Contract not found: ${name}` },
            { status: 404 }
          )
        }
        throw e
      }
    } else {
      // 3) Production: read from GitHub
      const token = (process.env.GITHUB_TOKEN || '').trim()
      const repo = (process.env.GITHUB_REPO || '').trim()
      const customPath = (process.env.CONTRACT_COMPILED_PATH || '').trim()
      const basePath = customPath || 'contracts/compiled'

      if (!token || !repo) {
        console.error(`❌ [PROD] GitHub configuration missing`)
        return NextResponse.json(
          { error: 'GitHub configuration missing' },
          { status: 500 }
        )
      }

      const filePath = `${basePath}/${name}.json`

      console.log(`📥 [PROD] Loading compiled contract: ${name} from GitHub ${repo}/${filePath}`)

      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${filePath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          console.error(`❌ [PROD] Contract not found: ${name}`)
          return NextResponse.json(
            { error: `Contract not found: ${name}` },
            { status: 404 }
          )
        }
        const errorText = await response.text().catch(() => '')
        throw new Error(`GitHub API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      const contract = JSON.parse(content) as CompiledContract

      console.log(`✅ [PROD] Loaded contract: ${name}`)
      return NextResponse.json(contract)
    }
  } catch (error: any) {
    console.error('❌ Error loading contract:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to load contract' },
      { status: 500 }
    )
  }
}
