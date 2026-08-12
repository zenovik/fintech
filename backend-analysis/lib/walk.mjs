import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BACKEND_SRC, EXCLUDE_DIR } from './constants.mjs';

export function walkBackend(root = BACKEND_SRC) {
  const files = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (EXCLUDE_DIR.test(p)) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.spec.ts') && !e.name.endsWith('.test.ts')) {
        files.push(p);
      }
    }
  }
  walk(root);
  return files;
}
