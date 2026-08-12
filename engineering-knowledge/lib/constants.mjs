import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

export const EKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(EKG_ROOT, '..');
export const EI_ROOT = join(REPO_ROOT, 'engineering-intelligence');
export const GENERATOR_VERSION = '3.0.0-b';

export const EXCLUDE_DIR = /(?:^|[\\/])(node_modules|dist|coverage|\.angular|playwright-report|test-results|\.git|engineering-intelligence[\\/]output|engineering-knowledge[\\/])(?:[\\/]|$)/;

export function out(...parts) {
  const p = join(EKG_ROOT, ...parts);
  mkdirSync(p, { recursive: true });
  return p;
}

export function portalDir() {
  return join(REPO_ROOT, 'knowledge-portal');
}

let _seq = 0;
export function uid(type, key) {
  _seq++;
  const safe = String(key).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return `${type}:${safe}:${_seq}`;
}

export function resetUidSeq() {
  _seq = 0;
}
