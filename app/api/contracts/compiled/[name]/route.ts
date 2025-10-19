// File: @/app/api/contracts/compiled/[name]/route.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ для Next.js 15


import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> } // ✅ Promise
) {
  try {
    // ✅ Await params
    const { name } = await params
    
    const githubToken = process.env.GITHUB_TOKEN?.trim()
    const githubRepo = process.env.GITHUB_REPO?.trim()

    if (!githubToken || !githubRepo) {
      return NextResponse.json(
        { error: 'GitHub configuration missing' },
        { status: 500 }
      )
    }

    const filePath = `contracts/compiled/${name}.json`

    console.log(`📥 Loading compiled contract: ${name}`)

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Contract not found: ${name}`)
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    const contract = JSON.parse(content)

    console.log(`✅ Loaded contract: ${name}`)

    return NextResponse.json(contract)

  } catch (error: any) {
    console.error('❌ Error loading contract:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to load contract' },
      { status: 500 }
    )
  }
}
