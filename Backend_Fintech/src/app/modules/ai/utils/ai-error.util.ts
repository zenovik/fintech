import { AppError } from '../../../shared/exceptions/app.exception';
import { AI_ERROR_CODES } from '../constants/ai.constants';

const SENSITIVE_ERROR_PATTERNS = [
  /\b(AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,})\b/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /process\.env/i,
  /node_modules/i,
  /\/(?:src|app|Backend_Fintech|Frontend_Fintech)\//i,
  /[A-Z]:\\Users\\/i,
  /\bat\s+[\w./\\-]+:\d+:\d+/i,
];

function containsSensitiveDetails(message: string): boolean {
  return SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function sanitizeMessage(message: string): string {
  if (containsSensitiveDetails(message)) {
    return 'An unexpected AI provider error occurred.';
  }
  if (/generativelanguage|models\/gemini|googleapis|quota|resource exhausted|too many requests/i.test(message)) {
    return 'The AI Assistant quota has been reached. Please try again in a few minutes.';
  }
  return message.slice(0, 200);
}

export function mapProviderHttpError(status: number, rawMessage?: string): AppError {
  const message = rawMessage ? sanitizeMessage(rawMessage) : 'AI provider request failed';
  const invalidKeyHint = /api.?key|invalid|permission|unauthorized|authentication/i.test(message);

  if (status === 401 || status === 403 || (status === 400 && invalidKeyHint) || (status === 404 && /model/i.test(message))) {
    return new AppError(
      503,
      'Unable to connect to Gemini AI. Please verify your configuration.',
      AI_ERROR_CODES.AI_INVALID_API_KEY,
    );
  }

  if (status === 429) {
    return new AppError(
      429,
      'The AI Assistant quota has been reached. Please try again in a few minutes.',
      AI_ERROR_CODES.AI_RATE_LIMITED,
    );
  }

  if (status >= 500) {
    return new AppError(
      503,
      'AI Assistant is currently unavailable. Please contact your administrator.',
      AI_ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
    );
  }

  return new AppError(502, message, AI_ERROR_CODES.AI_PROVIDER_ERROR);
}

export function mapAiRuntimeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new AppError(
        504,
        'AI request timed out. Please try again.',
        AI_ERROR_CODES.AI_TIMEOUT,
      );
    }

    if (containsSensitiveDetails(error.message)) {
      return new AppError(
        500,
        'An unexpected error occurred while processing your request.',
        AI_ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  return new AppError(
    500,
    'An unexpected error occurred while processing your request.',
    AI_ERROR_CODES.INTERNAL_ERROR,
  );
}
