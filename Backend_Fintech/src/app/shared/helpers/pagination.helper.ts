export interface PaginationInput {
  page?: number | string;
  pageSize?: number | string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export function normalizePagination(
  query: PaginationInput,
  options: { defaultPageSize?: number; maxPageSize?: number } = {},
): { page: number; pageSize: number; offset: number } {
  const defaultPageSize = options.defaultPageSize ?? 20;
  const maxPageSize = options.maxPageSize ?? 100;
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize) || defaultPageSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function paginateItems<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    items,
    pagination: buildPaginationMeta(page, pageSize, total),
  };
}
