import { PaginationParams, PaginatedResponse } from '../types';

export function parsePagination(
  query: Record<string, unknown>,
): PaginationParams {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(query['limit'] ?? '20'), 10) || 20),
  );
  return { page, limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
