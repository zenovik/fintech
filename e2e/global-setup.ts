import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export default async function globalSetup(): Promise<void> {
  await mkdir(path.join(process.cwd(), 'playwright-report'), { recursive: true });
  await mkdir(path.join(process.cwd(), 'test-results'), { recursive: true });
  await mkdir(path.join(process.cwd(), 'e2e', '.auth'), { recursive: true });
}
