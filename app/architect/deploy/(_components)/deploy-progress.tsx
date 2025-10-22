// File: app/architect/deploy/(_components)/deploy-progress.tsx
// Description:
// - Pure UI component to render a 5-step progress list for deploy flow.
// - Accepts steps with status: 'pending' | 'active' | 'complete' | 'error'.
// - No side effects; compact JSX for App Router client subtree.

'use client'

import { ReactNode } from 'react'

export type DeployStepStatus = 'pending' | 'active' | 'complete' | 'error'

export interface DeployStepItem {
  step: number
  label: string
  status: DeployStepStatus
  description?: string
  rightSlot?: ReactNode
}

export interface DeployProgressProps {
  steps: DeployStepItem[]
  className?: string
}

export default function DeployProgress(props: DeployProgressProps) {
  const { steps, className } = props

  return (
    <div
      className={['rounded-md border border-gray-200 bg-white p-4 shadow-sm', className || ''].join(' ')}
      role="region"
      aria-labelledby="deploy-progress-title"
    >
      <h3 id="deploy-progress-title" className="mb-3 text-sm font-semibold text-gray-900">
        Deployment Progress
      </h3>

      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.step} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center">
              {renderStatusIcon(s.status, s.step)}
            </div>

            <div className="flex-1">
              <div
                className={[
                  'flex items-center justify-between gap-2',
                  s.status === 'active' ? 'text-blue-900' :
                  s.status === 'complete' ? 'text-green-900' :
                  s.status === 'error' ? 'text-red-900' : 'text-gray-700',
                ].join(' ')}
              >
                <span className="text-sm font-medium">{s.label}</span>
                {s.rightSlot}
              </div>

              {s.description && (
                <p className="mt-1 text-xs text-gray-600">{s.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function renderStatusIcon(status: DeployStepStatus, step: number) {
  if (status === 'pending') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300">
        <span className="text-xs text-gray-400">{step}</span>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    )
  }
  if (status === 'complete') {
    return (
      <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  // error
  return (
    <svg className="h-6 w-6 text-red-600" viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
