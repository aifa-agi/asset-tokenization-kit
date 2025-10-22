// File: app/architect/deploy/(_components)/balance-card.tsx
// Description:
// - Presentational card showing wallet balance and next deployment estimated cost.
// - No side effects; purely UI. Parent provides values and URLs.
// - Compact and resilient JSX for App Router client subtree.

'use client'

import { ReactNode } from 'react'
import { formatEther } from 'viem'

export interface BalanceCardProps {
  balanceWei: bigint | null
  estimatedCostWei?: bigint | null
  faucetUrl?: string
  // Optional custom right-side slot (e.g., network name, chip)
  rightSlot?: ReactNode
  className?: string
}

export default function BalanceCard(props: BalanceCardProps) {
  const {
    balanceWei,
    estimatedCostWei,
    faucetUrl = 'https://sepolia-faucet.pk910.de',
    rightSlot,
    className,
  } = props

  const hasBalance = (balanceWei ?? 0n) > 0n

  return (
    <div
      className={[
        'rounded-md border p-4 shadow-sm',
        hasBalance ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="balance-card-title"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id="balance-card-title" className="text-sm font-semibold text-gray-900">
            Wallet Balance
          </h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {balanceWei != null ? formatEther(balanceWei) : '—'} ETH
          </p>
        </div>

        <div className="text-right">
          {estimatedCostWei != null && (
            <>
              <div className="text-sm text-gray-600">Next Deploy Cost</div>
              <div className="text-xl font-semibold text-blue-900">
                {formatEther(estimatedCostWei)} ETH
              </div>
            </>
          )}
          {rightSlot}
        </div>
      </div>

      {!hasBalance && (
        <div className="mt-4 rounded-md border border-orange-200 bg-orange-100 p-3 text-sm text-orange-900">
          You need Sepolia ETH to deploy contracts.
          {faucetUrl && (
            <>
              {' '}Get free testnet ETH from{' '}
              <a
                href={faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-orange-900"
              >
                PoW Faucet
              </a>
              .
            </>
          )}
        </div>
      )}
    </div>
  )
}
