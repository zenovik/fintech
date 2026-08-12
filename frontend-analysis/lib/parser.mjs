import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { ts, createSourceFile, lineOf, nodeText } from './ts.mjs';
import { REPO_ROOT } from './constants.mjs';
import { loadEnvironment } from './env.mjs';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'request']);
const RXJS_OPS = new Set([
  'map', 'catchError', 'switchMap', 'mergeMap', 'concatMap', 'exhaustMap',
  'tap', 'shareReplay', 'retry', 'finalize', 'filter', 'take', 'pipe',
]);

function getDecorators(node, sf) {
  const decs = ts.getDecorators?.(node) ?? node.decorators ?? [];
  return decs.map((d) => nodeText(sf, d));
}

function classifyKind(decs) {
  const t = decs.join(' ');
  if (t.includes('@Component')) return 'Component';
  if (t.includes('@Directive')) return 'Directive';
  if (t.includes('@Pipe')) return 'Pipe';
  if (t.includes('@Injectable')) return 'Service';
  if (t.includes('@NgModule')) return 'Module';
  if (t.includes('CanActivate') || t.includes('CanActivateFn')) return 'Guard';
  if (t.includes('HttpInterceptor') || t.includes('HttpInterceptorFn')) return 'Interceptor';
  return 'Class';
}

function parseImport(node, sf, relFile) {
  if (!ts.isImportDeclaration(node) || !node.moduleSpecifier) return null;
  const from = node.moduleSpecifier.text;
  const spec = node.importClause;
  const names = [];
  if (spec?.name) names.push({ local: spec.name.text, imported: spec.name.text });
  if (spec?.namedBindings) {
    if (ts.isNamedImports(spec.namedBindings)) {
      for (const el of spec.namedBindings.elements) {
        names.push({ local: el.name.text, imported: (el.propertyName ?? el.name).text });
      }
    } else if (ts.isNamespaceImport(spec.namedBindings)) {
      names.push({ local: spec.namedBindings.name.text, imported: '*', namespace: true });
    }
  }
  return { from, names, file: relFile, resolved: resolveImport(from, relFile) };
}

function resolveImport(from, relFile) {
  if (!from.startsWith('.')) return from;
  const base = dirname(join(REPO_ROOT, relFile));
  let p = resolve(base, from);
  const candidates = [p, `${p}.ts`, join(p, 'index.ts')];
  for (const c of candidates) {
    try {
      readFileSync(c);
      return relative(REPO_ROOT, c).replace(/\\/g, '/');
    } catch { /* try next */ }
  }
  return relative(REPO_ROOT, p).replace(/\\/g, '/');
}

function extractConstObject(node, sf, relFile) {
  if (!ts.isVariableStatement(node)) return null;
  const isExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  const results = [];
  for (const decl of node.declarationList.declarations) {
    if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
    let init = decl.initializer;
    if (ts.isAsExpression(init) || ts.isTypeAssertionExpression?.(init)) init = init.expression;
    if (ts.isObjectLiteralExpression(init)) {
      const props = {};
      for (const prop of init.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          props[prop.name.text] = evalLiteral(prop.initializer, sf);
        }
      }
      results.push({ name: decl.name.text, props, file: relFile, exported: isExport, line: lineOf(sf, decl) });
    } else {
      const val = evalLiteral(decl.initializer, sf);
      if (val !== undefined) {
        results.push({ name: decl.name.text, value: val, file: relFile, exported: isExport, line: lineOf(sf, decl) });
      }
    }
  }
  return results;
}

function evalLiteral(node, sf) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isTemplateExpression(node)) return evalTemplate(node, sf);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = evalLiteral(node.left, sf);
    const r = evalLiteral(node.right, sf);
    if (typeof l === 'string' && typeof r === 'string') return l + r;
    if (typeof l === 'string') return l + String(r ?? '');
    return undefined;
  }
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'environment') {
    return { __env: node.name.text };
  }
  if (ts.isAsExpression(node)) return evalLiteral(node.expression, sf);
  if (ts.isParenthesizedExpression(node)) return evalLiteral(node.expression, sf);
  return undefined;
}

