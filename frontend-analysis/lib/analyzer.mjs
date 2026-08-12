import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './constants.mjs';
import { ts, createSourceFile } from './ts.mjs';
import { loadEnvironment } from './env.mjs';
import {
  buildImportMap,
  buildConstantsIndex,
  buildClassIndex,
  resolveUrlExpr,
  matchEndpoint,
  loadBackendEndpoints,
  loadControllerMap,
  normalizeApiPath,
} from './resolver.mjs';

export function analyze(parsedFiles) {
  const importMap = buildImportMap(parsedFiles);
  const constants = buildConstantsIndex(parsedFiles);
  const { byName: classByName, byFile } = buildClassIndex(parsedFiles);
  const env = loadEnvironment();
  const endpoints = loadBackendEndpoints();
  const controllerMap = loadControllerMap(endpoints);

  const allClasses = [];
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    for (const cls of pf.classes ?? []) allClasses.push(cls);
  }

  const components = allClasses.filter((c) => c.kind === 'Component');
  const services = allClasses.filter((c) => c.kind === 'Service');
  const directives = allClasses.filter((c) => c.kind === 'Directive');
  const pipes = allClasses.filter((c) => c.kind === 'Pipe');

  const injectionGraph = buildInjectionGraph(allClasses);
  const httpCalls = collectHttpCalls(allClasses, constants, env, endpoints);
  const serviceCallGraph = collectServiceCalls(allClasses, injectionGraph);
  const feApiMappings = buildFeApiMappings(components, services, injectionGraph, httpCalls, serviceCallGraph);
  const observableFlows = buildObservableFlows(httpCalls, serviceCallGraph, injectionGraph, components);
  const componentApiMap = buildComponentApiMap(feApiMappings);

  const allRoutes = [];
  const allGuards = [];
  const allInterceptors = [];
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    allRoutes.push(...(pf.routes ?? []));
    allGuards.push(...(pf.guards ?? []));
    allInterceptors.push(...(pf.interceptors ?? []));
  }

  const routeMap = flattenRoutes(allRoutes);
  const guardMap = buildGuardMap(allGuards, allRoutes, routeMap);
  const permissionMap = buildPermissionMap(allRoutes, guardMap);
  const navigationMap = collectNavigations(allClasses);
  const interceptorMap = buildInterceptorMap(allInterceptors);
  const lazyRoutes = collectLazyRoutes(allRoutes);

  const endpointUsage = buildEndpointUsage(httpCalls, feApiMappings);
  const frontendServices = services.map((s) => ({
    name: s.className,
    file: s.file,
    injections: s.injections,
    httpCallCount: httpCalls.filter((h) => h.class === s.className).length,
    methods: s.methods.map((m) => m.name),
  }));

  const validationErrors = [];
  for (const h of httpCalls) {
    if (!h.endpoint) validationErrors.push({ type: 'unresolved_endpoint', ...h });
  }

  return {
    stats: {
      componentsParsed: components.length,
      servicesParsed: services.length,
      directivesParsed: directives.length,
      pipesParsed: pipes.length,
      httpClientCalls: httpCalls.length,
      endpointsResolved: httpCalls.filter((h) => h.endpoint).length,
      feApiMappings: feApiMappings.length,
      feApiMappingsVerified: feApiMappings.filter((m) => m.verification !== 'NOT VERIFIED').length,
      routeMappings: routeMap.length,
      guardMappings: guardMap.length,
      interceptorMappings: interceptorMap.length,
      permissionMappings: permissionMap.length,
      navigationMappings: navigationMap.length,
      observableChains: observableFlows.length,
      lazyRoutes: lazyRoutes.length,
      validationErrors: validationErrors.length,
    },
    components,
    services,
    httpCalls,
    feApiMappings,
    componentApiMap,
    frontendServices,
    endpointUsage,
    routeMap,
    guardMap,
    permissionMap,
    navigationMap,
    interceptorMap,
    lazyRoutes,
    observableFlows,
    injectionGraph,
    validationErrors,
    endpoints,
    controllerMap,
  };
}

