'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1">
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </AuthGuard>
  );
}
