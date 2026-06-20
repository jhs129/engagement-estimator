export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--cc-parchment)' }}
    >
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
  )
}
