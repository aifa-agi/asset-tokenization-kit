// File: app/architect/deploy/(_components)/step-confirm.tsx
// Description:
// - Client component for Step 4: wait for confirmation (transaction receipt).
// - Uses viem PublicClient.waitForTransactionReceipt.
// - Extracts contractAddress, gasUsed, effectiveGasPrice, computes actual cost.
// - Emits result via onConfirmed; exposes retry.
// Notes:
// - Comments in English.
// - It does not send tx; only confirms.

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PublicClient } from 'viem'
import { formatEther } from 'viem'

type StepConfirmStatus = 'idle' | 'waiting' | 'done' | 'error'

export interface StepConfirmResult {
  contractAddress: `0x${string}`
  gasUsed: bigint
  effectiveGasPrice: bigint
  actualCost: bigint
  receipt: any
}

export interface StepConfirmProps {
  publicClient: PublicClient
  txHash: `0x${string}` | null
  confirmations?: number
  timeoutMs?: number
  onConfirmed: (result: StepConfirmResult) => void
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
  autoRun?: boolean
}

export default function StepConfirm(props: StepConfirmProps) {
  const {
    publicClient,
    txHash,
    confirmations = 1,
    timeoutMs = 120_000,
    onConfirmed,
    onError,
    disabled = false,
    className,
    autoRun = true,
  } = props

  const [status, setStatus] = useState<StepConfirmStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [actualCost, setActualCost] = useState<bigint | null>(null)
  const [contractAddress, setContractAddress] = useState<`0x${string}` | null>(null)
  const [gasUsed, setGasUsed] = useState<bigint | null>(null)
  const [effectiveGasPrice, setEffectiveGasPrice] = useState<bigint | null>(null)

  const canRun = useMemo(() => !!txHash && !disabled, [txHash, disabled])

  const waitReceipt = useCallback(async () => {
    if (!txHash || disabled) return
    setStatus('waiting')
    setError(null)
    setActualCost(null)
    setGasUsed(null)
    setEffectiveGasPrice(null)
    setContractAddress(null)

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
        timeout: timeoutMs,
      })

      const addr = receipt.contractAddress as `0x${string}` | null
      const used = receipt.gasUsed
      const price = receipt.effectiveGasPrice
      const cost = used * price

      if (!addr) {
        throw new Error('Contract address not found in receipt')
      }

      setContractAddress(addr)
      setGasUsed(used)
      setEffectiveGasPrice(price)
      setActualCost(cost)
      setStatus('done')

      onConfirmed({
        contractAddress: addr,
        gasUsed: used,
        effectiveGasPrice: price,
        actualCost: cost,
        receipt,
      })
    } catch (e: any) {
      const message =
        e?.shortMessage ||
        e?.message ||
        'Failed to confirm transaction. Please try again.'
      setError(message)
      setStatus('error')
      onError?.(message)
    }
  }, [txHash, confirmations, timeoutMs, publicClient, disabled, onConfirmed, onError])

  useEffect(() => {
    if (!autoRun) return
    if (canRun) void waitReceipt()
  }, [canRun, autoRun, waitReceipt])

  return (
    <div
      className={[
        'rounded-md border border-gray-200 bg-white p-4 shadow-sm',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="step-confirm-title"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id="step-confirm-title" className="text-sm font-semibold text-gray-900">
          Step 4 — Confirming on blockchain
        </h3>

        <button
          type="button"
          onClick={waitReceipt}
          disabled={!canRun || status === 'waiting'}
          className={[
            'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
            'bg-blue-600 text-white hover:bg-blue-700',
            (!canRun || status === 'waiting') ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
          aria-busy={status === 'waiting'}
        >
          {status === 'waiting' ? 'Waiting…' : 'Retry'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Tx Hash:{' '}
          <span className="font-mono break-all">
            {txHash ?? '—'}
          </span>
        </div>

        {status === 'waiting' && (
          <div className="text-sm text-gray-700">
            This may take 30–60 seconds…
          </div>
        )}

        {status === 'error' && error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {status === 'done' && contractAddress && actualCost != null && gasUsed != null && effectiveGasPrice != null && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Contract Address
              </div>
              <div className="font-mono text-sm break-all">{contractAddress}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Actual Cost (ETH)
              </div>
              <div className="font-mono text-sm">
                {formatEther(actualCost)}
              </div>
            </div>
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Gas Used
              </div>
              <div className="font-mono text-sm">{gasUsed.toString()}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Effective Gas Price (wei)
              </div>
              <div className="font-mono text-sm">{effectiveGasPrice.toString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