function buildInjectionGraph(classes) {
  const edges = [];
  for (const cls of classes) {
    for (const inj of cls.injections) {
      if (inj.kind === 'signal') continue;
      edges.push({
        from: cls.className,
        fromFile: cls.file,
        property: inj.property,
        to: inj.type,
        kind: inj.kind,
        evidence: { file: inj.file, line: inj.line },
      });
    }
  }
  return edges;
}

function collectHttpCalls(classes, constants, env, endpoints) {
  const calls = [];
  const sfCache = new Map();
  for (const cls of classes) {
    for (const hc of cls.httpCalls) {
      if (!sfCache.has(hc.file)) {
        const abs = join(REPO_ROOT, hc.file);
        sfCache.set(hc.file, createSourceFile(abs, readFileSync(abs, 'utf8')));
      }
      const ctx = { ts, sf: sfCache.get(hc.file), classInfo: cls, constants, env };
      const resolved = hc.urlNode
        ? resolveUrlExpr(hc.urlNode, ctx)
        : { pattern: normalizeApiPath(hc.urlExpr), confidence: 'MEDIUM', parts: [] };
      const ep = matchEndpoint(resolved.pattern, hc.httpMethod, endpoints);
      calls.push({
        id: `${cls.className}.${hc.method}:${hc.httpMethod}:${hc.line}`,
        class: cls.className,
        classFile: cls.file,
        method: hc.method,
        httpMethod: hc.httpMethod,
        urlExpr: hc.urlExpr,
        resolvedPath: resolved.pattern,
        confidence: resolved.confidence,
        endpoint: ep ? { method: ep.method, path: ep.fullPath, module: ep.module, routeFile: ep.routeFile } : null,
        verification: ep ? 'VERIFIED' : 'NOT VERIFIED',
        evidence: { file: hc.file, line: hc.line },
        rxjsOps: hc.rxjsOps,
        options: hc.options,
      });
    }
  }
  return calls;
}

function collectServiceCalls(classes, injectionGraph) {
  const edges = [];
  const propType = new Map();
  for (const e of injectionGraph) {
    propType.set(`${e.from}:${e.property}`, e.to);
  }
  for (const cls of classes) {
    for (const sc of cls.serviceCalls) {
      const targetType = propType.get(`${cls.className}:${sc.property}`);
      edges.push({
        fromClass: sc.fromClass,
        fromMethod: sc.fromMethod,
        property: sc.property,
        toType: targetType ?? 'NOT VERIFIED',
        toMethod: sc.toMethod,
        evidence: { file: sc.file, line: sc.line },
      });
    }
  }
  return edges;
}

function transitiveServices(className, injectionGraph, visited = new Set()) {
  if (visited.has(className)) return [];
  visited.add(className);
  const direct = injectionGraph.filter((e) => e.from === className).map((e) => e.to);
  const all = [...direct];
  for (const d of direct) all.push(...transitiveServices(d, injectionGraph, visited));
  return [...new Set(all)];
}

