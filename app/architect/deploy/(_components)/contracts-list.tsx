// File: app/architect/deploy/(_components)/contracts-list.tsx
// Description:
// - Presentational list of compiled contracts with per-item Deploy button.
// - Stateless UI: parent passes data and handlers; no network calls here.
// - Compact JSX with disabled states to match step flow.

'use client'

import { ReactNode } from 'react'

export interface CompiledContractItem {
  name: string
  // optional metadata if you want to show more later
  bytecodeLength?: number
  deployedAddress?: `0x${string}` | null
}

export interface ContractsListProps {
  items: CompiledContractItem[]
  isDeploying?: boolean
  currentName?: string | null
  // disable deploy buttons under external conditions
  disableDeploy?: boolean
  onDeployClick: (name: string) => void
  className?: string
  rightHeaderSlot?: ReactNode
  renderAfterItem?: (item: CompiledContractItem) => ReactNode
}

export default function ContractsList(props: ContractsListProps) {
  const {
    items,
    isDeploying = false,
    currentName = null,
    disableDeploy = false,
    onDeployClick,
    className,
    rightHeaderSlot,
    renderAfterItem,
  } = props

  return (
    <div
      className={['space-y-4', className || ''].join(' ')}
      role="list"
      aria-label="Contracts list"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Contracts</h3>
        {rightHeaderSlot}
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
          No compiled contracts found.
        </div>
      ) : (
        items.map((item) => {
          const isCurrent = currentName === item.name
          const deployed = !!item.deployedAddress

          return (
            <div
              key={item.name}
              className={[
                'rounded-md border bg-white p-4 shadow-sm',
                isCurrent && isDeploying ? 'border-blue-300' : 'border-gray-200',
              ].join(' ')}
              role="listitem"
              aria-labelledby={`contract-${item.name}-title`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div
                    id={`contract-${item.name}-title`}
                    className="flex items-center gap-2 text-base font-semibold text-gray-900"
                  >
                    {item.name}
                    {deployed && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Deployed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Bytecode length:{' '}
                    <span className="font-mono">
                      {item.bytecodeLength != null ? item.bytecodeLength : '—'}
                    </span>
                  </div>
                  {deployed && item.deployedAddress && (
                    <div className="mt-1 text-xs text-gray-600">
                      Address:{' '}
                      <span className="font-mono break-all">
                        {item.deployedAddress}
                      </span>
                    </div>
                  )}
                </div>

                {!deployed && (
                  <button
                    type="button"
                    onClick={() => onDeployClick(item.name)}
                    disabled={disableDeploy || (isCurrent && isDeploying)}
                    className={[
                      'inline-flex items-center rounded-md px-3 py-1.5 text-sm',
                      'bg-blue-600 text-white hover:bg-blue-700',
                      (disableDeploy || (isCurrent && isDeploying)) ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                    aria-busy={isCurrent && isDeploying}
                  >
                    {isCurrent && isDeploying ? 'Deploying…' : 'Deploy'}
                  </button>
                )}
              </div>

              {renderAfterItem?.(item)}
            </div>
          )
        })
      )}
    </div>
  )
}
