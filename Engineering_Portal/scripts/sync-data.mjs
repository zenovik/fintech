#!/usr/bin/env node
/** Copies generated JSON artifacts into public/data for static portal serving. */
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTAL = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PORTAL, '..');
const OUT = join(PORTAL, 'public', 'data');

const COPIES = [
  ['engineering-intelligence/output/json', 'ei'],
  ['frontend-analysis/output/json', 'fe'],
  ['backend-analysis/output/json', 'be'],
  ['engineering-knowledge/json', 'ek'],
  ['engineering-knowledge/reports', 'ek/reports'],
  ['docs/07_Governance/json', 'gov'],
  ['docs/08_Enterprise_Delivery/json', 'delivery'],
];

const DOC_SOURCES = [
  'docs/01_Product',
  'docs/07_Governance',
  'docs/08_Enterprise_Delivery',
  'engineering-knowledge/reports',
];

function copyDir(src, dest) {
  const abs = join(ROOT, src);
  if (!existsSync(abs)) return 0;
  mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const f of readdirSync(abs)) {
    if (f.endsWith('.json')) {
      cpSync(join(abs, f), join(dest, f));
      n++;
    }
  }
  return n;
}

function trimKnowledgeGraph(maxNodes = 2500) {
  const src = join(ROOT, 'engineering-knowledge/knowledge/knowledge-graph.json');
  if (!existsSync(src)) return;
  const kg = JSON.parse(readFileSync(src, 'utf8'));
  const nodes = (kg.nodes ?? []).slice(0, maxNodes);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = (kg.edges ?? []).filter((e) => ids.has(e.from) && ids.has(e.to)).slice(0, 8000);
  const dest = join(OUT, 'ek', 'knowledge-graph-portal.json');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify({ meta: kg.meta, nodes, edges, trimmed: true, originalNodes: kg.nodes?.length }, null, 0));
}

function copyMarkdownDocs() {
  const docsOut = join(OUT, 'docs');
  mkdirSync(docsOut, { recursive: true });
  const manifest = [];

  const seedDocs = {
    'about.md': `# Engineering Portal\n\nEnterprise documentation portal for the fintech monorepo.\n`,
    'governance.md': `# Governance\n\nSee synced governance JSON scores in the Security and Metrics modules.\n`,
  };
  for (const [name, body] of Object.entries(seedDocs)) {
    writeFileSync(join(docsOut, name), body);
    manifest.push({ path: name, title: name.replace('.md', ''), category: 'Portal' });
  }

  for (const srcDir of DOC_SOURCES) {
    const abs = join(ROOT, srcDir);
    if (!existsSync(abs)) continue;
    walk(abs, (file) => {
      if (!file.endsWith('.md')) return;
      const rel = relative(abs, file).replace(/\\/g, '/');
      const safe = rel.replace(/[^a-zA-Z0-9._/-]/g, '_');
      const destName = `${srcDir.split('/').pop()}_${safe}`.replace(/\//g, '_');
      cpSync(file, join(docsOut, destName));
      manifest.push({
        path: destName,
        title: rel.replace(/\.md$/, ''),
        category: srcDir.split('/').pop() ?? 'Docs',
      });
    });
  }

  writeFileSync(join(docsOut, 'manifest.json'), JSON.stringify({ docs: manifest }, null, 2));
  return manifest.length;
}

function walk(dir, fn) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [src, dest] of COPIES) total += copyDir(src, join(OUT, dest));
trimKnowledgeGraph();
const docCount = copyMarkdownDocs();

const manifest = {
  syncedAt: new Date().toISOString(),
  sources: COPIES.map(([s, d]) => ({ path: s, dest: d })),
  filesCopied: total,
  docsCopied: docCount,
};
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Synced ${total} JSON files + ${docCount} docs → public/data`);
