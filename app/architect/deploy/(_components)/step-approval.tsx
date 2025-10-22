// File: app/architect/deploy/(_components)/step-approval.tsx
// Description:
// - Step 2 with strong prechecks + wallet-first sending flow and visual diagnostics.
// - Flow: precheck -> open wallet -> await signature -> send -> sent.
// - Fallbacks: deployContract -> sendTransaction (creation) -> EIP-1193 eth_sendTransaction.
// - Comments in English.

// Understanding before coding (step-by-step):
// 1) Validate inputs/state (wallet/client/chain/abi/args/bytecode) before opening wallet.
// 2) Prefer viem walletClient.deployContract (wallet transport).
// 3) If not available (-32601 / not implemented), try walletClient.sendTransaction with creation data.
// 4) If still not available, call provider.request({ method: 'eth_sendTransaction' }) directly.
// 5) Render clear statuses & hints; surface detailed error messages for localization.

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PublicClient, WalletClient } from 'viem'
import { sepolia } from 'wagmi/chains'

type UiStatus =
  | 'idle'
  | 'precheck'
  | 'precheck_failed'
  | 'opening_wallet'
  | 'awaiting_signature'
  | 'sending'
  | 'sent'
  | 'error'

export interface StepApprovalProps {
  walletClient: WalletClient | null
  address: `0x${string}`
  abi: any[]
  bytecode: `0x${string}`
  constructorArgs?: any[]
  publicClient?: PublicClient
  onSent: (hash: `0x${string}`) => void
  onError?: (message: string) => void
  disabled?: boolean
  className?: string
  popupHintDelayMs?: number
}

