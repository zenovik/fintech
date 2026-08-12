import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

export const BA_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(BA_ROOT, '..');
export const BACKEND_SRC = join(REPO_ROOT, 'Backend_Fintech', 'src');
export const GENERATOR_VERSION = '2.0.0-ast';

export const EXCLUDE_DIR =
  /(?:^|[\\/])(node_modules|dist|coverage|\.git|engineering-intelligence[\\/]output|frontend-analysis[\\/]output|backend-analysis[\\/]output)(?:[\\/]|$)/;

export function out(...parts) {
  const p = join(BA_ROOT, 'output', ...parts);
  mkdirSync(p, { recursive: true });
  return p;
}
