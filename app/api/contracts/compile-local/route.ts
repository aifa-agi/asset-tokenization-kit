// File: @/app/api/contracts/compile-local/route.ts
// Описание: Локальная компиляция через solc-js (без Tenderly)


import { NextRequest, NextResponse } from 'next/server'
import solc from 'solc'

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()

  console.log(`\n${'='.repeat(70)}`)
  console.log(`[${requestId}] 🚀 NEW REQUEST: Local Compile API`)
  console.log(`${'='.repeat(70)}`)

  try {
    const { contracts } = await req.json()

    if (!Array.isArray(contracts) || contracts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contracts provided' },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] 📝 Compiling ${contracts.length} contracts locally`)

    // Подготовка input для solc
    const sources: Record<string, { content: string }> = {}

    for (const contract of contracts) {
      sources[`${contract.name}.sol`] = {
        content: contract.source,
      }
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

    // Компиляция
    const output = JSON.parse(solc.compile(JSON.stringify(input)))

    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error')
      if (errors.length > 0) {
        console.error(`[${requestId}] ❌ Compilation errors:`, errors)
        return NextResponse.json(
          {
            success: false,
            error: 'Compilation failed',
            details: errors,
          },
          { status: 400 }
        )
      }
    }

    // Форматирование результата
    const compiledContracts = []

    for (const contractFile in output.contracts) {
      for (const contractName in output.contracts[contractFile]) {
        const contract = output.contracts[contractFile][contractName]

        compiledContracts.push({
          name: contractName,
          abi: contract.abi,
          bytecode: contract.evm.bytecode.object,
          deployedBytecode: contract.evm.deployedBytecode.object,
          compiler: {
            version: '0.8.20',
          },
        })
      }
    }

    console.log(`[${requestId}] ✅ Compilation successful: ${compiledContracts.length} contracts`)

    // Сохранение в GitHub
    const saveResult = await saveCompiledToGitHub(compiledContracts, requestId)

    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json({
      success: true,
      contracts: compiledContracts,
      savedToGitHub: saveResult.success,
    })

  } catch (error: any) {
    console.error(`[${requestId}] 💥 Error:`, error)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Функция сохранения (скопирована из tenderly/compile)
async function saveCompiledToGitHub(
  contracts: any[],
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const githubToken = process.env.GITHUB_TOKEN?.trim()
    const githubRepo = process.env.GITHUB_REPO?.trim()
    const basePath = 'contracts/compiled'

    if (!githubToken || !githubRepo) {
      return { success: false, error: 'GitHub config missing' }
    }

    for (const contract of contracts) {
      const filePath = `${basePath}/${contract.name}.json`
      const fileContent = JSON.stringify(contract, null, 2)

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
        }
      } catch (e) {
        // Файл не существует
      }

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
            message: `chore: compile ${contract.name} - ${new Date().toISOString()}`,
            content: Buffer.from(fileContent).toString('base64'),
            branch: 'main',
            ...(currentSha && { sha: currentSha }),
          }),
        }
      )

      if (!putResponse.ok) {
        return { success: false, error: `Failed to save ${contract.name}` }
      }
    }

    return { success: true }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