export default function StepApproval(props: StepApprovalProps) {
  const {
    walletClient,
    address,
    abi,
    bytecode,
    constructorArgs,
    publicClient,
    onSent,
    onError,
    disabled = false,
    className,
    popupHintDelayMs = 8000,
  } = props

  const [status, setStatus] = useState<UiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [showPopupHint, setShowPopupHint] = useState(false)
  const [connectorName, setConnectorName] = useState<string>('unknown')
  const [providerSupportsRequest, setProviderSupportsRequest] = useState<boolean | null>(null)

  const popupTimer = useRef<number | null>(null)

  const expectedChainId = sepolia.id
  const [actualChainId, setActualChainId] = useState<number | null>(null)

  // Normalize constructor args to array
  const args = useMemo<any[]>(() => {
    if (!constructorArgs) return []
    return Array.isArray(constructorArgs) ? constructorArgs : [constructorArgs]
  }, [constructorArgs])

  // Extract constructor inputs from ABI
  const constructorInputs = useMemo(() => {
    const ctor = Array.isArray(abi)
      ? abi.find((f: any) => f?.type === 'constructor')
      : undefined
    return ctor?.inputs ?? []
  }, [abi])

  // Read chain id for diagnostics
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (publicClient) {
          const id = await publicClient.getChainId()
          if (alive) setActualChainId(id)
        } else {
          if (alive) setActualChainId(expectedChainId)
        }
      } catch {
        // ignore
      }
    })()
    return () => { alive = false }
  }, [publicClient, expectedChainId])

  // Try to reach underlying EIP-1193 provider from WalletClient transport
  const eip1193 = useMemo(() => {
    try {
      const anyClient = walletClient as any
      const provider = anyClient?.transport?.value?.provider
      return provider || null
    } catch {
      return null
    }
  }, [walletClient])

  useEffect(() => {
    try {
      const anyClient = walletClient as any
      if (anyClient?.transport?.type) {
        setConnectorName(String(anyClient.transport.type))
      }
      setProviderSupportsRequest(!!eip1193?.request)
    } catch {
      setProviderSupportsRequest(null)
    }
  }, [walletClient, eip1193])

  // Prechecks to block invalid requests early
  const precheck = useMemo(() => {
    const issues: string[] = []
    if (!walletClient) issues.push('Wallet client is not connected')
    if (!address) issues.push('Deployer address is empty')
    if (actualChainId != null && actualChainId !== expectedChainId) {
      issues.push(`Wrong network: expected Sepolia (${expectedChainId}), got ${actualChainId}`)
    }
    const expectedArgCount = constructorInputs.length
    if (expectedArgCount !== args.length) {
      issues.push(`Constructor args mismatch: expected ${expectedArgCount}, provided ${args.length}`)
    }
    if (!bytecode || !bytecode.startsWith('0x') || bytecode.length < 10) {
      issues.push('Invalid bytecode: missing 0x prefix or too short')
    }
    return { ok: issues.length === 0, issues }
  }, [walletClient, address, actualChainId, expectedChainId, constructorInputs, args, bytecode])

  // Timers for wallet popup hint
  useEffect(() => {
    return () => {
      if (popupTimer.current) {
        window.clearTimeout(popupTimer.current)
        popupTimer.current = null
      }
    }
  }, [])

  const startPopupHintTimer = useCallback(() => {
    if (popupTimer.current) {
      window.clearTimeout(popupTimer.current)
      popupTimer.current = null
    }
    popupTimer.current = window.setTimeout(() => {
      setShowPopupHint(true)
    }, popupHintDelayMs)
  }, [popupHintDelayMs])

  const clearPopupHintTimer = useCallback(() => {
    if (popupTimer.current) {
      window.clearTimeout(popupTimer.current)
      popupTimer.current = null
    }
  }, [])

  // Fallback #1: creation tx via walletClient.sendTransaction
  const fallbackSendCreation = useCallback(async () => {
    if (!walletClient) throw new Error('Wallet not connected')
    const hash = await walletClient.sendTransaction({
      account: address,
      to: null, // contract creation
      data: bytecode,
      chain: sepolia,
    })
    return hash
  }, [walletClient, address, bytecode])

  // Fallback #2: raw EIP-1193 eth_sendTransaction to wallet provider
  const fallbackEip1193Send = useCallback(async () => {
    if (!eip1193?.request) {
      throw new Error('EIP-1193 provider not available on connector')
    }
    const hash = await eip1193.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: address,
          data: bytecode,
        },
      ],
    }) as `0x${string}`
    return hash
  }, [eip1193, address, bytecode])

  const deploy = useCallback(async () => {
    if (disabled) return

    setStatus('precheck')
    setError(null)
    setTxHash(null)
    setShowPopupHint(false)

    // Stop early if prechecks fail
    if (!precheck.ok) {
      const msg = precheck.issues.join('; ')
      setStatus('precheck_failed')
      setError(msg)
      onError?.(msg)
      return
    }
    if (!walletClient) {
      const msg = 'Wallet is not connected. Please reconnect.'
      setStatus('precheck_failed')
      setError(msg)
      onError?.(msg)
      return
    }

    try {
      setStatus('opening_wallet')
      startPopupHintTimer()
      setStatus('awaiting_signature')

      let hash: `0x${string}` | null = null

      // Preferred path (wallet transport)
      try {
        hash = await walletClient.deployContract({
          abi,
          bytecode,
          account: address,
          args,
          chain: sepolia,
        })
      } catch (inner: any) {
        // If wallet path not available, fallback to creation tx
        const msg = String(inner?.message || inner)
        const notAvailable =
          msg.includes('wallet_sendTransaction does not exist') ||
          msg.includes('method is currently not implemented') ||
          msg.includes('not available') ||
          inner?.code === -32601

        if (notAvailable) {
          try {
            hash = await fallbackSendCreation()
          } catch {
            // Last resort: EIP-1193 direct request
            hash = await fallbackEip1193Send()
          }
        } else {
          throw inner
        }
      }

      clearPopupHintTimer()
      setShowPopupHint(false)

      if (!hash) throw new Error('No transaction hash returned by wallet')

      setTxHash(hash)
      setStatus('sent')
      onSent(hash)
    } catch (e: any) {
      clearPopupHintTimer()
      const message = normalizeDeployError(e)
      setStatus('error')
      setError(message)
      onError?.(message)
    }
  }, [
    disabled,
    precheck,
    walletClient,
    abi,
    bytecode,
    address,
    args,
    onSent,
    onError,
    startPopupHintTimer,
    clearPopupHintTimer,
    fallbackSendCreation,
    fallbackEip1193Send,
  ])

  return (
    <div
      className={[
        'rounded-md border border-gray-200 bg-white p-4 shadow-sm',
        className || '',
      ].join(' ')}
      role="region"
      aria-labelledby="step-approval-title"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 id="step-approval-title" className="text-sm font-semibold text-gray-900">
          Step 2 — Awaiting approval
        </h3>

        <button
          type="button"
          onClick={deploy}
          disabled={disabled || status === 'awaiting_signature' || status === 'opening_wallet'}
          className={[
            'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
            'bg-orange-600 text-white hover:bg-orange-700',
            (disabled || status === 'awaiting_signature' || status === 'opening_wallet') ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
          aria-busy={status === 'awaiting_signature' || status === 'opening_wallet'}
        >
          {status === 'awaiting_signature' || status === 'opening_wallet' ? 'Waiting in wallet…' : 'START'}
        </button>
      </div>

      {/* Diagnostics */}
      <div className="space-y-2">
        <KeyValue label="Connector" value={connectorName} />
        <KeyValue label="Provider.request available" value={String(providerSupportsRequest)} />
        <KeyValue label="Deployer" value={address} mono />
        <KeyValue label="Network (expected)" value={`Sepolia (${expectedChainId})`} />
        <KeyValue label="Network (actual)" value={actualChainId != null ? String(actualChainId) : '—'} />
        <KeyValue label="Constructor args" value={JSON.stringify(args)} mono />
        <KeyValue label="Bytecode length" value={String(bytecode.length)} />

        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2">
          <div className="text-xs font-semibold text-gray-800">Prechecks</div>
          <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
            <li className={walletClient ? 'text-green-700' : 'text-red-700'}>Wallet client: {walletClient ? 'ok' : 'missing'}</li>
            <li className={actualChainId === expectedChainId ? 'text-green-700' : 'text-red-700'}>Chain: {actualChainId === expectedChainId ? 'Sepolia' : `Wrong (${actualChainId ?? 'unknown'})`}</li>
            <li className={address ? 'text-green-700' : 'text-red-700'}>Account: {address ? 'ok' : 'missing'}</li>
            <li className={constructorInputs.length === args.length ? 'text-green-700' : 'text-red-700'}>
              Constructor args: expected {constructorInputs.length}, provided {args.length}
            </li>
            <li className={bytecode?.startsWith('0x') && bytecode.length > 10 ? 'text-green-700' : 'text-red-700'}>
              Bytecode: {bytecode?.startsWith('0x') && bytecode.length > 10 ? 'ok' : 'invalid'}
            </li>
          </ul>

          {status === 'precheck_failed' && error && (
            <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}
        </div>

        {showPopupHint && (status === 'opening_wallet' || status === 'awaiting_signature') && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
            If you don’t see a wallet popup, open your wallet extension/app and check the pending request. Reconnect WalletConnect if needed.
          </div>
        )}

        {status === 'sent' && txHash && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-sm text-blue-800">
            <div className="mb-1 font-medium">Transaction sent</div>
            <div className="font-mono break-all">{txHash}</div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800 whitespace-pre-wrap">
            <div className="font-semibold">Deployment Error</div>
            <div className="mt-1 text-xs">{error}</div>
            <div className="mt-2 text-xs text-red-900">
              Tips:
              <ul className="list-disc pl-5">
                <li>Check constructor parameters vs ABI (order and types).</li>
                <li>Ensure network is Sepolia in wallet.</li>
                <li>Confirm the bytecode is creation bytecode with 0x prefix.</li>
                <li>Reconnect wallet if no popup appears.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KeyValue(props: { label: string; value: string; mono?: boolean }) {
  const { label, value, mono } = props
  return (
    <div className="text-xs text-gray-600">
      {label}: <span className={mono ? 'font-mono break-all' : ''}>{value}</span>
    </div>
  )
}

function normalizeDeployError(e: any): string {
  const parts: string[] = []
  if (e?.shortMessage) parts.push(e.shortMessage)
  if (e?.message && !parts.includes(e.message)) parts.push(e.message)
  const detail = e?.details || e?.cause?.data || e?.cause?.message || e?.stack
  if (detail) {
    const text = typeof detail === 'string' ? detail : safeStringify(detail)
    parts.push(text.slice(0, 3000))
  }
  if (parts.length === 0) return 'Failed to send deploy transaction. Please try again.'
  return parts.join('\n\n')
}
function safeStringify(x: unknown) {
  try { return JSON.stringify(x, null, 2) } catch { return String(x) }
}
