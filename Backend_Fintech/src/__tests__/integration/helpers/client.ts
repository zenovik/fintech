export interface ApiBody<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: unknown;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: ApiBody<T>;
  headers: Headers;
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(response: Response): void {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
    for (const raw of setCookies) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) {
        this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  clear(): void {
    this.cookies.clear();
  }
}

export class ApiClient {
  private accessToken: string | null = null;
  private organizationId: number | null = null;
  private csrfToken: string | null = null;
  private readonly cookieJar = new CookieJar();
  private readonly clientIp: string;

  constructor(
    private readonly baseUrl: string,
    clientIp?: string,
  ) {
    this.clientIp = clientIp ?? `10.99.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setOrganizationId(orgId: number | null): void {
    this.organizationId = orgId;
  }

  clearSession(): void {
    this.accessToken = null;
    this.csrfToken = null;
    this.cookieJar.clear();
  }

  private async ensureCsrfToken(): Promise<string> {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Forwarded-For': this.clientIp,
    };
    const cookieHeader = this.cookieJar.header();
    if (cookieHeader) headers.Cookie = cookieHeader;

    const response = await fetch(`${this.baseUrl}/api/auth/csrf-token`, { method: 'GET', headers });
    this.cookieJar.absorb(response);
    const parsed = (await response.json()) as ApiBody<{ csrfToken: string }>;
    if (!parsed.data?.csrfToken) {
      throw new Error('Failed to obtain CSRF token');
    }
    this.csrfToken = parsed.data.csrfToken;
    return this.csrfToken;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      orgId?: number | null;
    } = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Forwarded-For': this.clientIp,
      ...options.headers,
    };

    const orgId = options.orgId !== undefined ? options.orgId : this.organizationId;
    if (orgId != null) headers['X-Organization-Id'] = String(orgId);

    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    if (mutating && !this.accessToken && !path.includes('/auth/csrf-token')) {
      headers['X-CSRF-Token'] = await this.ensureCsrfToken();
    }

    const cookieHeader = this.cookieJar.header();
    if (cookieHeader) headers.Cookie = cookieHeader;

    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    let body: string | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, { method, headers, body });
    this.cookieJar.absorb(response);

    let parsed: ApiBody<T> = { success: response.ok };
    const text = await response.text();
    if (text) {
      try {
        parsed = JSON.parse(text) as ApiBody<T>;
      } catch {
        parsed = { success: false, message: text };
      }
    }
    return { status: response.status, body: parsed, headers: response.headers };
  }

  get<T = unknown>(path: string, orgId?: number | null): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, { orgId });
  }

  post<T = unknown>(path: string, body?: unknown, orgId?: number | null): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, { body, orgId });
  }

  put<T = unknown>(path: string, body?: unknown, orgId?: number | null): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, { body, orgId });
  }

  patch<T = unknown>(path: string, body?: unknown, orgId?: number | null): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, { body, orgId });
  }

  delete<T = unknown>(path: string, orgId?: number | null): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, { orgId });
  }
}

export function createClient(baseUrl: string): ApiClient {
  return new ApiClient(baseUrl);
}
