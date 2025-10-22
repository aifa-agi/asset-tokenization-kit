// File: app/api/contracts/status/route.ts
// Runtime: Node.js (uses fs in dev, GitHub API in prod)
// Description:
// - Checks presence of source files (.sol) in contracts/src/
// - Checks presence of compiled artifacts (.json) in contracts/compiled/
// - Returns structured JSON with status for each contract
// - Works in development (filesystem) and production (GitHub)
//
// Understanding (step-by-step before coding):
// 1) Define expected contract names (MockUSDT, PropertyTokenFactory, PropertyToken)
// 2) Check if source files exist (.sol)
// 3) Check if compiled artifacts exist (.json)
// 4) Return status object with:
//    - contracts: array of {name, source: bool, compiled: bool}
//    - allUploaded: bool (all sources present)
//    - allCompiled: bool (all artifacts present)
//    - readyToDeploy: bool (all compiled)
// 5) Use fs in dev, GitHub API in prod

import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

export const runtime = 'nodejs'

interface ContractStatus {
  name: string
  source: boolean
  compiled: boolean
}

interface StatusResponse {
  contracts: ContractStatus[]
  allUploaded: boolean
  allCompiled: boolean
  readyToDeploy: boolean
  mode: 'dev' | 'prod'
  error?: string
}

// Expected contract names
const EXPECTED_CONTRACTS = [
  'MockUSDT',
  'PropertyTokenFactory',
  'PropertyToken',
]

export async function GET(req: NextRequest): Promise<NextResponse<StatusResponse>> {
  const isDev = process.env.NODE_ENV !== 'production'

  try {
    const contracts: ContractStatus[] = []

    if (isDev) {
      // Development: check filesystem
      const fs = await import('fs/promises')
      
      const srcPath = path.join(process.cwd(), 'contracts', 'src')
      const compiledPath = path.join(process.cwd(), 'contracts', 'compiled')

      for (const name of EXPECTED_CONTRACTS) {
        const sourceExists = await fileExists(fs, path.join(srcPath, `${name}.sol`))
        const compiledExists = await fileExists(fs, path.join(compiledPath, `${name}.json`))

        contracts.push({
          name,
          source: sourceExists,
          compiled: compiledExists,
        })
      }
    } else {
      // Production: check GitHub
      const token = (process.env.GITHUB_TOKEN || '').trim()
      const repo = (process.env.GITHUB_REPO || '').trim()

      if (!token || !repo) {
        return NextResponse.json({
          contracts: [],
          allUploaded: false,
          allCompiled: false,
          readyToDeploy: false,
          mode: 'prod',
          error: 'GitHub configuration missing',
        })
      }

      const srcBase = (process.env.CONTRACT_SRC_PATH || 'contracts/src').trim()
      const compiledBase = (process.env.CONTRACT_COMPILED_PATH || 'contracts/compiled').trim()

      for (const name of EXPECTED_CONTRACTS) {
        const sourceExists = await ghFileExists(repo, `${srcBase}/${name}.sol`, token)
        const compiledExists = await ghFileExists(repo, `${compiledBase}/${name}.json`, token)

        contracts.push({
          name,
          source: sourceExists,
          compiled: compiledExists,
        })
      }
    }

    // Calculate summary flags
    const allUploaded = contracts.every(c => c.source)
    const allCompiled = contracts.every(c => c.compiled)
    const readyToDeploy = allCompiled

    return NextResponse.json({
      contracts,
      allUploaded,
      allCompiled,
      readyToDeploy,
      mode: isDev ? 'dev' : 'prod',
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        contracts: [],
        allUploaded: false,
        allCompiled: false,
        readyToDeploy: false,
        mode: isDev ? 'dev' : 'prod',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper: check if file exists on filesystem
async function fileExists(fs: typeof import('fs/promises'), filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Helper: check if file exists on GitHub
async function ghFileExists(repo: string, path: string, token: string): Promise<boolean> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    })
    return r.ok
  } catch {
    return false
  }
}
