import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO_ROOT } from './constants.mjs';

export function analyzePermissions() {
  const permPath = join(REPO_ROOT, 'Backend_Fintech', 'src', 'app', 'shared', 'rbac', 'permissions.ts');
  const content = readFileSync(permPath, 'utf8');
  const permissions = [...content.matchAll(/['"]([a-z_]+:[a-z_]+)['"]/g)].map((m) => m[1]);
  return { file: relative(REPO_ROOT, permPath).replace(/\\/g, '/'), permissions, count: permissions.length };
}

export function analyzeWorkers() {
  const handlers = join(REPO_ROOT, 'Backend_Fintech', 'src', 'app', 'shared', 'workers', 'job-handlers.ts');
  const runner = join(REPO_ROOT, 'Backend_Fintech', 'src', 'app', 'shared', 'workers', 'worker-runner.ts');
  const hc = join(REPO_ROOT, 'Backend_Fintech', 'src', 'app', 'shared', 'workers', 'worker-runner.ts');
  const hContent = readFileSync(handlers, 'utf8');
  const rContent = readFileSync(runner, 'utf8');
  const jobTypes = [...hContent.matchAll(/case\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const queues = [...rContent.matchAll(/FROM\s+(\w+)|INTO\s+(\w+)|UPDATE\s+(\w+)/gi)].map((m) => m[1] || m[2] || m[3]).filter(Boolean);
  const redisLocks = [...rContent.matchAll(/acquireLock\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return {
    jobTypes: [...new Set(jobTypes)],
    queueTables: [...new Set(queues)],
    redisLockPatterns: [...new Set(redisLocks)],
    heartbeat: rContent.includes('worker:heartbeat') ? 'worker:heartbeat' : 'NOT VERIFIED',
    sources: [
      relative(REPO_ROOT, handlers).replace(/\\/g, '/'),
      relative(REPO_ROOT, runner).replace(/\\/g, '/'),
    ],
  };
}

export function detectCircularImports(catalog) {
  const graph = {};
  for (const f of catalog) {
    if (!f.path.match(/\.(ts|tsx|js|mjs)$/)) continue;
    graph[f.path] = f.imports
      .filter((i) => i.startsWith('.') || i.startsWith('@'))
      .map((i) => i);
  }
  const cycles = [];
  // simplified: report self-imports and duplicate pairs only
  for (const [file, imps] of Object.entries(graph)) {
    for (const imp of imps) {
      if (imp.includes(file.replace(/\.ts$/, ''))) cycles.push({ file, import: imp, type: 'self-reference-suspect' });
    }
  }
  return cycles;
}

export function staticAnalysis(catalog, endpoints, angular, permissions, tableUsage) {
  const findings = [];
  const tsPaths = new Set(catalog.filter((f) => f.path.endsWith('.ts')).map((f) => f.path));
  const exportedSymbols = new Map();
  const importUsage = new Map();

  for (const f of catalog) {
    if (!f.path.endsWith('.ts')) continue;
    for (const ex of f.exports) {
      exportedSymbols.set(`${f.path}:${ex}`, f.path);
    }
  }

  // Empty frontend dirs
  const emptyDirs = ['Frontend_Fintech/src/app/features/merchants', 'Frontend_Fintech/src/app/layouts'];
  for (const d of emptyDirs) {
    const hasFiles = catalog.some((f) => f.path.startsWith(d + '/'));
    if (!hasFiles) findings.push({ type: 'empty-directory', path: d, confidence: 'high', evidence: 'catalog scan' });
  }

  // Backend modules without FE feature
  const beModules = new Set(endpoints.map((e) => e.module));
  const feFeatures = new Set(catalog.filter((f) => f.path.includes('Frontend_Fintech/src/app/features/')).map((f) => f.path.split('features/')[1]?.split('/')[0]).filter(Boolean));
  for (const mod of ['accounting', 'pricing']) {
    if ([...beModules].some((m) => m === mod) && !feFeatures.has(mod)) {
      findings.push({ type: 'backend-without-frontend', module: mod, confidence: 'high', evidence: 'module name comparison' });
    }
  }

  // Tables never referenced in repos
  let unusedTables = 0;
  for (const [table, usage] of Object.entries(tableUsage)) {
    const total = usage.repositories.length + usage.services.length + usage.workers.length;
    if (total === 0) {
      unusedTables++;
      if (unusedTables <= 50) findings.push({ type: 'table-no-code-reference', table, confidence: 'medium', evidence: 'grep repos/services/workers' });
    }
  }

  // Permissions used in routes
  const usedPerms = new Set();
  for (const e of endpoints) for (const p of e.permissions) usedPerms.add(p);
  const unusedPerms = permissions.permissions.filter((p) => {
    const code = `'${p}'`;
    return !usedPerms.has(code) && !endpoints.some((e) => e.permissions.some((x) => x.includes(p)));
  });

  for (const p of unusedPerms.slice(0, 30)) {
    findings.push({ type: 'permission-not-in-routes-grep', permission: p, confidence: 'medium', evidence: 'authorize() grep' });
  }

  // Complexity heuristic: large files
  for (const f of catalog) {
    if (f.size > 50000 && f.path.endsWith('.ts')) {
      findings.push({ type: 'large-file', path: f.path, size: f.size, confidence: 'high', evidence: 'file size' });
    }
  }

  return { findings, unusedTables, unusedPermissionsInRoutes: unusedPerms.length, circularImports: detectCircularImports(catalog) };
}

export function computeComplexity(tsAnalysis) {
  const report = [];
  for (const item of tsAnalysis) {
    const methodCount = item.methods?.length ?? 0;
    const classCount = item.classes?.length ?? 0;
    const complexity = methodCount + classCount * 2;
    if (complexity > 20) {
      report.push({ path: item.path, complexity, methodCount, classCount, evidence: 'AST method/class count' });
    }
  }
  return report.sort((a, b) => b.complexity - a.complexity).slice(0, 100);
}
