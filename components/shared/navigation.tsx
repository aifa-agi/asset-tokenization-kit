// File: @/components/shared/navigation.tsx

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useEffect, useState } from 'react'
import { useBalance, useAccount } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { formatEther } from 'viem'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected, address, chainId, switchToSepolia } = useWeb3Status()
  const [debugInfo, setDebugInfo] = useState<string>('')
  
  // Получаем баланс
  const { data: balance, isError, isLoading } = useBalance({
    address: address || undefined,
    chainId: sepolia.id,
  })

  const isCorrectNetwork = chainId === sepolia.id

  useEffect(() => {
    const info = {
      isConnected,
      address: address || 'null',
      chainId,
      expectedChainId: sepolia.id,
      isCorrectNetwork,
      balance: balance?.formatted || 'null',
      balanceValue: balance?.value?.toString() || 'null',
      isError,
      isLoading,
    }
    
    console.log('🔍 NAVIGATION DEBUG:', info)
    setDebugInfo(JSON.stringify(info, null, 2))
    
    if (isConnected && address) {
      console.log('✅ Wallet connected:', address)
      console.log('📊 Chain ID:', chainId, '(expected:', sepolia.id, ')')
      console.log('💰 Balance:', balance)
      console.log('🌐 Correct Network:', isCorrectNetwork)
      router.refresh()
    }
  }, [isConnected, address, chainId, balance, isError, isLoading, isCorrectNetwork, router])

  const navItems = [
    { href: '/', label: 'Главная', icon: '🏠' },
    { href: '/architect', label: 'Архитектор', icon: '🏗️' },
    { href: '/admin', label: 'Админ', icon: '⚙️' },
    { href: '/investor', label: 'Инвестор', icon: '💰' },
  ]

  return (
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span>🏘️</span>
              <span className="hidden sm:inline">AIFA Tokenization kit</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-2 rounded-md font-medium transition-colors text-sm
                      ${isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              {isConnected && address && (
                <div className="flex items-center gap-2">
                  {/* Network Status */}
                  {!isCorrectNetwork && (
                    <button
                      onClick={switchToSepolia}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span>Wrong Network (ID: {chainId})</span>
                    </button>
                  ) }

                  
                </div>
              )}

              <ConnectButton />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex justify-around pb-2 border-t pt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs
                    ${isActive
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile Status */}
          {isConnected && (
            <div className="md:hidden pb-2 space-y-2">
              {!isCorrectNetwork ? (
                <button
                  onClick={switchToSepolia}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                >
                  <span>⚠️</span>
                  <span>Switch to Sepolia (Current: {chainId})</span>
                </button>
              ) : (
                <div className="flex justify-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    <span>Sepolia</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <span>💰 {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Debug Panel - Только в dev режиме */}
      {process.env.NODE_ENV === 'development' && isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <details className="max-w-7xl mx-auto">
            <summary className="cursor-pointer text-sm font-medium text-yellow-800 hover:text-yellow-900">
              🐛 Debug Info (click to expand)
            </summary>
            <pre className="mt-2 text-xs text-yellow-900 bg-yellow-100 p-3 rounded overflow-auto">
{debugInfo}
            </pre>
          </details>
        </div>
      )}
    </>
  )
}
