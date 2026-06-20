'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export function AdminLink() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if ((session?.user as unknown as Record<string, unknown> | undefined)?.role !== 'ADMIN') return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium transition-opacity hover:opacity-70"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-gray-mid)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Admin ▾
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#fff',
            border: '1px solid var(--cc-gray-light)',
            minWidth: '160px',
            zIndex: 50,
          }}
        >
          {[
            { href: '/admin/clients', label: 'Clients' },
            { href: '/admin/projects', label: 'Projects' },
            { href: '/admin/labor-roles', label: 'Labor Rates' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:opacity-70"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--cc-black)' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
