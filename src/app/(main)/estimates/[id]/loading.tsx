export default function EstimateLoading() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--cc-parchment)' }}
    >
      {/* Nav skeleton */}
      <div
        style={{
          backgroundColor: 'var(--cc-parchment)',
          borderBottom: '1px solid var(--cc-gray-light)',
          padding: '0 32px',
        }}
      >
        <div className="flex items-center gap-8 h-14">
          <div
            className="animate-pulse rounded"
            style={{ width: '120px', height: '14px', backgroundColor: 'var(--cc-gray-light)' }}
          />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded"
                style={{ width: '72px', height: '10px', backgroundColor: 'var(--cc-gray-light)', margin: '0 4px' }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Content spinner */}
      <div className="flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div
          className="animate-spin rounded-full"
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--cc-gray-light)',
            borderTopColor: 'var(--cc-burnt-sienna)',
          }}
        />
      </div>
    </div>
  )
}
