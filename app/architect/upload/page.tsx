// File: @/app/architect/upload/page.tsx
// ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ с локальной компиляцией


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

export default function ArchitectUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Обработка выбора файлов
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    // Фильтруем только .sol файлы
    const solFiles = selectedFiles.filter(f => f.name.endsWith('.sol'))
    
    if (solFiles.length === 0) {
      toast.error('Please select .sol files only')
      return
    }

    if (solFiles.length !== selectedFiles.length) {
      toast.warning(`Ignored ${selectedFiles.length - solFiles.length} non-Solidity files`)
    }

    // Читаем содержимое файлов
    const uploadedFiles: UploadedFile[] = []

    for (const file of solFiles) {
      const content = await file.text()
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        content,
      })
    }

    setFiles(uploadedFiles)
    toast.success(`${uploadedFiles.length} file(s) selected`)
  }

  // Upload в GitHub
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files first')
      return
    }

    setUploadStatus('uploading')
    setError(null)

    const toastId = toast.loading('Uploading contracts to GitHub...')

    try {
      // Шаг 1: Upload в GitHub
      const uploadResponse = await fetch('/api/contracts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()

      toast.success('Contracts uploaded to GitHub!', { id: toastId })
      console.log('✅ Upload result:', uploadData)

      // Шаг 2: Автоматически запускаем компиляцию
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

  // Запуск компиляции (автоматически после upload)
  const startCompilation = async () => {
    toast.loading('Starting compilation...', { id: 'compile' })

    try {
      // ✅ ИСПРАВЛЕНО: Используем локальную компиляцию
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
      toast.success('Contracts compiled successfully!', { id: 'compile' })
      
      console.log('✅ Compilation result:', data)

      // Перенаправляем на deploy страницу
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

  // Сброс
  const resetUpload = () => {
    setFiles([])
    setUploadStatus('idle')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🏗️ Architect: Upload Contracts
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Upload Solidity contracts to start the deployment process
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* Information Card */}
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
                <span>Upload your Solidity contracts (.sol files)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Contracts are saved to GitHub repository</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Automatic compilation using solc-js</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Compiled contracts saved back to GitHub</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                <span>Ready to deploy to Sepolia testnet</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Smart Contracts</CardTitle>
            <CardDescription>
              Select your Solidity contract files (.sol)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* File Input */}
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
                Required files: PropertyToken.sol, PropertyTokenFactory.sol, MockUSDT.sol
              </p>
            </div>

            {/* Files List */}
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

            {/* Action Buttons */}
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
                    Uploaded ✓
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

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Contracts uploaded and compiled successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Redirecting to deployment page...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(
                  files.map(f => ({
                    name: f.name,
                    size: f.size,
                    lines: f.content.split('\n').length,
                  })),
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
