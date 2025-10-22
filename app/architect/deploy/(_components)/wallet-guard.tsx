// File: app/architect/deploy/(_components)/wallet-guard.tsx
// Description:
// - Client component that guards deploy flow by enforcing wallet connection and Sepolia chain.
// - Integrates with your useWeb3Status() (address, isConnected, chainId, switchToSepolia).
// - Renders children only when conditions are satisfied; otherwise shows concise guidance.
// Notes:
// - Comments in English; minimal styling so you can embed into your design system.

'use client'

import { ReactNode, useMemo } from 'react'
import { sepolia } from 'wagmi/chains'
import { useWeb3Status } from '@/providers/web-3-provider'

export interface WalletGuardProps {
  children: ReactNode
  // Optional custom texts
  title?: string
  description?: string
  // When true, hide children entirely until ready; when false, still render but visually dimmed
  strict?: boolean
  className?: string
  // Optional extra hint block
  hint?: ReactNode
}

export default function WalletGuard(props: WalletGuardProps) {
  const {
    children,
    title = 'Wallet & Network Guard',
    description = 'Please connect a wallet and switch to the Sepolia test network to continue.',
    strict = true,
    className,
    hint,
  } = props

  const {
    isConnected,
    address,
    chainId,
    switchToSepolia,
  } = useWeb3Status()

  const onSepolia = useMemo(() => chainId === sepolia.id, [chainId])
  const ready = isConnected && !!address && onSepolia

  if (ready) {
    return (
      <div className={className}>
        {children}
      </div>
    )
  }

  // Guard UI
  return (
    <div
      className={[
        'rounded-md border border-amber-200 bg-amber-50 p-4',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="wallet-guard-title"
    >
      <div className="mb-2">
        <h3 id="wallet-guard-title" className="text-sm font-semibold text-amber-900">
          {title}
        </h3>
        <p className="text-sm text-amber-800">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isConnected && (
          <button
            type="button"
            // RainbowKit exposes a ConnectButton component, but here we keep it generic:
            onClick={() => {
              // If you use RainbowKit ConnectButton, replace this with opening the modal.
              // Alternatively, navigate to a page where the ConnectButton is visible.
              // This placeholder ensures the layout stays self-contained.
              const el = document.querySelector<HTMLElement>('[data-rk] button')
              el?.click()
            }}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}

        {isConnected && !onSepolia && (
          <button
            type="button"
            onClick={switchToSepolia}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Switch to Sepolia
          </button>
        )}
      </div>

      {hint ? (
        <div className="mt-3 text-xs text-amber-900">{hint}</div>
      ) : (
        <div className="mt-3 text-xs text-amber-900">
          Need Sepolia ETH? Try PoW faucet or your preferred faucet provider.
        </div>
      )}

      {!strict && (
        <div className="mt-4 opacity-50 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  )
}
