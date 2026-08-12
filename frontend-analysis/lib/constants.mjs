import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

export const FA_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(FA_ROOT, '..');
export const FRONTEND_SRC = join(REPO_ROOT, 'Frontend_Fintech', 'src');
export const GENERATOR_VERSION = '2.0.0-ast';

export const EXCLUDE_DIR =
  /(?:^|[\\/])(node_modules|dist|coverage|\.angular|playwright-report|test-results|\.git)(?:[\\/]|$)/;

export function out(...parts) {
  const p = join(FA_ROOT, 'output', ...parts);
  mkdirSync(p, { recursive: true });
  return p;
}
