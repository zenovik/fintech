import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './constants.mjs';

export function buildImportMap(parsedFiles) {
  const byFile = new Map();
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    const map = new Map();
    for (const imp of pf.imports) {
      for (const n of imp.names) {
        map.set(n.local, { imported: n.imported, from: imp.from, resolved: imp.resolved });
      }
    }
    byFile.set(pf.file, map);
  }
  return byFile;
}

export function buildConstantsIndex(parsedFiles) {
  const index = new Map();
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    for (const c of pf.constants ?? []) {
      index.set(`${pf.file}::${c.name}`, c);
      if (c.exported) index.set(c.name, c);
    }
  }
  return index;
}

export function buildClassIndex(parsedFiles) {
  const byName = new Map();
  const byFile = new Map();
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    byFile.set(pf.file, pf.classes ?? []);
    for (const cls of pf.classes ?? []) {
      if (!byName.has(cls.className)) byName.set(cls.className, []);
      byName.get(cls.className).push(cls);
    }
  }
  return { byName, byFile };
}

export function resolveUrlExpr(urlNode, ctx) {
  return resolveNode(urlNode, ctx);
}

function isThisExpression(node, tsMod) {
  return node?.kind === tsMod.SyntaxKind.ThisKeyword || (tsMod.isIdentifier(node) && node.text === 'this');
}

function resolveNode(node, ctx, depth = 0) {
  if (!node || depth > 12) return { pattern: null, confidence: 'NOT VERIFIED', parts: [] };
  const { ts, classInfo, constants, env } = ctx;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { pattern: normalizeApiPath(node.text), confidence: 'HIGH', parts: [node.text] };
  }

  if (ts.isTemplateExpression(node)) {
    let pattern = node.head.text;
    const parts = [node.head.text];
    for (const span of node.templateSpans) {
      const sub = resolveNode(span.expression, ctx, depth + 1);
      if (sub.pattern === null) {
        pattern += ':param';
        parts.push(':param');
      } else {
        pattern += sub.pattern;
        parts.push(sub.pattern);
      }
      pattern += span.literal.text;
      parts.push(span.literal.text);
    }
    return { pattern: normalizeApiPath(pattern), confidence: 'HIGH', parts };
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = resolveNode(node.left, ctx, depth + 1);
    const r = resolveNode(node.right, ctx, depth + 1);
    if (l.pattern !== null && r.pattern !== null) {
      return { pattern: normalizeApiPath(l.pattern + r.pattern), confidence: 'HIGH', parts: [...l.parts, ...r.parts] };
    }
    return { pattern: null, confidence: 'NOT VERIFIED', parts: [] };
  }

  if (ts.isPropertyAccessExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'environment') {
      const key = node.name.text;
      if (env[key]) return { pattern: env[key], confidence: 'HIGH', parts: [env[key]] };
    }
    if (isThisExpression(node.expression, ts)) {
      const prop = classInfo?.properties?.find((p) => p.name === node.name.text);
      if (prop?.resolvedValue) {
        return { pattern: normalizeApiPath(String(prop.resolvedValue)), confidence: 'HIGH', parts: [String(prop.resolvedValue)] };
      }
      if (prop?.literal && typeof prop.literal === 'string') {
        return { pattern: normalizeApiPath(prop.literal), confidence: 'HIGH', parts: [prop.literal] };
      }
    }
    if (ts.isIdentifier(node.expression)) {
      const constName = node.expression.text;
      const prop = node.name.text;
      const c = constants.get(constName);
      if (c?.props && c.props[prop] !== undefined) {
        const val = String(c.props[prop]);
        return { pattern: normalizeApiPath(val), confidence: 'HIGH', parts: [val] };
      }
    }
  }

  if (ts.isIdentifier(node)) {
    const prop = classInfo?.properties?.find((p) => p.name === node.text);
    if (prop?.resolvedValue) {
      return { pattern: normalizeApiPath(String(prop.resolvedValue)), confidence: 'HIGH', parts: [String(prop.resolvedValue)] };
    }
    const c = constants.get(node.text);
    if (c?.value !== undefined) {
      return { pattern: normalizeApiPath(String(c.value)), confidence: 'HIGH', parts: [String(c.value)] };
    }
    return { pattern: ':param', confidence: 'MEDIUM', parts: [':param'] };
  }

  return { pattern: null, confidence: 'NOT VERIFIED', parts: [] };
}

export function normalizeApiPath(raw) {
  if (!raw) return null;
  let p = String(raw).replace(/\\/g, '/');
  p = p.replace(/^https?:\/\/[^/]+/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+/g, '/');
  p = p.replace(/\$\{[^}]+\}/g, ':param');
  p = p.replace(/\/:param(?=:param)/g, '/:param');
  if (p.startsWith('/api/v1')) return p;
  if (p.startsWith('/api/auth')) return p;
  if (p.startsWith('/v1/')) return `/api${p}`;
  if (p.startsWith('/v1')) return `/api${p}`;
  if (p.startsWith('/auth/')) return `/api${p}`;
  if (p.startsWith('/auth')) return `/api${p}`;
  if (/^\/api\//.test(p)) return p;
  return p;
}

export function pathToRegex(pattern) {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\:param/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

export function matchEndpoint(resolvedPath, httpMethod, endpoints) {
  if (!resolvedPath) return null;
  const normalized = normalizeApiPath(resolvedPath);
  for (const ep of endpoints) {
    if (ep.method !== httpMethod) continue;
    if (ep.fullPath === normalized) return ep;
    const epRe = pathToRegex(ep.fullPath.replace(/:[\w]+/g, '[^/]+'));
    if (epRe.test(normalized)) return ep;
  }
  for (const ep of endpoints) {
    if (ep.method !== httpMethod) continue;
    const epParts = ep.fullPath.split('/');
    const normParts = normalized.split('/');
    if (epParts.length !== normParts.length) continue;
    let match = true;
    for (let i = 0; i < epParts.length; i++) {
      if (epParts[i].startsWith(':')) continue;
      if (epParts[i] !== normParts[i] && normParts[i] !== ':param') { match = false; break; }
    }
    if (match) return ep;
  }
  return null;
}

export function loadBackendEndpoints() {
  const p = join(REPO_ROOT, 'engineering-intelligence/output/json/express-endpoints.json');
  const data = JSON.parse(readFileSync(p, 'utf8'));
  return data.endpoints ?? [];
}

export function loadControllerMap(endpoints) {
  const map = new Map();
  for (const ep of endpoints) {
    const ctrl = ep.routeFile?.match(/modules\/([^/]+)\//)?.[1] ?? ep.module;
    map.set(`${ep.method}:${ep.fullPath}`, { controller: ctrl, module: ep.module, permissions: ep.permissions ?? [] });
  }
  return map;
}

export function loadRepositoryTables() {
  const p = join(REPO_ROOT, 'engineering-intelligence/output/json/sql-tables.json');
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    return data.tables ?? [];
  } catch {
    return [];
  }
}

export function findTablesForModule(module, tables) {
  return tables.filter((t) => t.module === module || t.references?.some((r) => r.includes(module))).map((t) => t.name);
}
