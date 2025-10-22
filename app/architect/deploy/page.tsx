// File: app/architect/deploy/page.tsx
// Root deploy page refactored to use decomposed components.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useBalance, usePublicClient } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import type { PublicClient, WalletClient } from 'viem'
import { formatEther } from 'viem'
import { toast } from 'sonner'

// Components
import WalletGuard from './(_components)/wallet-guard'
import BalanceCard from './(_components)/balance-card'
import ContractsList from './(_components)/contracts-list'
import DeployProgress, { type DeployStepStatus } from './(_components)/deploy-progress'
import StepEstimate, { type StepEstimateResult } from './(_components)/step-estimate'
import StepApproval from './(_components)/step-approval'
import StepConfirm, { type StepConfirmResult } from './(_components)/step-confirm'
import StepSaveAddress from './(_components)/step-save-address'
import ErrorCard from './(_components)/error-card'

// Types
interface CompiledContract {
  name: string
  abi: any[]
  bytecode: string
}

type DeployPhase =
  | 'idle'
  | 'estimating'
  | 'awaiting_approval'
  | 'deploying'
  | 'confirming'
  | 'saving'
  | 'success'
  | 'error'

// Page component
export default function ArchitectDeployPage() {
  const { address, isConnected, chainId, switchToSepolia, walletClient } = useWeb3Status()
  const publicClient = usePublicClient()

  const { data: balance } = useBalance({
    address: address || undefined,
    chainId: sepolia.id,
  })

  const [contracts, setContracts] = useState<CompiledContract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)

  const [phase, setPhase] = useState<DeployPhase>('idle')
  const [currentName, setCurrentName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasPrice, setGasPrice] = useState<bigint | null>(null)
  const estimatedCost = useMemo(() => {
    if (gasEstimate == null || gasPrice == null) return null
    return gasEstimate * gasPrice
  }, [gasEstimate, gasPrice])

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [confirmed, setConfirmed] = useState<StepConfirmResult | null>(null)
  const [deployed, setDeployed] = useState<Record<string, `0x${string}`>>({})

  // Load compiled contracts once
  useEffect(() => {
    void loadCompiledContracts()
  }, [])

  async function loadCompiledContracts() {
    setLoadingContracts(true)
    try {
      const names = ['PropertyTokenFactory', 'MockUSDT']
      const list: CompiledContract[] = []
      for (const name of names) {
        try {
          const res = await fetch(`/api/contracts/compiled/${name}`)
          if (res.ok) {
            const json = await res.json()
            list.push(json)
          }
        } catch {
          // ignore
        }
      }
      setContracts(list)
    } catch (e) {
      setError('Failed to load compiled contracts')
    } finally {
      setLoadingContracts(false)
    }
  }

  // Steps representation for DeployProgress
  const steps: { step: number; label: string; status: DeployStepStatus }[] = [
    { step: 1, label: 'Estimating gas', status: mapPhase('estimating', phase) },
    { step: 2, label: 'Awaiting approval', status: mapPhase('awaiting_approval', phase) },
    { step: 3, label: 'Sending transaction', status: mapPhase('deploying', phase) },
    { step: 4, label: 'Confirming on blockchain', status: mapPhase('confirming', phase) },
    { step: 5, label: 'Saving address', status: mapPhase('saving', phase) },
  ]

  function mapPhase(target: DeployPhase, current: DeployPhase): DeployStepStatus {
    const order: DeployPhase[] = [
      'idle',
      'estimating',
      'awaiting_approval',
      'deploying',
      'confirming',
      'saving',
      'success',
      'error',
    ]
    const t = order.indexOf(target)
    const c = order.indexOf(current)
    if (c < 0 || t < 0) return 'pending'
    if (c === t) return current === 'error' ? 'error' : 'active'
    if (c > t || current === 'success') return 'complete'
    return 'pending'
  }

  const hasBalance = (balance?.value ?? 0n) > 0n
  const allDeployed = contracts.length > 0 && contracts.every(c => deployed[c.name])

  // Orchestration handlers
  function startDeploy(name: string) {
    const found = contracts.find(c => c.name === name)
    if (!found) return

    // guards
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    if (chainId !== sepolia.id) {
      toast.error('Please switch to Sepolia', {
        action: { label: 'Switch', onClick: () => switchToSepolia() },
      })
      return
    }
    if (!publicClient) {
      toast.error('Public client not initialized')
      return
    }
    if (!walletClient) {
      toast.error('Wallet client not available. Please reconnect.')
      return
    }
    if (!hasBalance) {
      toast.error('Insufficient balance for gas')
      return
    }

    // reset state
    setCurrentName(found.name)
    setError(null)
    setPhase('estimating')
    setGasEstimate(null)
    setGasPrice(null)
    setTxHash(null)
    setConfirmed(null)
  }

  function onEstimated(res: StepEstimateResult) {
    setGasEstimate(res.gasEstimate)
    setGasPrice(res.gasPrice)
    setPhase('awaiting_approval')
  }

  function onApprovalSent(hash: `0x${string}`) {
    setTxHash(hash)
    setPhase('deploying') // immediately after sending we consider deploy tx “sent”
    // small UX nudge to move into confirming
    setPhase('confirming')
  }

  function onConfirmed(res: StepConfirmResult) {
    setConfirmed(res)
    setPhase('saving')
  }

  async function onSaved() {
    if (!currentName || !confirmed?.contractAddress) return
    setDeployed(prev => ({ ...prev, [currentName]: confirmed.contractAddress }))
    setPhase('success')
    toast.success(`${currentName} deployed! Cost: ${formatEther(confirmed.actualCost)} ETH`)
  }

  async function deployAll() {
    for (const c of contracts) {
      if (deployed[c.name]) continue
      startDeploy(c.name)
      // wait until success/error
      // polling the phase state is one simple approach for sequential deploy
      await waitForFinish()
      if (phase === 'error') break
    }
  }

  function waitForFinish() {
    return new Promise<void>((resolve) => {
      const iv = setInterval(() => {
        if (phase === 'success' || phase === 'error' || phase === 'idle') {
          clearInterval(iv)
          resolve()
        }
      }, 200)
    })
  }

  // Render
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">🚀 Deploy Contracts</h1>

      <WalletGuard
        className="space-y-6"
        hint="Make sure you are on Sepolia and have some test ETH."
      >
        {/* Balance */}
        <BalanceCard
          balanceWei={balance?.value ?? null}
          estimatedCostWei={estimatedCost ?? null}
        />

        {/* Progress */}
        {currentName && phase !== 'idle' && (
          <DeployProgress steps={steps} />
        )}

        {/* Contract list */}
        {loadingContracts ? (
          <div className="rounded-md border bg-white p-6 text-center text-sm text-gray-600">
            Loading contracts…
          </div>
        ) : (
          <ContractsList
            items={contracts.map(c => ({
              name: c.name,
              bytecodeLength: (c.bytecode?.length ?? 0),
              deployedAddress: deployed[c.name] ?? null,
            }))}
            isDeploying={['estimating','awaiting_approval','deploying','confirming','saving'].includes(phase)}
            currentName={currentName}
            disableDeploy={!isConnected || chainId !== sepolia.id || !hasBalance}
            onDeployClick={startDeploy}
          />
        )}

        {/* Orchestrated steps (render conditionally by phase) */}
        {currentName && phase === 'estimating' && address && publicClient && (
          <StepEstimate
            address={address}
            bytecode={normalize0x(contracts.find(c => c.name === currentName)?.bytecode)}
            publicClient={publicClient as PublicClient}
            onEstimated={onEstimated}
            onError={(m) => { setError(m); setPhase('error') }}
          />
        )}

        {currentName && phase === 'awaiting_approval' && walletClient && (
          <StepApproval
            walletClient={walletClient as WalletClient}
            address={address as `0x${string}`}
            abi={contracts.find(c => c.name === currentName)!.abi}
            bytecode={normalize0x(contracts.find(c => c.name === currentName)!.bytecode)}
            constructorArgs={[]} // ensure viem types are satisfied
            publicClient={publicClient as PublicClient}
            onSent={onApprovalSent}
            onError={(m) => { setError(m); setPhase('error') }}
          />
        )}

        {currentName && phase === 'confirming' && publicClient && txHash && (
          <StepConfirm
            publicClient={publicClient as PublicClient}
            txHash={txHash}
            confirmations={1}
            timeoutMs={120_000}
            onConfirmed={onConfirmed}
            onError={(m) => { setError(m); setPhase('error') }}
          />
        )}

        {currentName && phase === 'saving' && confirmed?.contractAddress && (
          <StepSaveAddress
  contractName={currentName}
  address={confirmed.contractAddress}
  onSaved={onSaved}
  onError={(m: string) => { setError(m); setPhase('error') }}
/>
        )}

        {/* Deploy all */}
        {contracts.length > 0 && !allDeployed && hasBalance && chainId === sepolia.id && (
          <button
            type="button"
            onClick={deployAll}
            disabled={['estimating','awaiting_approval','deploying','confirming','saving'].includes(phase)}
            className={[
              'w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700',
              ['estimating','awaiting_approval','deploying','confirming','saving'].includes(phase) ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Deploy All ({contracts.length - Object.keys(deployed).length} remaining)
          </button>
        )}

        {/* Error block */}
        {error && (
          <ErrorCard
            message={error}
            onRetry={() => {
              setError(null)
              if (currentName) setPhase('estimating')
            }}
          />
        )}

        {/* Success summary */}
        {allDeployed && (
          <div className="rounded-md border-2 border-green-300 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="flex-1">
                <p className="text-lg font-bold text-green-900">All contracts deployed!</p>
                <p className="text-sm text-green-800">
                  Saved addresses and updated UI successfully.
                </p>
              </div>
            </div>
          </div>
        )}
      </WalletGuard>
    </div>
  )
}

// Helpers
function normalize0x(code?: string): `0x${string}` {
  if (!code) return '0x' as `0x${string}`
  return (code.startsWith('0x') ? code : `0x${code}`) as `0x${string}`
}
