import { join } from 'node:path';
import { createRequire } from 'node:module';
import { REPO_ROOT } from './constants.mjs';

const require = createRequire(import.meta.url);
export const ts = require(join(REPO_ROOT, 'Backend_Fintech', 'node_modules', 'typescript'));

export function createSourceFile(filePath, content) {
  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

export function lineOf(sf, node) {
  const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return pos.line + 1;
}

export function nodeText(sf, node) {
  return node.getText(sf);
}
