'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function EstimateError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6"
      style={{ backgroundColor: 'var(--cc-parchment)' }}
    >
      <h2
        className="text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
      >
        Something went wrong
      </h2>
      <p
        className="text-sm"
        style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-body)' }}
      >
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={unstable_retry}
          className="px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--cc-burnt-sienna)', fontFamily: 'var(--font-display)' }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-medium"
          style={{ color: 'var(--cc-gray-mid)', fontFamily: 'var(--font-display)' }}
        >
          Back to Estimates
        </Link>
      </div>
    </div>
  )
}
