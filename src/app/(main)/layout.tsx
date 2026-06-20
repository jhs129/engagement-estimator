'use client';

import { SessionProvider } from 'next-auth/react';
import { AppNav } from '@/components/AppNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppNav />
      {children}
    </SessionProvider>
  );
}
