import { readFileSync } from 'node:fs';
import path from 'node:path';
import { env } from './env';

let cachedPackageVersion: string | null = null;

function readPackageVersion(): string {
  if (cachedPackageVersion) return cachedPackageVersion;
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    cachedPackageVersion = pkg.version ?? '0.0.0';
  } catch {
    cachedPackageVersion = '0.0.0';
  }
  return cachedPackageVersion;
}

export const appMeta = {
  version: env.app.version || readPackageVersion(),
  build: env.app.build,
  commit: env.app.commit,
  environment: env.nodeEnv,
};