function evalTemplate(node, sf) {
  let parts = [node.head.text];
  for (const span of node.templateSpans) {
    parts.push(`\${${nodeText(sf, span.expression)}}`);
    parts.push(span.literal.text);
  }
  return parts.join('');
}

function isThisExpression(node) {
  return node?.kind === ts.SyntaxKind.ThisKeyword || (ts.isIdentifier(node) && node.text === 'this');
}

function extractInjections(classNode, sf, relFile, className) {
  const injections = [];
  for (const member of classNode.members) {
    if (ts.isPropertyDeclaration(member) && member.initializer && ts.isCallExpression(member.initializer)) {
      const call = member.initializer;
      if (ts.isIdentifier(call.expression) && call.expression.text === 'inject' && call.arguments[0]) {
        const typeText = nodeText(sf, call.arguments[0]);
        injections.push({
          class: className,
          property: member.name?.getText(sf) ?? 'unknown',
          type: typeText,
          kind: 'inject',
          file: relFile,
          line: lineOf(sf, member),
        });
      }
    }
    if (ts.isPropertyDeclaration(member) && member.initializer && ts.isCallExpression(member.initializer)) {
      const call = member.initializer;
      if (ts.isIdentifier(call.expression) && call.expression.text === 'signal' && call.arguments[0]) {
        injections.push({
          class: className,
          property: member.name?.getText(sf) ?? 'unknown',
          kind: 'signal',
          file: relFile,
          line: lineOf(sf, member),
        });
      }
    }
    if (ts.isConstructorDeclaration(member)) {
      for (const p of member.parameters) {
        if (p.type) {
          injections.push({
            class: className,
            property: p.name?.getText(sf) ?? 'param',
            type: nodeText(sf, p.type),
            kind: 'constructor',
            file: relFile,
            line: lineOf(sf, p),
          });
        }
      }
    }
  }
  return injections;
}

function lookupConstant(name, prop, constants, importMap) {
  if (prop) {
    const c = constants.get(name);
    if (c?.props?.[prop] !== undefined) return String(c.props[prop]);
    const local = importMap?.get(name);
    if (local) {
      const key = `${local.resolved}::${local.imported}`;
      const byFile = constants.get(key);
      if (byFile?.props?.[prop] !== undefined) return String(byFile.props[prop]);
    }
  }
  const c = constants.get(name);
  if (c?.value !== undefined) return String(c.value);
  if (c?.props) return c.props;
  return undefined;
}

function resolveExpr(node, sf, ctx) {
  const { env, classProps, constants, importMap } = ctx;
  if (!node) return undefined;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;

  if (ts.isTemplateExpression(node)) {
    let r = node.head.text;
    for (const span of node.templateSpans) {
      const sub = resolveExpr(span.expression, sf, ctx);
      if (sub === undefined || sub === ':param') r += ':param';
      else r += String(sub);
      r += span.literal.text;
    }
    return r;
  }

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = resolveExpr(node.left, sf, ctx);
    const r = resolveExpr(node.right, sf, ctx);
    if (l !== undefined && r !== undefined) return String(l) + String(r);
    return undefined;
  }

  if (ts.isPropertyAccessExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'environment') {
      return env[node.name.text];
    }
    if (ts.isPropertyAccessExpression(node) && isThisExpression(node.expression)) {
      return classProps.get(node.name.text);
    }
    if (ts.isIdentifier(node.expression)) {
      const v = lookupConstant(node.expression.text, node.name.text, constants, importMap);
      if (v !== undefined) return v;
    }
  }

  if (ts.isIdentifier(node)) {
    if (classProps.has(node.text)) return classProps.get(node.text);
    const v = lookupConstant(node.text, null, constants, importMap);
    if (v !== undefined) return typeof v === 'object' ? undefined : v;
  }

  if (ts.isAsExpression(node)) return resolveExpr(node.expression, sf, ctx);
  if (ts.isParenthesizedExpression(node)) return resolveExpr(node.expression, sf, ctx);

  if (ts.isNumericLiteral(node)) return node.text;
  return undefined;
}

