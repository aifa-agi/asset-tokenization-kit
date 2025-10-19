// File: @/app/layout.tsx
// ОБНОВЛЁННАЯ ВЕРСИЯ с Navigation в layout


'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'
import { Web3Provider } from '@/providers/web-3-provider'
import { Navigation } from '@/components/shared/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <title>Property Token - Токенизация недвижимости</title>
        <meta name="description" content="Платформа для инвестирования в недвижимость через blockchain токены" />
      </head>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            {/* Navigation на верхнем уровне - видна везде */}
            <Navigation />
            
            {/* Main Content */}
            <main>
              {children}
            </main>
            
            {/* Toaster для уведомлений */}
            <Toaster 
              position="bottom-right"
              richColors
              closeButton
              duration={5000}
            />
          </Web3Provider>
        </NextThemesProvider>
      </body>
    </html>
  )
}
