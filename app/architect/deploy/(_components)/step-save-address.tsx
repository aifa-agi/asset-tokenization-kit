// File: app/architect/deploy/(_components)/step-save-address.tsx
// Description:
// - Client component for Step 5: persists deployed contract address via server endpoints.
// - In development it calls /api/contracts/save-address-local (filesystem .env.local).
// - In production it calls /api/contracts/save-address-github (GitHub Contents API).
// - Keeps a prop "endpoint" to allow explicit override by parent if needed.
// - Shows compact UI state, endpoint diagnostics, and supports retry.
//
// Understanding (before coding):
// 1) The client must not implement persistence logic; it only calls the right server route.
// 2) The route selection is environment-based (build-time NODE_ENV) with safe override.
// 3) Provide clear feedback: which endpoint was called and the current status.
// 4) Keep predictable props surface so parent orchestration remains unchanged.

'use client'

import { useCallback, useMemo, useState } from 'react'

type StepSaveStatus = 'idle' | 'saving' | 'done' | 'error'

export interface StepSaveAddressProps {
  contractName: string
  address: `0x${string}` | null
  // Optional override. If omitted, endpoint is chosen by NODE_ENV.
  endpoint?: string
  // Optional metadata payload (forwarded to server)
  metadata?: Record<string, unknown>
  onSaved: () => void
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
  autoRun?: boolean
}

function chooseDefaultEndpoint() {
  // Build-time selection; for Vercel/Next this is baked during build.
  if (process.env.NODE_ENV === 'production') {
    return '/api/contracts/save-address-github'
  }
  return '/api/contracts/save-address-local'
}

export default function StepSaveAddress(props: StepSaveAddressProps) {
  const {
    contractName,
    address,
    endpoint,
    metadata,
    onSaved,
    onError,
    disabled = false,
    className,
    autoRun = true,
  } = props

  const [status, setStatus] = useState<StepSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const resolvedEndpoint = useMemo(() => endpoint || chooseDefaultEndpoint(), [endpoint])
  const canRun = useMemo(() => !!address && !disabled, [address, disabled])

  const save = useCallback(async () => {
    if (!address || disabled) return
    setStatus('saving')
    setError(null)

    try {
      const res = await fetch(resolvedEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName,
          address,
          ...(metadata ? { metadata } : {}),
        }),
      })

      if (!res.ok) {
        // Try to show clearer server feedback if available
        let msg = ''
        try {
          const data = await res.json()
          msg = data?.error || JSON.stringify(data)
        } catch {
          msg = await res.text().catch(() => '')
        }
        throw new Error(msg || `Failed to save address. Server returned ${res.status}.`)
      }

      setStatus('done')
      onSaved()
    } catch (e: any) {
      const message =
        e?.shortMessage || e?.message || 'Failed to save address. Please retry.'
      setError(message)
      setStatus('error')
      onError?.(message)
    }
  }, [address, disabled, resolvedEndpoint, contractName, metadata, onSaved, onError])

  // Auto-run when address appears
  useMemo(() => {
    if (autoRun && canRun && status === 'idle') {
      void save()
    }
  }, [autoRun, canRun, status, save])

  return (
    <div
      className={[
        'rounded-md border border-gray-200 bg-white p-4 shadow-sm',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="step-save-title"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 id="step-save-title" className="text-sm font-semibold text-gray-900">
          Step 5 — Save contract address
        </h3>

        <button
          type="button"
          onClick={save}
          disabled={!canRun || status === 'saving'}
          className={[
            'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
            'bg-blue-600 text-white hover:bg-blue-700',
            (!canRun || status === 'saving') ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
          aria-busy={status === 'saving'}
        >
          {status === 'saving' ? 'Saving…' : 'Save now'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Name: <span className="font-mono">{contractName || '—'}</span>
        </div>
        <div className="text-xs text-gray-600">
          Address: <span className="font-mono break-all">{address ?? '—'}</span>
        </div>
        <div className="text-[11px] text-gray-500">
          Endpoint: <span className="font-mono">{resolvedEndpoint}</span>
        </div>

        {status === 'error' && error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
            Address saved successfully.
          </div>
        )}
      </div>
    </div>
  )
}
