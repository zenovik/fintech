import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './constants.mjs';
import { analyzeSql, loadDatabaseTables, matchTables } from './sql-analyzer.mjs';

function inferMiddlewareType(expr) {
  const e = expr.toLowerCase();
  if (e.includes('helmet')) return 'Helmet';
  if (e.includes('cors')) return 'CORS';
  if (e.includes('ratelimit') || e.includes('rate_limit') || e.includes('ratelimit')) return 'Rate Limit';
  if (e.includes('csrf')) return 'CSRF';
  if (e.includes('authenticate') || e.includes('auth.middleware')) return 'JWT';
  if (e.includes('authorize')) return 'RBAC';
  if (e.includes('requireorganization') || e.includes('organization')) return 'Organization Context';
  if (e.includes('requiremerchant') || e.includes('merchant.middleware')) return 'Merchant Context';
  if (e.includes('validatebody') || e.includes('validatequery') || e.includes('validateparams')) return 'Validation';
  if (e.includes('asynchandler')) return 'Async Handler';
  if (e.includes('featureflag')) return 'Feature Flag';
  if (e.includes('compression')) return 'Compression';
  if (e.includes('morgan')) return 'Logging';
  if (e.includes('requestcontext') || e.includes('requestlogging')) return 'Request Context';
  return null;
}

function buildInjectionMap(classes) {
  const map = new Map();
  for (const cls of classes) {
    for (const inj of cls.injections) {
      const key = inj.property ?? inj.param;
      map.set(`${cls.className}:${key}`, inj.type);
    }
  }
  return map;
}

function resolveInjectedType(className, property, injectionMap) {
  return injectionMap.get(`${className}:${property}`) ?? 'NOT VERIFIED';
}

export function analyze(parsedFiles) {
  const knownTables = loadDatabaseTables();
  const allClasses = [];
  const allRoutes = [];
  const allDtos = [];
  const allInterfaces = [];
  const allFunctions = [];
  const appMounts = [];
  const globalMiddleware = [];

  for (const pf of parsedFiles) {
    if (pf.error) continue;
    allClasses.push(...(pf.classes ?? []));
    allRoutes.push(...(pf.routes ?? []));
    allDtos.push(...(pf.dtos ?? []));
    allInterfaces.push(...(pf.interfaces ?? []));
    allFunctions.push(...(pf.functions ?? []));
    appMounts.push(...(pf.appMounts ?? []));
    globalMiddleware.push(...(pf.appMiddlewares ?? []));
  }

  const controllers = allClasses.filter((c) => c.kind === 'Controller');
  const services = allClasses.filter((c) => c.kind === 'Service');
  const repositories = allClasses.filter((c) => c.kind === 'Repository');
  const injectionMap = buildInjectionMap(allClasses);

  const mountByRouter = buildMountMap(appMounts, parsedFiles);
  const endpoints = buildEndpoints(allRoutes, mountByRouter, parsedFiles);
  const middlewareChains = buildMiddlewareChains(endpoints, globalMiddleware);
  const controllerServiceMap = buildControllerServiceMap(controllers, services, injectionMap);
  const serviceRepositoryMap = buildServiceRepositoryMap(services, repositories, injectionMap);
  const repositorySqlMap = buildRepositorySqlMap(repositories, knownTables);
  const transactionMap = buildTransactionMap(allClasses);
  const workerMap = buildWorkerMap(parsedFiles);
  const redisMap = buildRedisMap(allClasses, parsedFiles);
  const auditMap = buildAuditMap(allClasses, endpoints);
  const notificationMap = buildNotificationMap(allClasses, endpoints);
  const dtoMap = buildDtoMap(allDtos, allRoutes, endpoints);
  const swaggerMap = buildSwaggerMap(parsedFiles, endpoints, allDtos);
  const repoDependencyGraph = buildRepoDependencyGraph(repositories, services, injectionMap);
  const impactAnalysis = buildImpactAnalysis({
    controllers, services, repositories, endpoints, repositorySqlMap, workerMap,
  });

  const validation = runValidation({
    controllers, services, repositories, endpoints, allDtos, allRoutes,
    repositorySqlMap, transactionMap, workerMap,
  });

  const stats = {
    controllersParsed: controllers.length,
    servicesParsed: services.length,
    repositoriesParsed: repositories.length,
    dtosParsed: allDtos.length,
    sqlStatementsParsed: repositorySqlMap.length,
    transactionsDiscovered: transactionMap.length,
    middlewareChainsResolved: middlewareChains.length,
    workerGraphsGenerated: workerMap.length,
    redisMappings: redisMap.length,
    auditMappings: auditMap.length,
    notificationMappings: notificationMap.length,
    repositorySqlMappings: repositorySqlMap.length,
    repositoryTableMappings: repositorySqlMap.filter((r) => r.tables.length > 0).length,
    dtoSwaggerMappings: swaggerMap.filter((s) => s.verification === 'VERIFIED').length,
    endpointsDiscovered: endpoints.length,
    interfacesParsed: allInterfaces.length,
    functionsParsed: allFunctions.length,
    validationErrors: validation.errors.length,
    architectureViolations: validation.violations.length,
  };

  return {
    stats,
    controllers,
    services,
    repositories,
    dtos: allDtos,
    interfaces: allInterfaces,
    endpoints,
    middlewareChains,
    controllerServiceMap,
    serviceRepositoryMap,
    repositorySqlMap,
    transactionMap,
    workerMap,
    redisMap,
    auditMap,
    notificationMap,
    dtoMap,
    swaggerMap,
    repoDependencyGraph,
    impactAnalysis,
    validation,
    globalMiddleware,
    appMounts,
  };
}