function extractProperties(classNode, sf, relFile, className, ctx) {
  const props = [];
  const classProps = new Map();
  const members = classNode.members.filter((m) => ts.isPropertyDeclaration(m) && m.initializer);
  for (const member of members) {
    const name = member.name?.getText(sf);
    if (!name) continue;
    const resolvedValue = resolveExpr(member.initializer, sf, { ...ctx, classProps });
    if (resolvedValue !== undefined) classProps.set(name, resolvedValue);
    props.push({
      class: className,
      name,
      initializer: nodeText(sf, member.initializer),
      literal: resolvedValue ?? evalLiteral(member.initializer, sf),
      resolvedValue,
      file: relFile,
      line: lineOf(sf, member),
    });
  }
  return props;
}

function findHttpReceiver(expr, sf, httpProps) {
  if (ts.isPropertyAccessExpression(expr)) {
    const method = expr.name.text;
    if (!HTTP_METHODS.has(method)) return null;
    if (ts.isPropertyAccessExpression(expr.expression)) {
      const recv = expr.expression.name.text;
      if (httpProps.has(recv) || recv === 'http' || recv === 'httpClient') {
        return { recv, method: method.toUpperCase() };
      }
    }
  }
  return null;
}

function extractMethodBodyCalls(body, sf, className, methodName, relFile, httpProps, results) {
  if (!body) return;
  function walk(node, pipeOps = []) {
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'pipe') {
        const ops = [...pipeOps];
        for (const arg of node.arguments) {
          if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression)) {
            const op = arg.expression.text;
            if (RXJS_OPS.has(op)) ops.push(op);
          }
        }
        walk(node.expression.expression, ops);
        return;
      }
      const http = findHttpReceiver(node.expression, sf, httpProps);
      if (http && node.arguments[0]) {
        results.httpCalls.push({
          class: className,
          method: methodName,
          httpMethod: http.method,
          urlExpr: nodeText(sf, node.arguments[0]),
          urlNode: node.arguments[0],
          file: relFile,
          line: lineOf(sf, node),
          rxjsOps: [...pipeOps],
          options: node.arguments[1] ? nodeText(sf, node.arguments[1]) : null,
        });
      }
      if (ts.isPropertyAccessExpression(node.expression)) {
        const calleeProp = node.expression.name.text;
        if (ts.isPropertyAccessExpression(node.expression.expression) &&
          isThisExpression(node.expression.expression.expression)) {
          results.serviceCalls.push({
            fromClass: className,
            fromMethod: methodName,
            property: node.expression.expression.name.text,
            toMethod: calleeProp,
            file: relFile,
            line: lineOf(sf, node),
            args: node.arguments.map((a) => nodeText(sf, a)),
          });
        }
      }
      if (ts.isPropertyAccessExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.expression) &&
        isThisExpression(node.expression.expression.expression) &&
        node.expression.expression.name.text === 'router' &&
        node.expression.name.text === 'navigate' &&
        node.arguments[0]) {
        results.navigations.push({
          class: className,
          method: methodName,
          target: nodeText(sf, node.arguments[0]),
          file: relFile,
          line: lineOf(sf, node),
        });
      }
    }
    ts.forEachChild(node, (c) => walk(c, pipeOps));
  }
  walk(body);
}

