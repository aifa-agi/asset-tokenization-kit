// File: app/architect/upload/page.tsx
// Client: auto-selects upload endpoint based on NODE_ENV

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Upload, 
  CheckCircle, 
  FileCode,
  Info,
} from 'lucide-react'

interface UploadedFile {
  name: string
  size: number
  content: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

// Helper: choose endpoint based on NODE_ENV
function getUploadEndpoint() {
  return process.env.NODE_ENV === 'production'
    ? '/api/contracts/upload-github'
    : '/api/contracts/upload-local'
}

export default function ArchitectUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const uploadEndpoint = getUploadEndpoint()
  const isProd = process.env.NODE_ENV === 'production'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const solFiles = selectedFiles.filter(f => f.name.endsWith('.sol'))
    
    if (solFiles.length === 0) {
      toast.error('Please select .sol files only')
      return
    }

    if (solFiles.length !== selectedFiles.length) {
      toast.warning(`Ignored ${selectedFiles.length - solFiles.length} non-Solidity files`)
    }

    const uploadedFiles: UploadedFile[] = []
    for (const file of solFiles) {
      const content = await file.text()
      uploadedFiles.push({ name: file.name, size: file.size, content })
    }

    setFiles(uploadedFiles)
    toast.success(`${uploadedFiles.length} file(s) selected`)
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files first')
      return
    }

    setUploadStatus('uploading')
    setError(null)

    const toastId = toast.loading(`Uploading to ${isProd ? 'GitHub' : 'local filesystem'}...`)

    try {
      // Upload files
      const uploadResponse = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      toast.success(`Uploaded to ${isProd ? 'GitHub' : 'filesystem'}!`, { id: toastId })
      console.log('✅ Upload result:', uploadData)

      // Compile
      setTimeout(() => {
        startCompilation()
      }, 1000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message)
      setUploadStatus('error')
      toast.error('Upload failed: ' + err.message, { id: toastId })
    }
  }

  const startCompilation = async () => {
    toast.loading('Compiling contracts...', { id: 'compile' })

    try {
      const response = await fetch('/api/contracts/compile-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contracts: files.map(f => ({
            name: f.name.replace('.sol', ''),
            source: f.content,
            compiler: { version: '0.8.20' },
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Compilation failed')
      }

      const data = await response.json()
      setUploadStatus('success')
      toast.success('Compiled successfully!', { id: 'compile' })
      console.log('✅ Compilation result:', data)

      setTimeout(() => {
        window.location.href = '/architect/deploy'
      }, 2000)

    } catch (err: any) {
      console.error('Compilation error:', err)
      setError(err.message)
      setUploadStatus('error')
      toast.error('Compilation failed: ' + err.message, { id: 'compile' })
    }
  }

  const resetUpload = () => {
    setFiles([])
    setUploadStatus('idle')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🏗️ Architect: Upload Contracts
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Upload Solidity contracts to start deployment
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Upload .sol files</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Saved to {isProd ? 'GitHub repository' : 'local filesystem'}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Automatic compilation (solc-js)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Compiled artifacts saved {isProd ? 'to GitHub' : 'locally'}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                <span>Ready to deploy to Sepolia</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Smart Contracts</CardTitle>
            <CardDescription>
              Select your Solidity contract files (.sol)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Select Contracts
              </label>
              <input
                type="file"
                multiple
                accept=".sol"
                onChange={handleFileChange}
                disabled={uploadStatus === 'uploading'}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-2 text-xs text-gray-500">
                Required: PropertyToken.sol, PropertyTokenFactory.sol, MockUSDT.sol
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Endpoint: {uploadEndpoint} ({isProd ? 'production' : 'development'})
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border"
                    >
                      <FileCode className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      {uploadStatus === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploadStatus === 'uploading'}
                className="flex items-center gap-2"
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : uploadStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Done ✓
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Compile
                  </>
                )}
              </Button>

              {(uploadStatus === 'success' || uploadStatus === 'error') && (
                <Button onClick={resetUpload} variant="outline">
                  Reset
                </Button>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Uploaded and compiled successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Redirecting to deployment page...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
