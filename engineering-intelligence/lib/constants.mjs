import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EIP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(EIP_ROOT, '..');
export const GENERATOR_VERSION = '3.0.0-a';

export const EXCLUDE_DIR = /(?:^|[\\/])(node_modules|dist|coverage|\.angular|playwright-report|test-results|\.git)(?:[\\/]|$)/;

export const LANG_MAP = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.sql': 'sql',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.html': 'html',
  '.scss': 'scss',
  '.css': 'css',
  '.ps1': 'powershell',
  '.sh': 'shell',
  '.dockerfile': 'dockerfile',
};

export function outputDir(name) {
  return join(EIP_ROOT, 'output', name);
}

export function dashboardDir() {
  return join(REPO_ROOT, 'dashboard');
}