function parseClass(node, sf, relFile, ctx) {
  if (!ts.isClassDeclaration(node) || !node.name) return null;
  const decs = getDecorators(node, sf);
  const className = node.name.text;
  const kind = classifyKind(decs);
  const injections = extractInjections(node, sf, relFile, className);
  const properties = extractProperties(node, sf, relFile, className, ctx);
  const httpProps = new Set(
    injections.filter((i) => i.type === 'HttpClient').map((i) => i.property).concat(['http', 'httpClient']),
  );
  const methods = [];
  const httpCalls = [];
  const serviceCalls = [];
  const navigations = [];
  const signals = injections.filter((i) => i.kind === 'signal');

  for (const member of node.members) {
    if (ts.isMethodDeclaration(member) && member.name) {
      const methodName = member.name.getText(sf);
      const bucket = { httpCalls, serviceCalls, navigations };
      extractMethodBodyCalls(member.body, sf, className, methodName, relFile, httpProps, bucket);
      methods.push({ name: methodName, file: relFile, line: lineOf(sf, member) });
    }
  }

  let selector = null;
  let templateUrl = null;
  let standalone = decs.some((d) => d.includes('standalone: true'));
  for (const dec of decs) {
    const sel = dec.match(/selector:\s*['"]([^'"]+)['"]/);
    if (sel) selector = sel[1];
    const tpl = dec.match(/templateUrl:\s*['"]([^'"]+)['"]/);
    if (tpl) templateUrl = tpl[1];
  }

  return {
    className,
    kind,
    file: relFile,
    decorators: decs,
    selector,
    templateUrl,
    standalone,
    injections,
    properties,
    methods,
    httpCalls,
    serviceCalls,
    navigations,
    signals,
  };
}

function parseRoutesArray(node, sf, relFile) {
  const routes = [];
  if (!ts.isVariableStatement(node)) return routes;
  for (const decl of node.declarationList.declarations) {
    if (!decl.initializer || !ts.isArrayLiteralExpression(decl.initializer)) continue;
    const varName = ts.isIdentifier(decl.name) ? decl.name.text : 'routes';
    for (const el of decl.initializer.elements) {
      if (!ts.isObjectLiteralExpression(el)) continue;
      const route = { file: relFile, export: varName, line: lineOf(sf, el) };
      for (const prop of el.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name.getText(sf);
        const val = prop.initializer;
        if (key === 'path' && (ts.isStringLiteral(val) || ts.isNoSubstitutionTemplateLiteral(val))) route.path = val.text;
        if (key === 'redirectTo' && ts.isStringLiteral(val)) route.redirectTo = val.text;
        if (key === 'component' && ts.isIdentifier(val)) route.component = val.text;
        if (key === 'canActivate' && ts.isArrayLiteralExpression(val)) {
          route.guards = val.elements.map((e) => nodeText(sf, e));
        }
        if (key === 'title' && ts.isStringLiteral(val)) route.title = val.text;
        if (key === 'loadComponent' && ts.isArrowFunction(val)) {
          route.lazyComponent = extractDynamicImport(val, sf);
        }
        if (key === 'loadChildren' && ts.isArrowFunction(val)) {
          route.lazyChildren = extractDynamicImport(val, sf);
        }
        if (key === 'children' && ts.isArrayLiteralExpression(val)) {
          route.children = parseRouteObjects(val, sf, relFile);
        }
      }
      routes.push(route);
    }
  }
  return routes;
}

function parseRouteObjects(arr, sf, relFile) {
  const routes = [];
  for (const el of arr.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    const route = { file: relFile, line: lineOf(sf, el) };
    for (const prop of el.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const key = prop.name.getText(sf);
      const val = prop.initializer;
      if (key === 'path' && (ts.isStringLiteral(val) || ts.isNoSubstitutionTemplateLiteral(val))) route.path = val.text;
      if (key === 'component' && ts.isIdentifier(val)) route.component = val.text;
      if (key === 'canActivate' && ts.isArrayLiteralExpression(val)) route.guards = val.elements.map((e) => nodeText(sf, e));
      if (key === 'loadComponent' && ts.isArrowFunction(val)) route.lazyComponent = extractDynamicImport(val, sf);
      if (key === 'loadChildren' && ts.isArrowFunction(val)) route.lazyChildren = extractDynamicImport(val, sf);
      if (key === 'children' && ts.isArrayLiteralExpression(val)) route.children = parseRouteObjects(val, sf, relFile);
    }
    routes.push(route);
  }
  return routes;
}

