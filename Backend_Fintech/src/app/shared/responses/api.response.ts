import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}

export function sendMessage(res: Response, message: string, statusCode = 200): void {
  res.status(statusCode).json({ success: true, message });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  errors?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
}
