export const USER_ROUTES = { LIST: '/users', CREATE: '/users/create', DETAIL: (id: number | string) => `/users/${id}`, EDIT: (id: number | string) => `/users/${id}/edit` } as const;
export const USER_STATUSES = ['active', 'locked', 'pending', 'inactive'] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
export type UserPageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
