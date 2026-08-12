import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO_ROOT } from './constants.mjs';
import { walkFiles } from './walk.mjs';
import { analyzeTsFile } from './ts-ast.mjs';

export function analyzeAngular() {
  const feRoot = join(REPO_ROOT, 'Frontend_Fintech', 'src');
  const files = walkFiles(feRoot).filter((f) => f.endsWith('.ts'));
  const components = [];
  const services = [];
  const guards = [];
  const interceptors = [];
  const routes = [];
  const pipes = [];
  const directives = [];

  for (const f of files) {
    const rel = relative(REPO_ROOT, f).replace(/\\/g, '/');
    const content = readFileSync(f, 'utf8');
    if (f.endsWith('.component.ts')) {
      const selector = content.match(/selector:\s*['"]([^'"]+)['"]/)?.[1] || 'NOT VERIFIED';
      const standalone = /standalone:\s*true/.test(content);
      const inputs = [...content.matchAll(/@Input\(\)\s+(\w+)|input\(\s*['"]?(\w+)['"]?\s*\)/g)].map((m) => m[1] || m[2]).filter(Boolean);
      const outputs = [...content.matchAll(/@Output\(\)\s+(\w+)|output\(\s*['"]?(\w+)['"]?\s*\)/g)].map((m) => m[1] || m[2]).filter(Boolean);
      const injected = [...content.matchAll(/(?:inject|constructor\s*\([^)]*)\(\s*(\w+Service|\w+ApiService)/g)].map((m) => m[1]);
      const apiCalls = [...content.matchAll(/this\.\w+\.(get|post|put|patch|delete)\s*[<(]\s*['"`]([^'"`]+)['"`]/g)].map((m) => ({ method: m[1].toUpperCase(), url: m[2] }));
      const httpCalls = [...content.matchAll(/['"`](\/api[^'"`]+)['"`]/g)].map((m) => m[1]);
      components.push({
        path: rel,
        selector,
        standalone,
        inputs,
        outputs,
        injectedServices: [...new Set(injected)],
        apiPaths: [...new Set([...apiCalls.map((a) => a.url), ...httpCalls])],
        permissions: [...content.matchAll(/permission[s]?:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
        sourceEvidence: rel,
      });
    }
    if (f.endsWith('.service.ts')) {
      const apiCalls = [...content.matchAll(/\.(get|post|put|patch|delete)\s*[<(]\s*[`'"]([^`'"]+)[`'"]/g)].map((m) => ({
        method: m[1].toUpperCase(),
        url: m[2],
      }));
      services.push({
        path: rel,
        apiCalls,
        sourceEvidence: rel,
      });
    }
    if (f.endsWith('.guard.ts')) {
      guards.push({ path: rel, sourceEvidence: rel });
    }
    if (f.endsWith('.interceptor.ts')) {
      interceptors.push({ path: rel, sourceEvidence: rel });
    }
    if (f.endsWith('.routes.ts')) {
      const lazy = [...content.matchAll(/loadComponent:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      const loadChildren = [...content.matchAll(/loadChildren:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      const paths = [...content.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
      routes.push({ path: rel, paths, lazyComponents: lazy, loadChildren, sourceEvidence: rel });
    }
    if (f.endsWith('.pipe.ts')) pipes.push({ path: rel });
    if (f.endsWith('.directive.ts')) directives.push({ path: rel });
  }

  const appRoutesPath = join(feRoot, 'app', 'routing', 'app.routes.ts');
  const appRoutes = readFileSync(appRoutesPath, 'utf8');
  const topRoutes = [...appRoutes.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);

  return {
    components,
    services,
    guards,
    interceptors,
    routes,
    pipes,
    directives,
    topLevelRoutes: topRoutes,
    appRoutesFile: relative(REPO_ROOT, appRoutesPath).replace(/\\/g, '/'),
  };
}

export function analyzeBackendArtifacts(tsFiles) {
  const controllers = [];
  const services = [];
  const repositories = [];
  const middlewares = [];
  const dtos = [];

  for (const f of tsFiles) {
    const rel = relative(REPO_ROOT, f).replace(/\\/g, '/');
    if (!rel.startsWith('Backend_Fintech/')) continue;
    if (f.endsWith('.controller.ts')) controllers.push({ path: rel });
    if (f.endsWith('.service.ts')) services.push({ path: rel });
    if (f.endsWith('.repository.ts')) repositories.push({ path: rel });
    if (f.includes('middleware') && f.endsWith('.ts')) middlewares.push({ path: rel });
    if (f.includes('/dto/') && f.endsWith('.ts')) dtos.push({ path: rel });
  }
  return { controllers, services, repositories, middlewares, dtos };
}
