// File: app/architect/deploy/(_components)/error-card.tsx
// Description:
// - Presentational error block with title, message, optional details and Retry button.
// - No side effects; parent provides handlers and strings.
// - Compact JSX consistent with other components.

'use client'

import { ReactNode } from 'react'

export interface ErrorCardProps {
  title?: string
  message: string
  details?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export default function ErrorCard(props: ErrorCardProps) {
  const {
    title = 'Deployment Error',
    message,
    details,
    onRetry,
    retryLabel = 'Retry',
    className,
  } = props

  return (
    <div
      className={[
        'rounded-md border-2 border-red-300 bg-red-50 p-4 shadow-sm',
        className || '',
      ].join(' ')}
      role="alert"
      aria-labelledby="error-card-title"
    >
      <div className="flex items-start gap-3">
        <svg className="h-6 w-6 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <div className="flex-1">
          <p id="error-card-title" className="text-sm font-semibold text-red-900">
            {title}
          </p>
          <p className="mt-1 text-sm text-red-800">
            {message}
          </p>

          {details && (
            <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-900">
              {details}
            </div>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                {retryLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
