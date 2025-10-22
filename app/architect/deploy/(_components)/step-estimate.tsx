// File: app/architect/deploy/(_components)/step-estimate.tsx
// Description:
// - Client component that encapsulates Step 1 (Gas Estimation) of the deploy flow.
// - Uses viem's publicClient.estimateGas + publicClient.getGasPrice to compute estimated cost.
// - Emits results to parent via onEstimated callback; notifies errors via onError.
// - Renders a compact, stable JSX block with retry/continue controls.
// Notes:
// - Comments are in English (as requested).
// - Designed for Next.js App Router client subtree.
// - No external UI deps assumed; parent may wrap it into a Card.

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PublicClient } from 'viem'
import { formatEther } from 'viem'

type StepEstimateStatus = 'idle' | 'estimating' | 'done' | 'error'

export interface StepEstimateResult {
  gasEstimate: bigint
  gasPrice: bigint
  estimatedCost: bigint
}

export interface StepEstimateProps {
  // EOA that will deploy the contract (required by estimateGas account field)
  address: `0x${string}`
  // Full bytecode with 0x prefix (parent ensures normalization)
  bytecode: `0x${string}`
  // viem public client bound to Sepolia (same chain as wallet)
  publicClient: PublicClient
  // Called on successful estimation
  onEstimated: (result: StepEstimateResult) => void
  // Optional error handler
  onError?: (message: string) => void
  // Disable all actions (e.g., while parent is advancing to next step)
  disabled?: boolean
  // Optional UI className passthrough
  className?: string
  // Auto-run on mount (default: true)
  autoRun?: boolean
}

export default function StepEstimate(props: StepEstimateProps) {
  const {
    address,
    bytecode,
    publicClient,
    onEstimated,
    onError,
    disabled = false,
    className,
    autoRun = true,
  } = props

  const [status, setStatus] = useState<StepEstimateStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasPrice, setGasPrice] = useState<bigint | null>(null)
  const estimatedCost = useMemo(() => {
    if (gasEstimate == null || gasPrice == null) return null
    return gasEstimate * gasPrice
  }, [gasEstimate, gasPrice])

  // Step-by-step understanding:
  // 1) Call publicClient.estimateGas({ account, data }) to get gas units.
  // 2) Call publicClient.getGasPrice() to get current base gas price (wei).
  // 3) Multiply to derive estimated wei cost; parent may buffer (e.g., +20%).
  // 4) Emit results via onEstimated; keep compact, resilient JSX.

  const runEstimate = useCallback(async () => {
    if (disabled) return
    setStatus('estimating')
    setError(null)
    setGasEstimate(null)
    setGasPrice(null)

    try {
      // Core viem calls for gas estimation
      const gas = await publicClient.estimateGas({
        account: address,
        data: bytecode,
      })
      const price = await publicClient.getGasPrice()

      setGasEstimate(gas)
      setGasPrice(price)
      setStatus('done')

      onEstimated({
        gasEstimate: gas,
        gasPrice: price,
        estimatedCost: gas * price,
      })
    } catch (e: any) {
      const message =
        e?.shortMessage ||
        e?.message ||
        'Failed to estimate gas. Please try again.'
      setError(message)
      setStatus('error')
      onError?.(message)
    }
  }, [address, bytecode, publicClient, onEstimated, onError, disabled])

  // Auto-run on mount and when inputs change (address/bytecode/publicClient).
  useEffect(() => {
    if (!autoRun) return
    // Avoid firing with incomplete inputs
    if (!address || !bytecode?.startsWith('0x') || !publicClient) return
    void runEstimate()
  }, [address, bytecode, publicClient, autoRun, runEstimate])

  return (
    <div
      className={[
        'rounded-md border border-gray-200 bg-white p-4',
        'shadow-sm',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="step-estimate-title"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id="step-estimate-title" className="text-sm font-semibold text-gray-900">
          Step 1 — Estimating gas
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runEstimate}
            disabled={disabled || status === 'estimating'}
            className={[
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
              'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
              disabled || status === 'estimating' ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            aria-busy={status === 'estimating'}
          >
            {status === 'estimating' ? 'Estimating…' : 'Re-estimate'}
          </button>

          <button
            type="button"
            // Parent should wire this to advance the step only when status === 'done'
            onClick={() => {
              if (status !== 'done' || gasEstimate == null || gasPrice == null) return
              onEstimated({
                gasEstimate,
                gasPrice,
                estimatedCost: gasEstimate * gasPrice,
              })
            }}
            disabled={
              disabled || status !== 'done' || gasEstimate == null || gasPrice == null
            }
            className={[
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
              'bg-blue-600 text-white hover:bg-blue-700',
              disabled || status !== 'done' ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Continue
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Deployer: <span className="font-mono">{address}</span>
        </div>
        <div className="text-xs text-gray-600">
          Bytecode length: <span className="font-mono">{bytecode.length}</span>
        </div>

        {status === 'estimating' && (
          <div className="text-sm text-gray-700">Estimating gas…</div>
        )}

        {status === 'error' && error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {status === 'done' && gasEstimate != null && gasPrice != null && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Gas (units)
              </div>
              <div className="font-mono text-sm">{gasEstimate.toString()}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Gas Price (wei)
              </div>
              <div className="font-mono text-sm">{gasPrice.toString()}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Estimated Cost (ETH)
              </div>
              <div className="font-mono text-sm">
                {formatEther(gasEstimate * gasPrice)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
