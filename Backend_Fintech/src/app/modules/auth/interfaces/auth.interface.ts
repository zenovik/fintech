export interface IAuthService {
  login(dto: unknown, ctx: unknown): Promise<unknown>;
}

export interface IRequestContext {
  ipAddress?: string;
  userAgent?: string;
}
