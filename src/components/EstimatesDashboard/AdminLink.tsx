'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function AdminLink() {
  const { data: session } = useSession();
  if ((session?.user as unknown as Record<string, unknown> | undefined)?.role !== 'ADMIN') return null;
  return (
    <Link
      href="/admin/labor-roles"
      className="text-sm font-medium transition-opacity hover:opacity-70"
      style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)' }}
    >
      Admin
    </Link>
  );
}