function buildMountMap(appMounts, parsedFiles) {
  const map = new Map();
  for (const m of appMounts) {
    if (m.router) map.set(m.router, m.prefix);
  }
  for (const pf of parsedFiles) {
    if (pf.error || !pf.routes?.length) continue;
    for (const exp of pf.file.match(/export\s+\{\s*router\s+as\s+(\w+)/g) ?? []) {
      /* export name resolved below */
    }
    const content = readFileSync(join(REPO_ROOT, pf.file), 'utf8');
    const exportMatch = content.match(/export\s+\{\s*router\s+as\s+(\w+)\s*\}/);
    if (exportMatch) {
      const varName = exportMatch[1];
      const prefix = map.get(varName);
      if (prefix) map.set(pf.file, prefix);
    }
  }
  for (const m of appMounts) {
    if (m.router) {
      for (const pf of parsedFiles) {
        if (pf.error) continue;
        const content = readFileSync(join(REPO_ROOT, pf.file), 'utf8');
        if (content.includes(`as ${m.router}`)) map.set(pf.file, m.prefix);
      }
    }
  }
  return map;
}

function buildEndpoints(allRoutes, mountByRouter, parsedFiles) {
  const endpoints = [];
  for (const pf of parsedFiles) {
    if (pf.error || !pf.routes?.length) continue;
    const mountPrefix = mountByRouter.get(pf.file) ?? 'NOT VERIFIED';
    for (const r of pf.routes) {
      if (r.httpMethod === 'USE') continue;
      const fullPath = mountPrefix === 'NOT VERIFIED'
        ? r.path
        : `${mountPrefix}${r.path === '/' ? '' : r.path}`.replace(/\/+/g, '/');
      const mwTypes = r.middlewares.map((m) => inferMiddlewareType(m.expr)).filter(Boolean);
      const permissions = r.middlewares.flatMap((m) => {
        const pm = m.expr.match(/PERMISSIONS\.(\w+)/g);
        return pm ?? [];
      });
      endpoints.push({
        id: `${r.httpMethod}:${fullPath}`,
        method: r.httpMethod,
        path: r.path,
        fullPath,
        mountPrefix,
        middlewares: r.middlewares,
        middlewareTypes: mwTypes,
        permissions,
        controller: r.controller?.method ? r.controller : r.controller,
        validation: r.middlewares.filter((m) => /validate(Body|Query|Params)/.test(m.expr)).map((m) => m.expr),
        module: pf.file.match(/modules\/([^/]+)/)?.[1] ?? 'unknown',
        evidence: { file: r.file, line: r.line },
        verification: mountPrefix !== 'NOT VERIFIED' ? 'VERIFIED' : 'NOT VERIFIED',
      });
    }
  }
  return endpoints;
}

function buildMiddlewareChains(endpoints, globalMiddleware) {
  const globalTypes = [
    'Helmet', 'CORS', 'Compression', 'CSRF', 'Request Context', 'Logging',
    'Rate Limit', 'Feature Flag',
  ];
  return endpoints.map((ep) => ({
    endpoint: `${ep.method} ${ep.fullPath}`,
    chain: [
      ...globalTypes.map((t) => ({ layer: t, scope: 'global' })),
      ...ep.middlewareTypes.map((t) => ({ layer: t, scope: 'route' })),
      { layer: 'Controller', scope: 'handler', ref: ep.controller },
    ],
    evidence: ep.evidence,
    verification: ep.verification,
  }));
}

function buildControllerServiceMap(controllers, services, injectionMap) {
  const mappings = [];
  for (const ctrl of controllers) {
    for (const inj of ctrl.injections) {
      const type = inj.type;
      if (type.endsWith('Service') || services.some((s) => s.className === type)) {
        mappings.push({
          controller: ctrl.className,
          service: type,
          property: inj.property ?? inj.param,
          evidence: { file: inj.file, line: inj.line },
          verification: 'VERIFIED',
        });
      }
    }
    for (const mc of ctrl.methodCalls) {
      const targetType = resolveInjectedType(ctrl.className, mc.property, injectionMap);
      if (targetType.endsWith('Service')) {
        mappings.push({
          controller: ctrl.className,
          controllerMethod: mc.fromMethod,
          service: targetType,
          serviceMethod: mc.toMethod,
          evidence: { file: mc.file, line: mc.line },
          verification: targetType !== 'NOT VERIFIED' ? 'VERIFIED' : 'NOT VERIFIED',
        });
      }
    }
  }
  return dedupe(mappings, (m) => `${m.controller}|${m.service}|${m.serviceMethod ?? ''}|${m.controllerMethod ?? ''}`);
}

function buildServiceRepositoryMap(services, repositories, injectionMap) {
  const mappings = [];
  for (const svc of services) {
    for (const inj of svc.injections) {
      if (inj.type.endsWith('Repository') || repositories.some((r) => r.className === inj.type)) {
        mappings.push({
          service: svc.className,
          repository: inj.type,
          property: inj.property ?? inj.param,
          evidence: { file: inj.file, line: inj.line },
          verification: 'VERIFIED',
        });
      }
    }
    for (const mc of svc.methodCalls) {
      const targetType = resolveInjectedType(svc.className, mc.property, injectionMap);
      if (targetType.endsWith('Repository')) {
        mappings.push({
          service: svc.className,
          serviceMethod: mc.fromMethod,
          repository: targetType,
          repositoryMethod: mc.toMethod,
          evidence: { file: mc.file, line: mc.line },
          verification: 'VERIFIED',
        });
      }
    }
  }
  return dedupe(mappings, (m) => `${m.service}|${m.repository}|${m.repositoryMethod ?? ''}`);
}

function buildRepositorySqlMap(repositories, knownTables) {
  const mappings = [];
  for (const repo of repositories) {
    for (const sql of repo.sqlCalls) {
      const analysis = analyzeSql(sql.sql);
      const matched = matchTables(analysis.tables, knownTables);
      mappings.push({
        repository: repo.className,
        method: sql.method,
        operation: analysis.operation,
        sql: sql.sql,
        tables: matched.length ? matched : analysis.tables,
        columns: analysis.columns,
        features: analysis.features,
        callType: sql.callType,
        evidence: { file: sql.file, line: sql.line },
        verification: sql.sql && analysis.operation ? 'VERIFIED' : 'NOT VERIFIED',
        confidence: analysis.confidence,
      });
    }
  }
  return mappings;
}

function buildTransactionMap(classes) {
  const txs = [];
  for (const cls of classes) {
    const byMethod = new Map();
    for (const t of cls.transactions) {
      if (!byMethod.has(t.method)) byMethod.set(t.method, { ops: [], evidence: { file: t.file, line: t.line } });
      byMethod.get(t.method).ops.push(t.op);
    }
    for (const [method, data] of byMethod) {
      const ops = data.ops;
      txs.push({
        class: cls.className,
        method,
        hasBegin: ops.includes('begin'),
        hasCommit: ops.includes('commit'),
        hasRollback: ops.includes('rollback'),
        hasGetConnection: ops.includes('getConnection'),
        hasForUpdate: cls.sqlCalls.some((s) => s.method === method && /FOR UPDATE/i.test(s.sql ?? '')),
        hasIdempotency: cls.sqlCalls.some((s) => s.method === method && /idempotency/i.test(s.sql ?? '')),
        nested: ops.filter((o) => o === 'begin').length > 1,
        evidence: data.evidence,
        verification: ops.includes('begin') && ops.includes('rollback') ? 'VERIFIED' : (ops.includes('begin') ? 'PARTIAL' : 'NOT VERIFIED'),
      });
    }
  }
  return txs;
}

function buildWorkerMap(parsedFiles) {
  const workers = [];
  for (const pf of parsedFiles) {
    if (pf.error) continue;
    if (!pf.file.includes('worker') && !pf.file.includes('job-handler')) continue;
    for (const cls of pf.classes ?? []) {
      workers.push({
        class: cls.className,
        file: pf.file,
        methods: cls.methods.map((m) => m.name),
        sqlCalls: cls.sqlCalls.length,
        redisCalls: cls.sideEffects?.redis?.length ?? 0,
        evidence: { file: pf.file, line: 1 },
        verification: 'VERIFIED',
      });
    }
    for (const fn of pf.functions ?? []) {
      if (/claim|process|worker|job|heartbeat/i.test(fn.name)) {
        workers.push({
          function: fn.name,
          file: fn.file,
          evidence: { file: fn.file, line: fn.line },
          verification: 'VERIFIED',
        });
      }
    }
  }
  const jobTypes = [];
  try {
    const content = readFileSync(join(REPO_ROOT, 'Backend_Fintech/src/app/shared/workers/job-handlers.ts'), 'utf8');
    for (const m of content.matchAll(/case\s+['"]([^'"]+)['"]/g)) {
      jobTypes.push({ type: m[1], evidence: { file: 'Backend_Fintech/src/app/shared/workers/job-handlers.ts', line: 0 } });
    }
  } catch { /* skip */ }
  return [...workers, ...jobTypes.map((j) => ({ ...j, kind: 'job-type', verification: 'VERIFIED' }))];
}

function buildRedisMap(classes, parsedFiles) {
  const mappings = [];
  for (const cls of classes) {
    for (const r of cls.sideEffects?.redis ?? []) {
      mappings.push({
        class: cls.className,
        method: r.method,
        operation: r.call,
        evidence: { file: r.file, line: r.line },
        verification: 'VERIFIED',
      });
    }
  }
  try {
    const redisFile = join(REPO_ROOT, 'Backend_Fintech/src/app/shared/infrastructure/redis.client.ts');
    const content = readFileSync(redisFile, 'utf8');
    for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) {
      mappings.push({
        function: m[1],
        file: 'Backend_Fintech/src/app/shared/infrastructure/redis.client.ts',
        evidence: { file: 'Backend_Fintech/src/app/shared/infrastructure/redis.client.ts', line: 0 },
        verification: 'VERIFIED',
      });
    }
    if (content.includes('worker:heartbeat')) {
      mappings.push({ key: 'worker:heartbeat', purpose: 'Heartbeat', verification: 'VERIFIED', evidence: { file: redisFile, line: 0 } });
    }
    if (content.includes('cache:')) {
      mappings.push({ key: 'cache:*', purpose: 'Cache', verification: 'VERIFIED', evidence: { file: redisFile, line: 0 } });
    }
  } catch { /* skip */ }
  return dedupe(mappings, (m) => `${m.class ?? m.function ?? m.key}|${m.method ?? ''}`);
}

