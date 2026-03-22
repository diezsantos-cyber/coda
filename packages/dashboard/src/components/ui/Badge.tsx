'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Badge({
  children,
  className,
  variant = 'default',
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'badge',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
