import Link from 'next/link'
import { AdminLink } from '@/components/EstimatesDashboard/AdminLink'

export function AppNav() {
  return (
    <header
      style={{
        backgroundColor: 'var(--cc-parchment)',
        borderBottom: '2px solid var(--cc-black)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="px-6 flex items-center justify-between"
        style={{ height: '48px' }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', lineHeight: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cc-logo.png"
            alt="Chameleon Collective"
            style={{ height: '22px', width: 'auto' }}
          />
        </Link>

        <nav className="flex items-center gap-6">
          <AdminLink />
          <Link
            href="/profile"
            className="text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  )
}