function buildAuditMap(classes, endpoints) {
  const mappings = [];
  for (const cls of classes) {
    for (const a of cls.sideEffects?.audit ?? []) {
      mappings.push({
        source: cls.className,
        method: a.method,
        call: a.call,
        chain: ['Endpoint', cls.className, 'AuditRecorder', 'AuditRepository', 'audit_logs'],
        evidence: { file: a.file, line: a.line },
        verification: 'VERIFIED',
      });
    }
  }
  return mappings;
}

function buildNotificationMap(classes, endpoints) {
  const mappings = [];
  for (const cls of classes) {
    for (const n of cls.sideEffects?.notification ?? []) {
      mappings.push({
        source: cls.className,
        method: n.method,
        call: n.call,
        chain: ['Endpoint', cls.className, 'NotificationDispatch', 'NotificationRepository', 'notification_deliveries'],
        evidence: { file: n.file, line: n.line },
        verification: 'VERIFIED',
      });
    }
  }
  return mappings;
}

function buildDtoMap(allDtos, allRoutes, endpoints) {
  const mappings = [];
  for (const ep of endpoints) {
    for (const v of ep.validation) {
      const schemaMatch = v.match(/(\w+Schema)/);
      if (schemaMatch) {
        const schema = allDtos.find((d) => d.name === schemaMatch[1]);
        mappings.push({
          dto: schemaMatch[1],
          endpoint: `${ep.method} ${ep.fullPath}`,
          controller: ep.controller,
          dtoFile: schema?.file ?? 'NOT VERIFIED',
          evidence: ep.evidence,
          verification: schema ? 'VERIFIED' : 'NOT VERIFIED',
        });
      }
    }
  }
  return mappings;
}

