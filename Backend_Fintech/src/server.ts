import 'dotenv/config';
import { createApp } from './app/app';
import { env } from './app/config';
import { validateProductionEnv } from './app/config/validate-env';
import { closePool } from './app/database';
import { closeRedis, startRedisRecoveryLoop } from './app/shared/infrastructure/redis.client';
import { logger } from './app/shared/logger';

validateProductionEnv();
startRedisRecoveryLoop();

const app = createApp();
const server = app.listen(env.port, () => {
  logger.info('Server started', {
    environment: env.nodeEnv,
    port: env.port,
    logLevel: env.logLevel,
  });

  if (typeof process.send === 'function') {
    process.send('ready');
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  logger.error('Server failed to start', {
    message: error.message,
    code: error.code,
    port: env.port,
  });
  process.exit(1);
});

const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;
let forceShutdownTimer: NodeJS.Timeout | undefined;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info('Graceful shutdown initiated', { signal });

  forceShutdownTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceShutdownTimer.unref();

  await new Promise<void>((resolve) => {
    server.close((error) => {
      if (error) {
        logger.error('HTTP server close failed', { message: error.message, signal });
      }
      resolve();
    });
  });

  try {
    await closePool();
    await closeRedis();
    if (forceShutdownTimer) {
      clearTimeout(forceShutdownTimer);
    }
    logger.info('Graceful shutdown complete', { signal });
    process.exit(0);
  } catch (error) {
    logger.error('Graceful shutdown failed', {
      signal,
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('message', (message) => {
  if (message === 'shutdown') {
    void shutdown('PM2_SHUTDOWN');
  }
});
