export const AI_API = {
  CHAT: '/ai/chat',
} as const;

export const AI_MAX_PROMPT_LENGTH = 4000;
export const AI_REQUEST_TIMEOUT_MS = 35000;

export const AI_FRIENDLY_ERRORS: Record<string, string> = {
  AI_RATE_LIMITED: 'The AI Assistant quota has been reached. Please try again in a few minutes.',
  AI_TIMEOUT: 'The assistant took too long to respond. Please try again.',
  AI_PROVIDER_UNAVAILABLE: 'AI Assistant is currently unavailable. Please contact your administrator.',
  AI_PROVIDER_ERROR: 'The assistant could not complete your request. Please try again.',
  AI_INVALID_API_KEY: 'Unable to connect to Gemini AI. Please verify your configuration.',
  AI_UNSAFE_PROMPT: 'Your message could not be processed for security reasons.',
  VALIDATION_ERROR: 'Please check your message and try again.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

export function resolveAiErrorMessage(error: { error?: { code?: string; message?: string }; message?: string }): string {
  const code = error?.error?.code;
  if (code && AI_FRIENDLY_ERRORS[code]) return AI_FRIENDLY_ERRORS[code];
  const raw = error?.error?.message ?? error?.message;
  if (raw && looksLikeProviderError(raw)) {
    return AI_FRIENDLY_ERRORS['AI_RATE_LIMITED'];
  }
  if (raw && !looksSensitive(raw)) return raw;
  return AI_FRIENDLY_ERRORS['INTERNAL_ERROR'];
}

function looksLikeProviderError(message: string): boolean {
  return /generativelanguage|models\/gemini|googleapis|quota|resource exhausted|too many requests|rate limit/i.test(message);
}

function looksSensitive(message: string): boolean {
  return /api[_-]?key|eyJ[A-Za-z0-9_-]{10,}|process\.env|node_modules|\/(?:src|app)\//i.test(message);
}