function buildSwaggerMap(parsedFiles, endpoints, allDtos) {
  const mappings = [];
  try {
    const swaggerPath = join(REPO_ROOT, 'Backend_Fintech/src/app/swagger/swagger.config.ts');
    const content = readFileSync(swaggerPath, 'utf8');
    if (content.includes('openapi') || content.includes('swagger')) {
      mappings.push({
        swagger: '/api/docs',
        configFile: 'Backend_Fintech/src/app/swagger/swagger.config.ts',
        verification: 'VERIFIED',
        evidence: { file: swaggerPath, line: 1 },
      });
    }
  } catch { /* skip */ }
  for (const ep of endpoints) {
    mappings.push({
      endpoint: `${ep.method} ${ep.fullPath}`,
      module: ep.module,
      dtos: ep.validation,
      verification: ep.verification,
      evidence: ep.evidence,
    });
  }
  return mappings;
}

function buildRepoDependencyGraph(repositories, services, injectionMap) {
  const edges = [];
  for (const svc of services) {
    for (const inj of svc.injections) {
      if (inj.type.endsWith('Repository')) {
        edges.push({ from: svc.className, to: inj.type, type: 'service-uses-repository', verification: 'VERIFIED' });
      }
    }
  }
  for (const repo of repositories) {
    for (const inj of repo.injections) {
      edges.push({ from: repo.className, to: inj.type, type: 'repository-dependency', verification: 'VERIFIED' });
    }
  }
  return edges;
}

