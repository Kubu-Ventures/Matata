import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const crisisLabels: Record<string, string> = {
  flood: 'Flood',
  earthquake: 'Earthquake',
  conflict: 'Conflict',
  wildfire: 'Wildfire',
  other: 'Other',
};

export const infraLabels: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  government: 'Government',
  utilities: 'Utilities',
  transport: 'Transport',
  community: 'Community',
};

export const severityLabels: Record<string, string> = {
  minimal: 'Minimal',
  partial: 'Partial',
  destroyed: 'Destroyed',
};

export const severityColors: Record<string, string> = {
  minimal: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  destroyed: 'bg-red-100 text-red-800',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  duplicate: 'bg-purple-100 text-purple-800',
  pending_merge_review: 'bg-yellow-100 text-yellow-800',
};

export const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};
