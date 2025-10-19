// File: @/app/api/contracts/save-address/route.ts
// Описание: Сохранение адреса контракта в .env.production


import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()

  console.log(`\n${'='.repeat(70)}`)
  console.log(`[${requestId}] 🚀 NEW REQUEST: Save Contract Address API`)
  console.log(`${'='.repeat(70)}`)

  try {
    const { contractName, address } = await req.json()

    if (!contractName || !address) {
      return NextResponse.json(
        { error: 'Missing contractName or address' },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN?.trim()
    const githubRepo = process.env.GITHUB_REPO?.trim()

    if (!githubToken || !githubRepo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    const envFilePath = process.env.ENV_FILE_PATH ||


    console.log(`[${requestId}] 💾 Saving ${contractName} address: ${address}`)

    // Получаем текущий .env файл
    let currentEnv = ''
    let currentSha: string | undefined

    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${envFilePath}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      if (getResponse.ok) {
        const data = await getResponse.json()
        currentEnv = Buffer.from(data.content, 'base64').toString('utf-8')
        currentSha = data.sha
      }
    } catch (e) {
      console.log(`[${requestId}] Creating new .env.production file`)
    }

    // Обновляем переменную
    const envVarName = `NEXT_PUBLIC_${contractName.toUpperCase()}_CONTRACT`
    const envVarLine = `${envVarName}=${address}`

    let newEnv = currentEnv
    const regex = new RegExp(`^${envVarName}=.*$`, 'm')

    if (regex.test(newEnv)) {
      newEnv = newEnv.replace(regex, envVarLine)
    } else {
      newEnv += `\n${envVarLine}\n`
    }

    // Сохраняем в GitHub
    const putResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${envFilePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `chore: update ${contractName} contract address - ${new Date().toISOString()}`,
          content: Buffer.from(newEnv).toString('base64'),
          branch: 'main',
          ...(currentSha && { sha: currentSha }),
        }),
      }
    )

    if (!putResponse.ok) {
      const errorData = await putResponse.json().catch(() => ({}))
      console.error(`[${requestId}] ❌ Failed to save to GitHub:`, errorData)

      return NextResponse.json(
        { error: 'Failed to save to GitHub', details: errorData },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] ✅ Address saved successfully`)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`[${requestId}] 💥 Error:`, error)
    console.log(`${'='.repeat(70)}\n`)

    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