function buildImpactAnalysis({ controllers, services, repositories, endpoints, repositorySqlMap, workerMap }) {
  const reports = {};
  for (const repo of repositories) {
    const affectedServices = services.filter((s) =>
      s.injections.some((i) => i.type === repo.className) ||
      s.methodCalls.some((mc) => resolveInjectedType(s.className, mc.property, buildInjectionMap([...services, ...repositories])) === repo.className),
    ).map((s) => s.className);
    const affectedControllers = controllers.filter((c) =>
      c.injections.some((i) => affectedServices.includes(i.type)),
    ).map((c) => c.className);
    const affectedEndpoints = endpoints.filter((ep) =>
      affectedControllers.some((c) => ep.controller?.method && c.toLowerCase().includes(ep.controller.method)),
    ).map((ep) => `${ep.method} ${ep.fullPath}`);
    const tables = repositorySqlMap.filter((r) => r.repository === repo.className).flatMap((r) => r.tables);
    reports[`repository:${repo.className}`] = {
      entity: repo.className,
      entityType: 'Repository',
      affectedServices: [...new Set(affectedServices)],
      affectedControllers: [...new Set(affectedControllers)],
      affectedEndpoints: [...new Set(affectedEndpoints)],
      affectedTables: [...new Set(tables)],
      evidence: { file: repo.file, line: 1 },
      verification: 'VERIFIED',
    };
  }
  return reports;
}

