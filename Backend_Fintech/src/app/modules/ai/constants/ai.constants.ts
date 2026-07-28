export const AI_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AI_UNSAFE_PROMPT: 'AI_UNSAFE_PROMPT',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_INVALID_API_KEY: 'AI_INVALID_API_KEY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(everything|all)\s+(you\s+)?(know|were\s+told)/i,
  /you\s+are\s+now\s+(a|an|in)\s+/i,
  /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?|rules?)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?(prompt|instructions?)/i,
  /print\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?)/i,
  /output\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
  /repeat\s+(the\s+)?(system\s+)?(prompt|instructions?)/i,
  /process\.env/i,
  /environment\s+variables?/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /\b(AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,})\b/,
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\s+.+\b(FROM|INTO|TABLE|DATABASE)\b/i,
  /(?:\/|\\)(?:etc|usr|var|windows|users|home|node_modules)(?:\/|\\)/i,
  /[A-Z]:\\(?:Users|Program Files|Windows)/i,
];

export const SENSITIVE_RESPONSE_PATTERNS: RegExp[] = [
  /\b(AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,})\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  /process\.env\.[A-Z0-9_]+/gi,
  /(?:\/|\\)(?:etc|usr|var|windows|users|home|node_modules)(?:\/|\\)[^\s]*/gi,
  /[A-Z]:\\[^\s]+/g,
  /\bat\s+[\w./\\-]+:\d+:\d+\b/g,
  /Error:\s*.+\n\s+at\s+/g,
];
