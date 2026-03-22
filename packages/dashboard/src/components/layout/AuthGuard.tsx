'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/services/auth.service';

export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      if (!authService.isAuthenticated()) {
        setUser(null);
        router.push('/login');
        return;
      }

      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        setUser(null);
        router.push('/login');
      }
    }

    void checkAuth();
  }, [router, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
}
