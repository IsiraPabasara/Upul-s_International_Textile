
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAdmin from '@/app/hooks/useAdmin';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAdmin();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // If authenticated, go to dashboard
        router.push('/dashboard');
      } else {
        // If not authenticated, go to login
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
