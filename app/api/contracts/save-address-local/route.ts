// File: app/api/contracts/save-address-local/route.ts
// Runtime: Node.js (must not be Edge because we use fs)
// Description:
// - Development-only endpoint: persists deployed contract address into local .env.local via filesystem.
// - Rejects usage in production (enforce strict separation: dev → fs, prod → GitHub).
// - Validates payload (contractName, address), sanitizes env var key, and upserts KEY=VALUE line.
// - Returns structured JSON for diagnostics (mode, file path, key, address).
//
// Understanding (step-by-step before coding):
// 1) Accept POST JSON { contractName, address, metadata? }.
// 2) Enforce NODE_ENV !== 'production' (fail fast if prod).
// 3) Build env var key as NEXT_PUBLIC_<SANITIZED_NAME>_CONTRACT (sanitize name to A-Z0-9_).
// 4) Validate address as EIP-55-compatible hex (basic regex 0x + 40 hex chars).
// 5) Resolve .env.local path from ENV_LOCAL_FILE_PATH or default to process.cwd()/.env.local.
// 6) Read existing file content (if any).
// 7) Upsert the line KEY=VALUE (replace existing or append).
// 8) Write back atomically (simple overwrite is acceptable for dev), return success JSON.
// 9) Provide helpful error messages (400 for bad input, 500 for IO failures).
//
// Notes:
// - This route intentionally does not handle GitHub. Use a separate prod route (/save-address-github) for that.
// - Avoids leaking secrets in logs. Prints only minimal operational info.

import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

// Ensure Node.js runtime (fs required)
export const runtime = 'nodejs'

// Small helpers
function sanitizeNameToEnvKey(name: string): string {
  const base = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `NEXT_PUBLIC_${base}_CONTRACT`
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

function upsertEnvVar(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(content)) return content.replace(re, line)
  const sep = content.endsWith('\n') || content.length === 0 ? '' : '\n'
  return `${content}${sep}${line}\n`
}

async function readFileUtf8Safe(fs: typeof import('fs/promises'), filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const reqId = crypto.randomUUID()

  try {
    // 1) Parse body
    const body = await req.json().catch(() => null) as {
      contractName?: string
      address?: string
      metadata?: Record<string, unknown>
    } | null

    if (!body || !body.contractName || !body.address) {
      return NextResponse.json(
        { error: 'Missing contractName or address', reqId },
        { status: 400 }
      )
    }

    // 2) Enforce dev-only usage
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Forbidden in production. Use /api/contracts/save-address-github', reqId },
        { status: 403 }
      )
    }

    const contractName = body.contractName
    const address = body.address

    // 3) Build env key
    const key = sanitizeNameToEnvKey(contractName)

    // 4) Validate address shape
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address format. Expected 0x + 40 hex chars', key, reqId },
        { status: 400 }
      )
    }

    // 5) Resolve file path
    const customPath = (process.env.ENV_LOCAL_FILE_PATH || '').trim()
    const filePath = customPath || path.join(process.cwd(), '.env')

    // 6) Read current content
    const fs = await import('fs/promises')
    let current = await readFileUtf8Safe(fs, filePath)

    // 7) Upsert key
    const nextContent = upsertEnvVar(current, key, address)

    // 8) Ensure parent dir exists (usually project root, but safe)
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // 9) Write file
    await fs.writeFile(filePath, nextContent, 'utf-8')

    // 10) Respond success
    return NextResponse.json({
      success: true,
      mode: 'dev',
      reqId,
      file: filePath,
      key,
      address,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Unknown error',
        reqId,
      },
      { status: 500 }
    )
  }
}

// Optional: simple GET for health check / debugging in dev
export async function GET() {
  const filePath = (process.env.ENV_LOCAL_FILE_PATH || path.join(process.cwd(), '.env')).trim()
  return NextResponse.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'development',
    file: filePath,
    note: 'POST { contractName, address } to upsert env var: NEXT_PUBLIC_<NAME>_CONTRACT',
  })
}