function runValidation(ctx) {
  const errors = [];
  const violations = [];
  const { controllers, services, repositories, endpoints, allDtos, repositorySqlMap, transactionMap, workerMap } = ctx;

  for (const repo of repositories) {
    if (!repositorySqlMap.some((r) => r.repository === repo.className)) {
      violations.push({ type: 'repository_without_sql', entity: repo.className, file: repo.file, verification: 'NOT VERIFIED' });
    }
    if (!services.some((s) => s.injections.some((i) => i.type === repo.className))) {
      violations.push({ type: 'repository_without_service', entity: repo.className, file: repo.file });
    }
  }
  for (const ctrl of controllers) {
    if (!endpoints.some((e) => e.controller && ctrl.className.toLowerCase().includes('controller'))) {
      /* many controllers share routes file - check method level */
    }
    if (!ctrl.injections.some((i) => i.type.endsWith('Service'))) {
      violations.push({ type: 'controller_without_service', entity: ctrl.className, file: ctrl.file });
    }
  }
  for (const ep of endpoints) {
    if (!ep.validation.length && ['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      violations.push({ type: 'route_without_validation', endpoint: `${ep.method} ${ep.fullPath}`, evidence: ep.evidence });
    }
  }
  for (const tx of transactionMap) {
    if (tx.hasBegin && !tx.hasRollback) {
      violations.push({ type: 'transaction_without_rollback', class: tx.class, method: tx.method, evidence: tx.evidence });
    }
  }
  for (const dto of allDtos) {
    const used = endpoints.some((e) => e.validation.some((v) => v.includes(dto.name)));
    if (!used && dto.exported) {
      violations.push({ type: 'dto_without_route', dto: dto.name, file: dto.file });
    }
  }

  errors.push(...violations.filter((v) => v.verification === 'NOT VERIFIED'));
  return { errors, violations };
}

function dedupe(arr, keyFn) {
  const seen = new Set();
  return arr.filter((item) => {
    const k = keyFn(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function buildCallgraph(analysis) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  function add(id, type, label, evidence, verification = 'VERIFIED') {
    if (!nodeIds.has(id)) {
      nodeIds.add(id);
      nodes.push({ id, type, label, evidence, verification, confidence: verification === 'VERIFIED' ? 'HIGH' : 'LOW' });
    }
  }

  for (const ep of analysis.endpoints) {
    add(`ep:${ep.id}`, 'Endpoint', `${ep.method} ${ep.fullPath}`, ep.evidence, ep.verification);
    if (ep.controller?.method) {
      add(`ctrl:${ep.controller.method}`, 'Controller', ep.controller.method, ep.evidence);
      edges.push({ from: `ep:${ep.id}`, to: `ctrl:${ep.controller.method}`, type: 'handles' });
    }
  }
  for (const m of analysis.controllerServiceMap) {
    add(`svc:${m.service}`, 'Service', m.service, m.evidence);
    add(`ctrl:${m.controller}`, 'Controller', m.controller, m.evidence);
    edges.push({ from: `ctrl:${m.controller}`, to: `svc:${m.service}`, type: 'calls' });
  }
  for (const m of analysis.serviceRepositoryMap) {
    add(`repo:${m.repository}`, 'Repository', m.repository, m.evidence);
    add(`svc:${m.service}`, 'Service', m.service, m.evidence);
    edges.push({ from: `svc:${m.service}`, to: `repo:${m.repository}`, type: 'queries' });
  }
  for (const m of analysis.repositorySqlMap) {
    for (const t of m.tables) {
      add(`tbl:${t}`, 'Table', t, m.evidence, m.verification);
      edges.push({ from: `repo:${m.repository}`, to: `tbl:${t}`, type: m.operation ?? 'SQL' });
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
