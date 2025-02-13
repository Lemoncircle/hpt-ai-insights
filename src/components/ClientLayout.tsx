'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add debug logging
  useEffect(() => {
    console.log('ClientLayout mounted');
    return () => console.log('ClientLayout unmounted');
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
} 