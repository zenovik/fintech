import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { REPO_ROOT, EXCLUDE_DIR, LANG_MAP } from './constants.mjs';

export function walkFiles(root = REPO_ROOT) {
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
      else if (e.isFile()) files.push(p);
    }
  }
  walk(root);
  return files;
}

export function catalogFile(absPath) {
  const rel = relative(REPO_ROOT, absPath).replace(/\\/g, '/');
  const ext = extname(absPath).toLowerCase();
  const buf = readFileSync(absPath);
  const st = statSync(absPath);
  const hash = createHash('sha256').update(buf).digest('hex');
  const content = buf.toString('utf8');
  const imports = [...content.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const exports = [...content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|interface|type|enum)\s+(\w+)/g)].map((m) => m[1]);
  let ownerModule = 'root';
  if (rel.includes('Backend_Fintech/src/app/modules/')) {
    ownerModule = rel.split('modules/')[1]?.split('/')[0] ?? 'backend';
  } else if (rel.includes('Frontend_Fintech/src/app/features/')) {
    ownerModule = rel.split('features/')[1]?.split('/')[0] ?? 'frontend';
  } else if (rel.startsWith('Database_Fintech/')) ownerModule = 'database';
  else if (rel.startsWith('e2e/')) ownerModule = 'e2e';
  else if (rel.startsWith('docs/')) ownerModule = 'docs';

  const generated = /master_database\.sql|dist\/|playwright-report|\.angular/.test(rel) ||
    rel.includes('engineering-intelligence/output/');

  return {
    path: rel,
    type: ext.slice(1) || 'unknown',
    language: LANG_MAP[ext] || 'other',
    size: st.size,
    hash,
    imports: [...new Set(imports)],
    exports: [...new Set(exports)],
    ownerModule,
    lastModified: st.mtime.toISOString(),
    generated: generated ? 'generated' : 'manual',
  };
}
