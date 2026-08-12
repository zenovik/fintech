import { createRequire } from 'node:module';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { REPO_ROOT } from './constants.mjs';

const require = createRequire(import.meta.url);
const tsPath = join(REPO_ROOT, 'Backend_Fintech', 'node_modules', 'typescript');
if (!existsSync(tsPath)) throw new Error('TypeScript not found at ' + tsPath);
const ts = require(tsPath);

export function parseSourceFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  return { content, sf };
}

export function analyzeTsFile(absPath) {
  const { sf } = parseSourceFile(absPath);
  const result = {
    path: absPath,
    classes: [],
    interfaces: [],
    enums: [],
    functions: [],
    types: [],
    decorators: [],
    imports: [],
    exports: [],
    methods: [],
    extends: [],
    implements: [],
  };

  function visit(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      result.imports.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      result.exports.push({ kind: 'reexport', from: node.moduleSpecifier.text });
    }
    if (ts.isClassDeclaration(node) && node.name) {
      const decs = ts.getDecorators(node)?.map((d) => d.getText(sf)) ?? [];
      result.decorators.push(...decs);
      const methods = node.members.filter(ts.isMethodDeclaration).map((m) => ({
        name: m.name?.getText(sf),
        params: m.parameters.length,
      }));
      result.classes.push({
        name: node.name.text,
        decorators: decs,
        methods,
        extends: node.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword)
          ?.types[0]?.getText(sf),
      });
      result.methods.push(...methods.map((m) => ({ class: node.name.text, ...m })));
    }
    if (ts.isInterfaceDeclaration(node) && node.name) {
      result.interfaces.push(node.name.text);
    }
    if (ts.isEnumDeclaration(node) && node.name) {
      result.enums.push(node.name.text);
    }
    if (ts.isFunctionDeclaration(node) && node.name) {
      result.functions.push({ name: node.name.text, params: node.parameters.length });
    }
    if (ts.isTypeAliasDeclaration(node) && node.name) {
      result.types.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return result;
}

export { ts };
