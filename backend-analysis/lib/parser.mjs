import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ts, createSourceFile, lineOf, nodeText, getDecorators } from './ts.mjs';
import { REPO_ROOT } from './constants.mjs';

const ROUTE_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'use', 'all']);

function resolveImport(from, relFile) {
  if (!from.startsWith('.')) return from;
  const base = dirname(join(REPO_ROOT, relFile));
  let p = resolve(base, from);
  for (const c of [p, `${p}.ts`, join(p, 'index.ts')]) {
    try {
      readFileSync(c);
      return relative(REPO_ROOT, c).replace(/\\/g, '/');
    } catch { /* next */ }
  }
  return relative(REPO_ROOT, p).replace(/\\/g, '/');
}

function parseImport(node, sf, relFile) {
  if (!ts.isImportDeclaration(node) || !node.moduleSpecifier) return null;
  const from = node.moduleSpecifier.text;
  const spec = node.importClause;
  const names = [];
  if (spec?.name) names.push({ local: spec.name.text, imported: spec.name.text });
  if (spec?.namedBindings && ts.isNamedImports(spec.namedBindings)) {
    for (const el of spec.namedBindings.elements) {
      names.push({ local: el.name.text, imported: (el.propertyName ?? el.name).text });
    }
  }
  return { from, names, file: relFile, resolved: resolveImport(from, relFile) };
}

function classifyFile(relFile) {
  if (relFile.includes('.controller.ts')) return 'controller';
  if (relFile.includes('.service.ts')) return 'service';
  if (relFile.includes('.repository.ts')) return 'repository';
  if (relFile.includes('.routes.ts')) return 'routes';
  if (relFile.includes('/dto/')) return 'dto';
  if (relFile.includes('.middleware.ts')) return 'middleware';
  if (relFile.includes('.validator.ts')) return 'validator';
  if (relFile.includes('/workers/')) return 'worker';
  return 'other';
}

function extractConstructorDI(classNode, sf, className, relFile) {
  const injections = [];
  for (const member of classNode.members) {
    if (ts.isConstructorDeclaration(member)) {
      for (const p of member.parameters) {
        if (p.type) {
          injections.push({
            class: className,
            param: p.name?.getText(sf) ?? 'param',
            type: nodeText(sf, p.type),
            kind: 'constructor',
            file: relFile,
            line: lineOf(sf, p),
          });
        }
      }
    }
    if (ts.isPropertyDeclaration(member) && member.initializer) {
      const name = member.name?.getText(sf);
      if (!name) continue;
      if (ts.isNewExpression(member.initializer) && ts.isIdentifier(member.initializer.expression)) {
        injections.push({
          class: className,
          property: name,
          type: member.initializer.expression.text,
          kind: 'default-new',
          file: relFile,
          line: lineOf(sf, member),
        });
      }
      if (ts.isCallExpression(member.initializer) && ts.isIdentifier(member.initializer.expression) &&
        member.initializer.expression.text === 'inject' && member.initializer.arguments[0]) {
        injections.push({
          class: className,
          property: name,
          type: nodeText(sf, member.initializer.arguments[0]),
          kind: 'inject',
          file: relFile,
          line: lineOf(sf, member),
        });
      }
    }
  }
  return injections;
}

function extractMethods(classNode, sf, className, relFile) {
  const methods = [];
  const methodCalls = [];
  const sqlCalls = [];
  const transactions = [];
  const sideEffects = { audit: [], notification: [], redis: [], worker: [] };

  for (const member of classNode.members) {
    if (!ts.isMethodDeclaration(member) && !ts.isPropertyDeclaration(member)) continue;
    const isArrowProp = ts.isPropertyDeclaration(member) && member.initializer &&
      (ts.isArrowFunction(member.initializer) || ts.isFunctionExpression(member.initializer));
    const methodName = member.name?.getText(sf);
    if (!methodName) continue;
    const body = ts.isMethodDeclaration(member) ? member.body :
      isArrowProp ? member.initializer.body : null;
    methods.push({ name: methodName, file: relFile, line: lineOf(sf, member) });

    if (!body) continue;
    walkBody(body, sf, className, methodName, relFile, methodCalls, sqlCalls, transactions, sideEffects);
  }
  return { methods, methodCalls, sqlCalls, transactions, sideEffects };
}

