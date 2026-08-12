import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './constants.mjs';

export function loadEnvironment() {
  const envPath = join(REPO_ROOT, 'Frontend_Fintech/src/environments/environment.ts');
  const prodPath = join(REPO_ROOT, 'Frontend_Fintech/src/environments/environment.prod.ts');
  const env = { apiUrl: 'http://localhost:3000/api' };
  for (const p of [envPath, prodPath]) {
    try {
      const content = readFileSync(p, 'utf8');
      const m = content.match(/apiUrl:\s*['"]([^'"]+)['"]/);
      if (m) env.apiUrl = m[1];
    } catch { /* skip */ }
  }
  return env;
}
