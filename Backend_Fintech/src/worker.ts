import 'dotenv/config';
import { validateProductionEnv } from './app/config/validate-env';
import { logger } from './app/shared/logger';
import { startWorkerLoop, shutdownWorker, requestWorkerShutdown } from './app/shared/workers/worker-runner';
import { startRedisRecoveryLoop } from './app/shared/infrastructure/redis.client';

validateProductionEnv();
startRedisRecoveryLoop();

const SHUTDOWN_TIMEOUT_MS = 15_000;
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Worker shutdown initiated', { signal });
  requestWorkerShutdown();

  const timer = setTimeout(() => {
    logger.error('Worker forced shutdown after timeout', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timer.unref();

  try {
    await shutdownWorker();
    clearTimeout(timer);
    logger.info('Worker shutdown complete', { signal });
    process.exit(0);
  } catch (err) {
    logger.error('Worker shutdown failed', { message: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });

void startWorkerLoop().catch((err) => {
  logger.error('Worker fatal error', { message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
