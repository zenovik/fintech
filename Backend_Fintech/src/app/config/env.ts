function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: requireEnv('NODE_ENV', 'development'),
  port: parseInt(requireEnv('PORT', '3000'), 10),
  corsOrigin: requireEnv('CORS_ORIGIN', 'http://localhost:4200'),
  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '3306'), 10),
    name: requireEnv('DB_NAME', 'fintech_db'),
    user: requireEnv('DB_USER', 'fintech_user'),
    password: requireEnv('DB_PASSWORD'),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: requireEnv('JWT_EXPIRES_IN', '15m'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    refreshExpiresIn: requireEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  logLevel: requireEnv('LOG_LEVEL', process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  app: {
    version: process.env.APP_VERSION ?? '',
    build: requireEnv('APP_BUILD', 'local'),
    commit: requireEnv('APP_COMMIT', 'unknown'),
  },
  auth: {
    sessionIdleMinutes: parseInt(requireEnv('SESSION_IDLE_MINUTES', '15'), 10),
    trustDeviceDays: parseInt(requireEnv('TRUST_DEVICE_DAYS', '30'), 10),
    otpExpiryMinutes: parseInt(requireEnv('OTP_EXPIRY_MINUTES', '10'), 10),
    otpResendCooldownSeconds: parseInt(requireEnv('OTP_RESEND_COOLDOWN_SECONDS', '59'), 10),
    resetTokenExpiryMinutes: parseInt(requireEnv('RESET_TOKEN_EXPIRY_MINUTES', '60'), 10),
    maxLoginAttempts: parseInt(requireEnv('MAX_LOGIN_ATTEMPTS', '5'), 10),
    lockDurationMinutes: parseInt(requireEnv('LOCK_DURATION_MINUTES', '30'), 10),
    bcryptRounds: parseInt(requireEnv('BCRYPT_ROUNDS', '12'), 10),
    refreshTokenCookieName: requireEnv('REFRESH_TOKEN_COOKIE_NAME', 'refreshToken'),
    accessTokenCookieName: requireEnv('ACCESS_TOKEN_COOKIE_NAME', 'accessToken'),
  },
  security: {
    cspEnabled: (process.env.CSP_ENABLED ?? 'true').toLowerCase() !== 'false',
    cspDevMode: requireEnv('CSP_DEV_MODE', 'relaxed'),
    cspConnectSrcExtra: process.env.CSP_CONNECT_SRC_EXTRA ?? '',
    cspReportUri: process.env.CSP_REPORT_URI ?? '',
  },
  ai: {
    provider: requireEnv('AI_PROVIDER', 'gemini').toLowerCase() as 'gemini' | 'openai' | 'groq',
    timeoutMs: parseInt(requireEnv('AI_TIMEOUT_MS', '30000'), 10),
    maxOutputTokens: parseInt(requireEnv('AI_MAX_OUTPUT_TOKENS', '1024'), 10),
    temperature: parseFloat(requireEnv('AI_TEMPERATURE', '0.7')),
    topP: parseFloat(requireEnv('AI_TOP_P', '0.95')),
    maxPromptLength: parseInt(requireEnv('AI_MAX_PROMPT_LENGTH', '4000'), 10),
    rateLimitPerMinute: parseInt(requireEnv('AI_RATE_LIMIT_PER_MINUTE', '20'), 10),
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? '',
      model: requireEnv('GEMINI_MODEL', 'gemini-flash-latest'),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? '',
      model: requireEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: requireEnv('GROQ_MODEL', 'llama-3.3-70b-versatile'),
    },
  },
  redis: {
    enabled: (process.env.REDIS_ENABLED ?? 'true').toLowerCase() !== 'false',
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  gateway: {
    provider: process.env.PAYMENT_GATEWAY_PROVIDER ?? 'internal',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
  observability: {
    tracingEnabled: (process.env.OTEL_TRACING_ENABLED ?? 'true').toLowerCase() !== 'false',
    metricsEnabled: (process.env.PROMETHEUS_METRICS_ENABLED ?? 'true').toLowerCase() !== 'false',
  },
  secrets: {
    configEncryptionKey: requireEnv('CONFIG_ENCRYPTION_KEY', process.env.JWT_SECRET ?? 'dev-config-encryption-key-change-me'),
  },
  worker: {
    pollIntervalMs: parseInt(requireEnv('WORKER_POLL_INTERVAL_MS', '3000'), 10),
    concurrency: parseInt(requireEnv('WORKER_CONCURRENCY', '5'), 10),
    batchSize: parseInt(requireEnv('WORKER_BATCH_SIZE', '10'), 10),
    lockTtlSeconds: parseInt(requireEnv('WORKER_LOCK_TTL_SECONDS', '120'), 10),
    webhookTimeoutMs: parseInt(requireEnv('WEBHOOK_TIMEOUT_MS', '15000'), 10),
    webhookRetryBaseSeconds: parseInt(requireEnv('WEBHOOK_RETRY_BASE_SECONDS', '30'), 10),
    webhookRetryMaxSeconds: parseInt(requireEnv('WEBHOOK_RETRY_MAX_SECONDS', '3600'), 10),
  },
} as const;
