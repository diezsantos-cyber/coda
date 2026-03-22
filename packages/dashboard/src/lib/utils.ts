import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-700';
    case 'OPEN':
      return 'bg-blue-100 text-blue-700';
    case 'IN_REVIEW':
      return 'bg-yellow-100 text-yellow-700';
    case 'DECIDED':
      return 'bg-green-100 text-green-700';
    case 'ARCHIVED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'STRATEGIC':
      return 'bg-purple-100 text-purple-700';
    case 'OPERATIONAL':
      return 'bg-blue-100 text-blue-700';
    case 'TACTICAL':
      return 'bg-orange-100 text-orange-700';
    case 'TECHNICAL':
      return 'bg-cyan-100 text-cyan-700';
    case 'FINANCIAL':
      return 'bg-green-100 text-green-700';
    case 'HR':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'OWNER':
      return 'bg-purple-100 text-purple-700';
    case 'ADMIN':
      return 'bg-blue-100 text-blue-700';
    case 'MEMBER':
      return 'bg-green-100 text-green-700';
    case 'VIEWER':
      return 'bg-gray-100 text-gray-700';
    case 'DECISION_MAKER':
      return 'bg-red-100 text-red-700';
    case 'CONTRIBUTOR':
      return 'bg-orange-100 text-orange-700';
    case 'REVIEWER':
      return 'bg-yellow-100 text-yellow-700';
    case 'OBSERVER':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
