// File: @/components/shared/navigation.tsx
// ОБНОВЛЁННАЯ ВЕРСИЯ с Architect режимом и force refresh


'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useEffect } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected, address } = useWeb3Status()

  // Force refresh при изменении подключения кошелька
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Wallet connected:', address)
      // Refresh текущей страницы для обновления UI
      router.refresh()
    }
  }, [isConnected, address, router])

  const navItems = [
    { href: '/', label: 'Главная', icon: '🏠', roles: ['all'] },
    { href: '/architect', label: 'Архитектор', icon: '🏗️', roles: ['architect'] },
    { href: '/admin', label: 'Админ', icon: '⚙️', roles: ['admin'] },
    { href: '/investor', label: 'Инвестор', icon: '💰', roles: ['investor'] },
  ]

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>🏘️</span>
            <span className="hidden sm:inline">AIFA Tokenization kit</span>
          </Link>

          {/* Navigation Links - Desktop */}
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

          {/* Connect Button */}
          <div className="flex items-center gap-2">
            {/* Connection Status Indicator */}
            {isConnected && address && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
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
      </div>
    </nav>
  )
}
