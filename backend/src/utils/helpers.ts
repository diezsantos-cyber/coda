export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parsePagination(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] ?? '20'), 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}
