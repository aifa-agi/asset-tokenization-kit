// File: app/api/contracts/save-address-github/route.ts
// Runtime: Node.js (uses fetch to GitHub API)
// Description:
// - Production-only endpoint: persists deployed contract address into a .env file in GitHub repo.
// - Uses GitHub Contents API (GET current, upsert KEY=VALUE, PUT with sha).
// - Handles 409 conflict by refetching latest sha and retrying once.
// - Reads configuration from env: GITHUB_TOKEN, GITHUB_REPO, ENV_FILE_PATH, GITHUB_BRANCH (default 'main').
//
// Understanding (step-by-step before coding):
// 1) POST JSON { contractName, address }.
// 2) Enforce NODE_ENV === 'production' (fail if not).
// 3) Build env var key NEXT_PUBLIC_<SANITIZED_NAME>_CONTRACT.
// 4) GET current file from GitHub to get content + sha (404 -> empty content).
// 5) Upsert KEY=VALUE line in the env file content.
// 6) PUT back with proper sha. If 409, refetch and retry once.
// 7) Return structured JSON (repo, path, branch, key, address) for diagnostics.

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Helpers
function sanitizeNameToEnvKey(name: string): string {
  const base = name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `NEXT_PUBLIC_${base}_CONTRACT`
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr)
}

function upsertEnvVar(content: string, key: string, value: string) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(content)) return content.replace(re, line)
  const sep = content.endsWith('\n') || content.length === 0 ? '' : '\n'
  return `${content}${sep}${line}\n`
}

async function ghGet(repo: string, path: string, token: string) {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  })
  if (r.status === 404) return { content: '', sha: undefined as string | undefined }
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(`GitHub GET failed: ${r.status} ${t}`)
  }
  const j = await r.json()
  const buf = Buffer.from(j.content, 'base64').toString('utf-8')
  return { content: buf, sha: j.sha as string }
}

async function ghPut(repo: string, path: string, token: string, branch: string, contentUtf8: string, message: string, sha?: string) {
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

export async function POST(req: NextRequest) {
  const reqId = crypto.randomUUID()

  try {
    // 1) Parse body
    const body = await req.json().catch(() => null) as {
      contractName?: string
      address?: string
      metadata?: Record<string, unknown>
    } | null
    if (!body?.contractName || !body?.address) {
      return NextResponse.json(
        { error: 'Missing contractName or address', reqId },
        { status: 400 }
      )
    }

    // 2) Enforce production
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Forbidden outside production. Use /save-address-local in dev', reqId },
        { status: 403 }
      )
    }

    const contractName = body.contractName
    const address = body.address

    // 3) Build key and validate address
    const key = sanitizeNameToEnvKey(contractName)
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address format. Expected 0x + 40 hex chars', key, reqId },
        { status: 400 }
      )
    }

    // 4) Read env config
    const token = (process.env.GITHUB_TOKEN || '').trim()
    const repo = (process.env.GITHUB_REPO || '').trim() // owner/repo
    const path = (process.env.ENV_FILE_PATH || 'apps/web/.env.production').trim()
    const branch = (process.env.GITHUB_BRANCH || 'main').trim()

    if (!token || !repo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing', reqId, hasToken: !!token, hasRepo: !!repo },
        { status: 500 }
      )
    }

    // 5) GET current file + sha
    let { content, sha } = await ghGet(repo, path, token)

    // 6) Upsert line
    const nextContent = upsertEnvVar(content, key, address)

    // 7) PUT back (handle 409)
    const message = `chore: update ${contractName} contract address (${address}) - ${new Date().toISOString()}`
    try {
      await ghPut(repo, path, token, branch, nextContent, message, sha)
    } catch (e: any) {
      if (e?.status === 409) {
        // Refetch latest and retry once
        const latest = await ghGet(repo, path, token)
        const next2 = upsertEnvVar(latest.content, key, address)
        await ghPut(repo, path, token, branch, next2, message, latest.sha)
      } else {
        throw e
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'prod',
      reqId,
      repo,
      path,
      branch,
      key,
      address,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unknown error', details: error?.payload || null, reqId },
      { status: 500 }
    )
  }
}

// Optional health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'unknown',
    requires: ['GITHUB_TOKEN', 'GITHUB_REPO', 'ENV_FILE_PATH (optional)', 'GITHUB_BRANCH (optional)'],
    note: 'POST { contractName, address } to upsert env var in GitHub .env file',
  })
}