function extractDynamicImport(arrow, sf) {
  let importPath = null;
  let exportName = null;
  function walk(n) {
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0]) {
      importPath = n.arguments[0].text;
    }
    if (ts.isPropertyAccessExpression(n)) exportName = n.name.text;
    ts.forEachChild(n, walk);
  }
  walk(arrow.body ?? arrow);
  return { importPath, exportName };
}

function parseInterceptorFn(node, sf, relFile) {
  if (!ts.isVariableStatement(node)) return null;
  for (const decl of node.declarationList.declarations) {
    if (!decl.initializer || !ts.isArrowFunction(decl.initializer)) continue;
    const name = ts.isIdentifier(decl.name) ? decl.name.text : null;
    if (!name) continue;
    const injections = [];
    function walk(n) {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'inject' && n.arguments[0]) {
        injections.push({ type: nodeText(sf, n.arguments[0]), line: lineOf(sf, n) });
      }
      ts.forEachChild(n, walk);
    }
    walk(decl.initializer);
    return { name, kind: 'Interceptor', file: relFile, injections, line: lineOf(sf, decl) };
  }
  return null;
}

function parseGuardFn(node, sf, relFile) {
  if (!ts.isFunctionDeclaration(node) || !node.name) return null;
  if (!node.name.text.endsWith('Guard') && node.name.text !== 'permissionGuard') return null;
  const params = node.parameters.map((p) => p.getText(sf));
  const returnArrow = node.body;
  const injections = [];
  function walk(n) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'inject' && n.arguments[0]) {
      injections.push({ type: nodeText(sf, n.arguments[0]), line: lineOf(sf, n) });
    }
    ts.forEachChild(n, walk);
  }
  if (returnArrow) walk(returnArrow);
  return {
    name: node.name.text,
    kind: 'Guard',
    file: relFile,
    params,
    injections,
    line: lineOf(sf, node),
  };
}

export function parseFile(absPath, fileConstants = null) {
  const relFile = relative(REPO_ROOT, absPath).replace(/\\/g, '/');
  const content = readFileSync(absPath, 'utf8');
  const sf = createSourceFile(absPath, content);
  const imports = [];
  const constants = fileConstants ?? new Map();
  const classes = [];
  const routes = [];
  const interceptors = [];
  const guards = [];

  function visit(node) {
    const imp = parseImport(node, sf, relFile);
    if (imp) imports.push(imp);
    const consts = extractConstObject(node, sf, relFile);
    if (consts) {
      for (const c of consts) {
        constants.set(`${relFile}::${c.name}`, c);
        if (c.exported) constants.set(c.name, c);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  const importMap = new Map();
  for (const imp of imports) {
    for (const n of imp.names) importMap.set(n.local, { ...n, from: imp.from, resolved: imp.resolved });
  }

  const env = loadEnvironment();
  const ctx = { env, constants, importMap, classProps: new Map() };

  function visitClasses(node) {
    const cls = parseClass(node, sf, relFile, ctx);
    if (cls) classes.push(cls);
    routes.push(...parseRoutesArray(node, sf, relFile));
    const ic = parseInterceptorFn(node, sf, relFile);
    if (ic) interceptors.push(ic);
    const g = parseGuardFn(node, sf, relFile);
    if (g) guards.push(g);
    ts.forEachChild(node, visitClasses);
  }
  visitClasses(sf);

  return { file: relFile, imports, constants: [...constants.values()], classes, routes, interceptors, guards };
}

export function parseAllFiles(filePaths) {
  const globalConstants = new Map();
  const parsed = [];
  for (const fp of filePaths) {
    try {
      parsed.push(parseFile(fp, globalConstants));
      const last = parsed[parsed.length - 1];
      for (const c of last.constants ?? []) {
        globalConstants.set(`${last.file}::${c.name}`, c);
        if (c.exported) globalConstants.set(c.name, c);
      }
    } catch (err) {
      parsed.push({ file: relative(REPO_ROOT, fp).replace(/\\/g, '/'), error: String(err) });
    }
  }
  return parsed;
}

export { resolveImport, evalLiteral, nodeText };