function buildFeApiMappings(components, services, injectionGraph, httpCalls, serviceCallGraph) {
  const mappings = [];
  const httpByClass = new Map();
  for (const h of httpCalls) {
    if (!httpByClass.has(h.class)) httpByClass.set(h.class, []);
    httpByClass.get(h.class).push(h);
  }

  for (const comp of components) {
    const injectedTypes = transitiveServices(comp.className, injectionGraph);
    injectedTypes.push(...comp.injections.filter((i) => i.kind !== 'signal').map((i) => i.type));

    const compCalls = serviceCallGraph.filter((e) => e.fromClass === comp.className);

    for (const injType of [...new Set(injectedTypes)]) {
      const apiCalls = httpByClass.get(injType) ?? [];
      for (const hc of apiCalls) {
        const tracedCall = compCalls.find((c) => c.toType === injType);
        const chain = tracedCall
          ? [comp.className, `${injType}.${tracedCall.toMethod}`, `${hc.class}.${hc.method}`, hc.httpMethod, hc.resolvedPath]
          : [comp.className, injType, `${hc.class}.${hc.method}`, hc.httpMethod, hc.resolvedPath];

        mappings.push({
          component: comp.className,
          componentFile: comp.file,
          service: injType,
          httpService: hc.class,
          httpMethod: hc.httpMethod,
          resolvedPath: hc.resolvedPath,
          endpoint: hc.endpoint,
          controller: hc.endpoint?.module ?? 'NOT VERIFIED',
          chain,
          confidence: tracedCall ? 'HIGH' : (hc.endpoint ? 'MEDIUM' : 'LOW'),
          verification: hc.verification,
          evidence: [
            { role: 'component', file: comp.file, line: comp.injections[0]?.line ?? 1 },
            { role: 'http', file: hc.evidence.file, line: hc.evidence.line },
          ],
        });
      }
    }

    for (const hc of comp.httpCalls) {
      const existing = httpCalls.find((h) => h.class === comp.className && h.method === hc.method && h.evidence.line === hc.line);
      if (existing?.endpoint) {
        mappings.push({
          component: comp.className,
          componentFile: comp.file,
          service: comp.className,
          httpService: comp.className,
          httpMethod: existing.httpMethod,
          resolvedPath: existing.resolvedPath,
          endpoint: existing.endpoint,
          controller: existing.endpoint?.module ?? 'NOT VERIFIED',
          chain: [comp.className, 'direct', existing.httpMethod, existing.resolvedPath],
          confidence: 'HIGH',
          verification: 'VERIFIED',
          evidence: [{ role: 'http', file: existing.evidence.file, line: existing.evidence.line }],
        });
      }
    }
  }

  const seen = new Set();
  return mappings.filter((m) => {
    const key = `${m.component}|${m.httpMethod}|${m.resolvedPath}|${m.httpService}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildComponentApiMap(mappings) {
  const map = {};
  for (const m of mappings) {
    if (!map[m.component]) map[m.component] = { apis: [], endpoints: [] };
    map[m.component].apis.push(m.service);
    if (m.endpoint) map[m.component].endpoints.push({ method: m.httpMethod, path: m.endpoint.path });
  }
  return map;
}

function buildObservableFlows(httpCalls, serviceCallGraph, injectionGraph, components) {
  const flows = [];
  for (const hc of httpCalls) {
    const callers = serviceCallGraph.filter((e) => e.toType === hc.class && e.toMethod === hc.method);
    for (const c of callers) {
      const compInjectors = components.filter((comp) =>
        injectionGraph.some((e) => e.from === comp.className && e.to === c.fromClass),
      );
      for (const comp of compInjectors) {
        flows.push({
          endpoint: hc.endpoint?.path ?? hc.resolvedPath,
          httpMethod: hc.httpMethod,
          observable: `Observable via ${hc.class}.${hc.method}`,
          service: hc.class,
          component: comp.className,
          signal: comp.signals?.map((s) => s.property).join(', ') || 'NOT VERIFIED',
          templateBinding: comp.templateUrl ?? 'NOT VERIFIED',
          rxjsOps: hc.rxjsOps,
          evidence: hc.evidence,
        });
      }
    }
    flows.push({
      endpoint: hc.endpoint?.path ?? hc.resolvedPath,
      httpMethod: hc.httpMethod,
      observable: `Observable via ${hc.class}.${hc.method}`,
      service: hc.class,
      component: 'NOT VERIFIED',
      signal: 'NOT VERIFIED',
      templateBinding: 'NOT VERIFIED',
      rxjsOps: hc.rxjsOps,
      evidence: hc.evidence,
    });
  }
  return flows;
}

function flattenRoutes(routes, prefix = '') {
  const flat = [];
  for (const r of routes) {
    const path = r.path !== undefined ? `${prefix}/${r.path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/' : prefix;
    flat.push({
      path,
      component: r.component ?? r.lazyComponent?.exportName ?? null,
      lazyComponent: r.lazyComponent ?? null,
      lazyChildren: r.lazyChildren ?? null,
      guards: r.guards ?? [],
      title: r.title ?? null,
      evidence: { file: r.file, line: r.line },
    });
    if (r.children) flat.push(...flattenRoutes(r.children, path));
  }
  return flat;
}

function buildGuardMap(guards, routes, routeMap) {
  const map = [];
  for (const g of guards) {
    map.push({
      guard: g.name,
      file: g.file,
      injections: g.injections,
      evidence: { file: g.file, line: g.line },
    });
  }
  for (const r of routeMap) {
    for (const guard of r.guards ?? []) {
      map.push({
        guard,
        route: r.path,
        component: r.component,
        evidence: r.evidence,
      });
    }
  }
  return map;
}

function buildPermissionMap(routes, guardMap) {
  const perms = [];
  for (const r of routes) {
    for (const g of r.guards ?? []) {
      const m = g.match(/permissionGuard\(([^)]+)\)/);
      if (m) {
        perms.push({
          route: r.path,
          guard: g,
          permissions: m[1].split(',').map((p) => p.trim()),
          evidence: { file: r.file, line: r.line },
        });
      }
    }
    if (r.children) perms.push(...buildPermissionMap(r.children, guardMap));
  }
  return perms;
}

function collectNavigations(classes) {
  const navs = [];
  for (const cls of classes) {
    for (const n of cls.navigations) {
      navs.push({ component: cls.className, ...n });
    }
  }
  return navs;
}

function readInterceptorFeatures(ic) {
  const features = [];
  try {
    const content = readFileSync(join(REPO_ROOT, ic.file), 'utf8');
    if (content.includes('X-CSRF-Token') || content.includes('csrfService')) features.push('CSRF');
    if (content.includes('refreshToken') || content.includes('X-Retry')) features.push('Refresh');
    if (content.includes('401')) features.push('JWT');
    if (content.includes('catchError')) features.push('Error handling');
    if (content.includes('switchMap')) features.push('Retry chain');
    if (content.includes('withCredentials')) features.push('Credentials');
    if (content.includes('X-Organization-Id')) features.push('Context headers');
  } catch { /* skip */ }
  return features.length ? features : ['Logging'];
}

function buildInterceptorMap(interceptors) {
  return interceptors.map((ic) => ({
    name: ic.name,
    file: ic.file,
    injections: ic.injections.map((i) => i.type),
    features: readInterceptorFeatures(ic),
    evidence: { file: ic.file, line: ic.line },
  }));
}

function collectLazyRoutes(routes) {
  const lazy = [];
  function walk(rs, prefix = '') {
    for (const r of rs) {
      const path = r.path !== undefined ? `${prefix}/${r.path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/' : prefix;
      if (r.lazyComponent) lazy.push({ path, type: 'loadComponent', ...r.lazyComponent, evidence: { file: r.file, line: r.line } });
      if (r.lazyChildren) lazy.push({ path, type: 'loadChildren', ...r.lazyChildren, evidence: { file: r.file, line: r.line } });
      if (r.children) walk(r.children, path);
    }
  }
  walk(routes);
  return lazy;
}

function buildEndpointUsage(httpCalls, mappings) {
  const usage = {};
  for (const h of httpCalls) {
    const key = h.endpoint?.path ?? h.resolvedPath ?? 'NOT VERIFIED';
    if (!usage[key]) usage[key] = { method: h.httpMethod, path: key, callers: [], components: [] };
    usage[key].callers.push({ service: h.class, method: h.method, evidence: h.evidence });
  }
  for (const m of mappings) {
    const key = m.endpoint?.path ?? m.resolvedPath ?? 'NOT VERIFIED';
    if (usage[key] && !usage[key].components.includes(m.component)) usage[key].components.push(m.component);
  }
  return Object.values(usage);
}

export function buildCallgraph(analysis) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  function addNode(id, type, label) {
    if (!nodeIds.has(id)) {
      nodeIds.add(id);
      nodes.push({ id, type, label });
    }
  }

  for (const m of analysis.feApiMappings) {
    addNode(`comp:${m.component}`, 'Component', m.component);
    addNode(`svc:${m.service}`, 'Service', m.service);
    if (m.endpoint) addNode(`ep:${m.httpMethod}:${m.endpoint.path}`, 'Endpoint', `${m.httpMethod} ${m.endpoint.path}`);
    edges.push({ from: `comp:${m.component}`, to: `svc:${m.service}`, type: 'injects' });
    if (m.endpoint) {
      edges.push({ from: `svc:${m.service}`, to: `ep:${m.httpMethod}:${m.endpoint.path}`, type: 'http' });
    }
  }

  return { nodes, edges };
}

export function filterDomainGraph(callgraph, keyword) {
  const kw = keyword.toLowerCase();
  const nodes = callgraph.nodes.filter((n) => n.label.toLowerCase().includes(kw) || n.id.toLowerCase().includes(kw));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = callgraph.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  return { nodes, edges };
}
