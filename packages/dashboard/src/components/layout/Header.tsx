'use client';

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps): React.JSX.Element {
  const { isConnected } = useWebSocket();

  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {actions}
        </div>
      </div>
    </header>
  );
}