function walkBody(body, sf, className, methodName, relFile, methodCalls, sqlCalls, transactions, sideEffects) {
  function walk(node) {
    if (ts.isCallExpression(node)) {
      const text = nodeText(sf, node.expression);
      if (text.endsWith('.query') || text.endsWith('.execute')) {
        const sqlArg = node.arguments[0];
        if (sqlArg) {
          sqlCalls.push({
            class: className,
            method: methodName,
            sqlExpr: nodeText(sf, sqlArg),
            sql: extractSqlLiteral(sqlArg, sf),
            callType: text.endsWith('.execute') ? 'execute' : 'query',
            file: relFile,
            line: lineOf(sf, node),
          });
        }
      }
      if (text.includes('beginTransaction')) {
        transactions.push({ class: className, method: methodName, op: 'begin', file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('.commit')) {
        transactions.push({ class: className, method: methodName, op: 'commit', file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('.rollback')) {
        transactions.push({ class: className, method: methodName, op: 'rollback', file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('getConnection')) {
        transactions.push({ class: className, method: methodName, op: 'getConnection', file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('auditRecorder') || text.includes('AuditRecorder')) {
        sideEffects.audit.push({ class: className, method: methodName, call: text, file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('notificationDispatch') || text.includes('NotificationDispatch')) {
        sideEffects.notification.push({ class: className, method: methodName, call: text, file: relFile, line: lineOf(sf, node) });
      }
      if (text.includes('acquireLock') || text.includes('releaseLock') || text.includes('cacheSet') || text.includes('cacheGet')) {
        sideEffects.redis.push({ class: className, method: methodName, call: text, file: relFile, line: lineOf(sf, node) });
      }
      if (ts.isPropertyAccessExpression(node.expression)) {
        const callee = node.expression.name.text;
        if (ts.isPropertyAccessExpression(node.expression.expression) &&
          node.expression.expression.expression?.kind === ts.SyntaxKind.ThisKeyword) {
          methodCalls.push({
            fromClass: className,
            fromMethod: methodName,
            property: node.expression.expression.name.text,
            toMethod: callee,
            file: relFile,
            line: lineOf(sf, node),
          });
        }
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(body);
}

function extractSqlLiteral(node, sf) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    for (const span of node.templateSpans) {
      s += ':param';
      s += span.literal.text;
    }
    return s;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = extractSqlLiteral(node.left, sf);
    const r = extractSqlLiteral(node.right, sf);
    if (l && r) return l + r;
  }
  return null;
}

function parseClass(node, sf, relFile) {
  if (!ts.isClassDeclaration(node) || !node.name) return null;
  const className = node.name.text;
  const decs = getDecorators(node, sf);
  const kind = relFile.includes('.controller.') ? 'Controller'
    : relFile.includes('.service.') ? 'Service'
    : relFile.includes('.repository.') ? 'Repository'
    : 'Class';
  const injections = extractConstructorDI(node, sf, className, relFile);
  const { methods, methodCalls, sqlCalls, transactions, sideEffects } = extractMethods(node, sf, className, relFile);
  const heritage = node.heritageClauses?.map((h) => nodeText(sf, h)) ?? [];
  return { className, kind, file: relFile, decorators: decs, injections, methods, methodCalls, sqlCalls, transactions, sideEffects, heritage };
}

function parseZodExports(node, sf, relFile) {
  if (!ts.isVariableStatement(node)) return [];
  const isExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const schemas = [];
  for (const decl of node.declarationList.declarations) {
    if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
    const init = decl.initializer;
    const isZod = nodeText(sf, init).includes('z.') || nodeText(sf, init).startsWith('z.');
    if (isZod || decl.name.text.endsWith('Schema')) {
      schemas.push({
        name: decl.name.text,
        file: relFile,
        line: lineOf(sf, decl),
        exported: isExport,
        expr: nodeText(sf, init).slice(0, 200),
      });
    }
  }
  return schemas;
}

function parseInterfaceOrType(node, sf, relFile) {
  if (ts.isInterfaceDeclaration(node) && node.name) {
    return { kind: 'Interface', name: node.name.text, file: relFile, line: lineOf(sf, node) };
  }
  if (ts.isTypeAliasDeclaration(node) && node.name) {
    return { kind: 'Type', name: node.name.text, file: relFile, line: lineOf(sf, node) };
  }
  if (ts.isEnumDeclaration(node) && node.name) {
    return { kind: 'Enum', name: node.name.text, file: relFile, line: lineOf(sf, node) };
  }
  return null;
}

function parseFunctionExport(node, sf, relFile) {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return { kind: 'Function', name: node.name.text, file: relFile, line: lineOf(sf, node) };
  }
  if (ts.isVariableStatement(node)) {
    const fns = [];
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
        fns.push({ kind: 'Function', name: decl.name.text, file: relFile, line: lineOf(sf, decl) });
      }
    }
    return fns.length ? fns : null;
  }
  return null;
}

function parseRouteFile(node, sf, relFile) {
  const routes = [];
  if (!ts.isExpressionStatement(node)) return routes;
  const expr = node.expression;
  if (!ts.isCallExpression(expr)) return routes;
  if (!ts.isPropertyAccessExpression(expr.expression)) return routes;
  const routerObj = expr.expression.expression;
  const method = expr.expression.name.text;
  if (!ROUTE_METHODS.has(method)) return routes;
  if (routerObj.getText(sf) !== 'router') return routes;

  const args = expr.arguments;
  let path = null;
  let middlewares = [];
  let controllerRef = null;

  for (const arg of args) {
    if ((ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) && !path) {
      path = arg.text;
      continue;
    }
    const argText = nodeText(sf, arg);
    if (argText.includes('controller.') || argText.includes('Controller.')) {
      const m = argText.match(/(?:controller|(\w+Controller))\.(\w+)/);
      controllerRef = m ? { controller: m[1] ?? 'controller', method: m[2] } : { raw: argText };
    }
    if (!path && ts.isArrayLiteralExpression(arg)) continue;
    middlewares.push({ expr: argText, line: lineOf(sf, arg) });
  }

  routes.push({
    httpMethod: method === 'use' ? 'USE' : method.toUpperCase(),
    path: path ?? '*',
    middlewares,
    controller: controllerRef,
    file: relFile,
    line: lineOf(sf, node),
  });
  return routes;
}

function parseAppMounts(node, sf, relFile) {
  const mounts = [];
  const middlewares = [];
  if (!ts.isExpressionStatement(node)) return { mounts, middlewares };
  const expr = node.expression;
  if (!ts.isCallExpression(expr) || !ts.isPropertyAccessExpression(expr.expression)) return { mounts, middlewares };
  const obj = expr.expression.expression.getText(sf);
  const fn = expr.expression.name.text;
  if (obj !== 'app') return { mounts, middlewares };

  if (fn === 'use' && expr.arguments.length >= 1) {
    const first = expr.arguments[0];
    if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) {
      const mountPath = first.text;
      const routerVar = expr.arguments[1] ? nodeText(sf, expr.arguments[1]) : null;
      mounts.push({ prefix: mountPath, router: routerVar, file: relFile, line: lineOf(sf, node) });
    } else {
      middlewares.push({ expr: nodeText(sf, first), file: relFile, line: lineOf(sf, node) });
    }
  }
  if (['get', 'post', 'put', 'patch', 'delete'].includes(fn) && expr.arguments[0]) {
    const pathArg = expr.arguments[0];
    if (ts.isStringLiteral(pathArg) || ts.isNoSubstitutionTemplateLiteral(pathArg)) {
      mounts.push({ prefix: pathArg.text, method: fn.toUpperCase(), direct: true, file: relFile, line: lineOf(sf, node) });
    }
  }
  return { mounts, middlewares };
}

export function parseFile(absPath) {
  const relFile = relative(REPO_ROOT, absPath).replace(/\\/g, '/');
  const content = readFileSync(absPath, 'utf8');
  const sf = createSourceFile(absPath, content);
  const fileKind = classifyFile(relFile);
  const imports = [];
  const classes = [];
  const dtos = [];
  const interfaces = [];
  const functions = [];
  const routes = [];
  const appMounts = [];
  const appMiddlewares = [];

  function visit(node) {
    const imp = parseImport(node, sf, relFile);
    if (imp) imports.push(imp);
    const cls = parseClass(node, sf, relFile);
    if (cls) classes.push(cls);
    dtos.push(...parseZodExports(node, sf, relFile));
    const iface = parseInterfaceOrType(node, sf, relFile);
    if (iface) interfaces.push(iface);
    const fn = parseFunctionExport(node, sf, relFile);
    if (fn) functions.push(...(Array.isArray(fn) ? fn : [fn]));
    if (fileKind === 'routes') routes.push(...parseRouteFile(node, sf, relFile));
    if (relFile.endsWith('app/app.ts')) {
      const { mounts, middlewares } = parseAppMounts(node, sf, relFile);
      appMounts.push(...mounts);
      appMiddlewares.push(...middlewares);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  return { file: relFile, fileKind, imports, classes, dtos, interfaces, functions, routes, appMounts, appMiddlewares };
}

export function parseAllFiles(filePaths) {
  const parsed = [];
  for (const fp of filePaths) {
    try {
      parsed.push(parseFile(fp));
    } catch (err) {
      parsed.push({ file: relative(REPO_ROOT, fp).replace(/\\/g, '/'), error: String(err) });
    }
  }
  return parsed;
}

export { resolveImport, extractSqlLiteral, nodeText };
