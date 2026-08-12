import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { REPO_ROOT } from './constants.mjs';

const require = createRequire(import.meta.url);
const ts = require(join(REPO_ROOT, 'Backend_Fintech', 'node_modules', 'typescript'));

export function extractAstEntities(filePath) {
  const rel = relative(REPO_ROOT, filePath).replace(/\\/g, '/');
  const content = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const entities = [];
  const imports = [];
  const exports = [];
  const injections = [];
  const methodCalls = [];

  function decName(node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const decs = ts.getDecorators(node)?.map((d) => d.getText(sf)) ?? [];
      const kind = decs.some((d) => d.includes('Component')) ? 'Component'
        : decs.some((d) => d.includes('Injectable')) ? 'Service'
        : decs.some((d) => d.includes('NgModule')) ? 'Module'
        : 'Class';
      entities.push({ kind, name: node.name.text, file: rel, decorators: decs });
      for (const m of node.members) {
        if (ts.isMethodDeclaration(m) && m.name) {
          const calls = [];
          m.forEachChild(function walkCall(n) {
            if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
              calls.push(n.expression.getText(sf));
            }
            ts.forEachChild(n, walkCall);
          });
          methodCalls.push({ class: node.name.text, method: m.name.getText(sf), calls, file: rel });
        }
        if (ts.isConstructorDeclaration(m)) {
          for (const p of m.parameters) {
            if (p.type) injections.push({ class: node.name.text, param: p.name?.getText(sf), type: p.type.getText(sf), file: rel });
          }
        }
      }
    }
    if (ts.isInterfaceDeclaration(node) && node.name) entities.push({ kind: 'Interface', name: node.name.text, file: rel });
    if (ts.isEnumDeclaration(node) && node.name) entities.push({ kind: 'Enum', name: node.name.text, file: rel });
    if (ts.isTypeAliasDeclaration(node) && node.name) entities.push({ kind: 'Type', name: node.name.text, file: rel });
    if (ts.isFunctionDeclaration(node) && node.name) entities.push({ kind: 'Function', name: node.name.text, file: rel });
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) imports.push({ from: node.moduleSpecifier.text, file: rel });
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) exports.push({ from: node.moduleSpecifier.text, file: rel });
  }
  ts.forEachChild(sf, decName);

  const httpCalls = [...content.matchAll(/\.(get|post|put|patch|delete)\s*[<(]\s*[`'"]([^`'"]+)[`'"]/g)]
    .map((m) => ({ method: m[1].toUpperCase(), url: m[2], file: rel }));
  const templateUrls = [...content.matchAll(/templateUrl:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);

  return { file: rel, entities, imports, exports, injections, methodCalls, httpCalls, templateUrls };
}
