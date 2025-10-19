// File: @/app/admin/page.tsx
// ОБНОВЛЁННАЯ ВЕРСИЯ - убран Navigation (теперь в layout)


'use client'

import { AssetCreateForm } from '@/components/admin/asset-create-form'
import { AssetList } from '@/components/admin/asset-list'
import { useWeb3Status } from '@/providers/web-3-provider'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function AdminPage() {
  const { isConnected } = useWeb3Status()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (без Navigation) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Panel
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage tokenized assets
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">
              Подключите кошелёк для доступа к админ панели
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8">
            <AssetCreateForm />
            <AssetList />
          </div>
        )}
      </div>
    </div>
  )
}
