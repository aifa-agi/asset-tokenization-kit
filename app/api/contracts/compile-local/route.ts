// File: app/api/contracts/compile-local/route.ts
// Runtime: Node.js (uses solc-js and fs/GitHub conditionally)
// Description:
// - Compiles Solidity contracts using solc-js locally.
// - In development: saves compiled artifacts to local filesystem (contracts/compiled/).
// - In production: saves compiled artifacts to GitHub repository (contracts/compiled/).
// - Returns structured JSON with compilation results and save status.
//
// Understanding (step-by-step before coding):
// 1) Accept POST JSON { contracts: [{name, source, compiler},...] }.
// 2) Prepare solc input with all sources (name.sol → content).
// 3) Compile using solc.compile (outputSelection: abi, bytecode, deployedBytecode).
// 4) Check for compilation errors; return 400 if errors exist.
// 5) Format compiled contracts into array of { name, abi, bytecode, ... }.
// 6) Save artifacts based on NODE_ENV:
//    - dev: write to local filesystem (contracts/compiled/)
//    - prod: commit to GitHub (contracts/compiled/)
// 7) Return success JSON with contracts and save result.

import { NextRequest, NextResponse } from 'next/server'
import solc from 'solc'
import path from 'node:path'

export const runtime = 'nodejs'

interface InputContract {
  name: string
  source: string
  compiler?: { version?: string }
}

interface CompiledContract {
  name: string
  abi: any[]
  bytecode: string
  deployedBytecode: string
  compiler: { version: string }
}

export async function POST(req: NextRequest) {
  const reqId = crypto.randomUUID()

  try {
    // 1) Parse body
    const body = await req.json().catch(() => null) as { contracts?: InputContract[] } | null
    if (!body?.contracts || !Array.isArray(body.contracts) || body.contracts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contracts provided', reqId },
        { status: 400 }
      )
    }

    const { contracts } = body

    // 2) Prepare solc input
    const sources: Record<string, { content: string }> = {}
    for (const contract of contracts) {
      sources[`${contract.name}.sol`] = { content: contract.source }
    }

    const input = {
      language: 'Solidity',
      sources,
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    }

    // 3) Compile
    const output = JSON.parse(solc.compile(JSON.stringify(input)))

    // 4) Check errors
    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error')
      if (errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Compilation failed',
            details: errors,
            reqId,
          },
          { status: 400 }
        )
      }
    }

    // 5) Format results
    const compiledContracts: CompiledContract[] = []
    for (const contractFile in output.contracts) {
      for (const contractName in output.contracts[contractFile]) {
        const contract = output.contracts[contractFile][contractName]
        compiledContracts.push({
          name: contractName,
          abi: contract.abi,
          bytecode: contract.evm.bytecode.object,
          deployedBytecode: contract.evm.deployedBytecode.object,
          compiler: { version: '0.8.20' },
        })
      }
    }

    // 6) Save artifacts based on env
    const saveResult =
      process.env.NODE_ENV === 'production'
        ? await saveCompiledToGitHub(compiledContracts, reqId)
        : await saveCompiledToLocal(compiledContracts, reqId)

    // 7) Return success
    return NextResponse.json({
      success: true,
      contracts: compiledContracts,
      savedTo: process.env.NODE_ENV === 'production' ? 'github' : 'local',
      saveResult,
      reqId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, reqId },
      { status: 500 }
    )
  }
}

// Save to local filesystem (development)
async function saveCompiledToLocal(
  contracts: CompiledContract[],
  reqId: string
): Promise<{ success: boolean; error?: string; files?: string[] }> {
  try {
    const fs = await import('fs/promises')
    const customPath = (process.env.CONTRACT_COMPILED_PATH || '').trim()
    const basePath = customPath || path.join(process.cwd(), 'contracts', 'compiled')

    await fs.mkdir(basePath, { recursive: true })

    const savedFiles: string[] = []
    for (const contract of contracts) {
      const filePath = path.join(basePath, `${contract.name}.json`)
      const fileContent = JSON.stringify(contract, null, 2)
      await fs.writeFile(filePath, fileContent, 'utf-8')
      savedFiles.push(contract.name)
    }

    return { success: true, files: savedFiles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Save to GitHub (production)
async function saveCompiledToGitHub(
  contracts: CompiledContract[],
  reqId: string
): Promise<{ success: boolean; error?: string; files?: string[] }> {
  try {
    const token = (process.env.GITHUB_TOKEN || '').trim()
    const repo = (process.env.GITHUB_REPO || '').trim()
    const branch = (process.env.GITHUB_BRANCH || 'main').trim()
    const customPath = (process.env.CONTRACT_COMPILED_PATH || '').trim()
    const basePath = customPath || 'contracts/compiled'

    if (!token || !repo) {
      return { success: false, error: 'GitHub config missing' }
    }

    const savedFiles: string[] = []

    for (const contract of contracts) {
      const filePath = `${basePath}/${contract.name}.json`
      const fileContent = JSON.stringify(contract, null, 2)
      const message = `chore: compile ${contract.name} - ${new Date().toISOString()}`

      // GET current SHA
      let sha: string | undefined
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${repo}/contents/${filePath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
            cache: 'no-store',
          }
        )
        if (getResponse.ok) {
          const data = await getResponse.json()
          sha = data.sha
        }
      } catch {
        // File doesn't exist
      }

      // PUT file (handle 409)
      try {
        await ghPut(repo, filePath, token, branch, fileContent, message, sha)
      } catch (e: any) {
        if (e?.status === 409) {
          // Refetch and retry
          const latest = await ghGet(repo, filePath, token)
          await ghPut(repo, filePath, token, branch, fileContent, message, latest.sha)
        } else {
          throw e
        }
      }

      savedFiles.push(contract.name)
    }

    return { success: true, files: savedFiles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// GitHub helpers
async function ghGet(repo: string, path: string, token: string) {
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    cache: 'no-store',
  })
  if (r.status === 404) return { sha: undefined as string | undefined }
  if (!r.ok) throw new Error(`GitHub GET failed: ${r.status}`)
  const j = await r.json()
  return { sha: j.sha as string }
}

async function ghPut(
  repo: string,
  path: string,
  token: string,
  branch: string,
  content: string,
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
      content: Buffer.from(content).toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!r.ok) {
    const payload = await r.json().catch(async () => ({ text: await r.text().catch(() => '') }))
    const err = new Error(`GitHub PUT failed: ${r.status}`)
    ;(err as any).status = r.status
    ;(err as any).payload = payload
    throw err
  }
}
