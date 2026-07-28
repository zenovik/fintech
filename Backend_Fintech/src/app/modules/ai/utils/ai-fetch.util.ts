import { env } from '../../../config';
import { AppError } from '../../../shared/exceptions/app.exception';
import { AI_ERROR_CODES } from '../constants/ai.constants';
import { mapAiRuntimeError, mapProviderHttpError } from './ai-error.util';

export async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    throw mapAiRuntimeError(error);
  } finally {
    clearTimeout(timeout);
  }
}

export async function parseProviderJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new AppError(
      502,
      'AI provider returned an invalid response.',
      AI_ERROR_CODES.AI_PROVIDER_ERROR,
    );
  }
}

export function assertProviderOk(response: Response, rawMessage?: string): void {
  if (response.ok) return;
  throw mapProviderHttpError(response.status, rawMessage);
}
