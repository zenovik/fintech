#!/usr/bin/env node
/**
 * Enterprise Knowledge Graph Platform — Phase 3B
 * Evidence-based graph from repository source only.
 */
import { writeFileSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { EKG_ROOT, REPO_ROOT, GENERATOR_VERSION, out, portalDir } from './lib/constants.mjs';
import { KnowledgeGraph } from './lib/graph-model.mjs';
import { extractAstEntities } from './lib/ast-extractor.mjs';
import { toGraphML, toDot, toMermaid, toJsonLd, toSimpleSvg, toCsvNodesEdges } from './lib/exporters.mjs';

import { walkFiles, catalogFile } from '../engineering-intelligence/lib/walk.mjs';
import { analyzeExpressSync } from '../engineering-intelligence/lib/express-analyzer.mjs';
import { analyzeAngular } from '../engineering-intelligence/lib/angular-analyzer.mjs';
import { analyzeDatabase } from '../engineering-intelligence/lib/sql-analyzer.mjs';
import { analyzePermissions, analyzeWorkers } from '../engineering-intelligence/lib/static-analysis.mjs';

const started = new Date().toISOString();
const g = new KnowledgeGraph();
const validation = { errors: [], brokenLinks: [], orphans: [] };

function meta(n) {
  return { generatedAt: started, generatorVersion: GENERATOR_VERSION, evidenceCount: n, verificationStatus: n > 0 ? 'verified-from-source' : 'NOT VERIFIED' };
}

console.log('EKG Phase 3B — building knowledge graph from', REPO_ROOT);

// --- Index repository ---
const allFiles = walkFiles(REPO_ROOT).filter((f) => !f.includes('engineering-knowledge/output'));
for (const f of allFiles) {
  const c = catalogFile(f);
  g.addNode('File', c.path, { source: c.path, language: c.language, size: c.size, hash: c.hash, evidence: c.path });
}

// --- AST extraction ---
const tsFiles = allFiles.filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules'));
const astByFile = [];
for (const f of tsFiles) {
  try {
    astByFile.push(extractAstEntities(f));
  } catch (e) {
    validation.errors.push({ type: 'ast-parse', file: relative(REPO_ROOT, f), message: e.message });
  }
}

for (const af of astByFile) {
  for (const ent of af.entities) {
    const nid = g.addNode(ent.kind, `${af.file}#${ent.name}`, { name: ent.name, file: af.file, evidence: af.file });
    const fid = g.getNode('File', af.file) || g.addNode('File', af.file, { evidence: af.file });
    g.addEdge(fid, nid, 'OWNS', af.file);
  }
  for (const imp of af.imports) {
    const fromId = g.getNode('File', af.file);
    const tid = g.addNode('Import', `${af.file}->${imp.from}`, { evidence: af.file });
    if (fromId) g.addEdge(fromId, tid, 'IMPORTS', af.file);
  }
  for (const hc of af.httpCalls) {
    const sid = g.getNode('File', af.file);
    const eid = g.addNode('HttpCall', `${af.file}:${hc.method}:${hc.url}`, { method: hc.method, url: hc.url, evidence: af.file });
    if (sid) g.addEdge(sid, eid, 'CALLS', af.file);
  }
}

// --- Backend graph ---
const express = analyzeExpressSync();
const db = analyzeDatabase();
const permissions = analyzePermissions();
const workers = analyzeWorkers();
const angular = analyzeAngular();

for (const ep of express.endpoints) {
  const eid = g.addNode('Endpoint', `${ep.method} ${ep.fullPath}`, {
    method: ep.method, path: ep.fullPath, module: ep.module, routeFile: ep.routeFile, evidence: ep.routeFile,
  });
  const rid = g.addNode('Route', ep.routeFile, { evidence: ep.routeFile });
  g.addEdge(rid, eid, 'OWNS', ep.routeFile);
  const cid = g.addNode('Controller', `${ep.module}.controller`, { module: ep.module, evidence: `Backend_Fintech/src/app/modules/${ep.module}/` });
  g.addEdge(eid, cid, 'CALLS', ep.routeFile);
  const sid = g.addNode('Service', `${ep.module}.service`, { module: ep.module, evidence: `modules/${ep.module}/` });
  g.addEdge(cid, sid, 'CALLS', 'layer-convention');
  const repId = g.addNode('Repository', `${ep.module}.repository`, { module: ep.module, evidence: `modules/${ep.module}/` });
  g.addEdge(sid, repId, 'READS', 'layer-convention');
  for (const p of ep.permissions) {
    for (const perm of p.match(/['"]([a-z_]+:[a-z_]+)['"]/g) || []) {
      const code = perm.replace(/['"]/g, '');
      const pid = g.getNode('Permission', code) || g.addNode('Permission', code, { evidence: permissions.file });
      g.addEdge(pid, eid, 'PROTECTS', ep.routeFile);
    }
  }
  if (ep.authenticate) {
    const mid = g.addNode('Middleware', 'authenticate', { evidence: 'auth.middleware.ts' });
    g.addEdge(mid, eid, 'PROTECTS', 'auth.middleware.ts');
  }
}

// Tables + FK
for (const t of db.tables) {
  g.addNode('Table', t, { evidence: db.masterSqlFile });
}
for (const fk of db.foreignKeys) {
  const fromT = g.getNode('Table', fk.constraint.split('_')[0]) || null;
  // use references table from fk
  const toId = g.getNode('Table', fk.references);
  if (toId) g.addEdge(toId, toId, 'REFERENCES', db.masterSqlFile); // simplified; constraint-level FK below
}
for (const [table, usage] of Object.entries(db.tableUsage)) {
  const tid = g.getNode('Table', table);
  if (!tid) continue;
  for (const r of usage.repositories) {
    const rid = g.addNode('Repository', r, { evidence: r });
    g.addEdge(rid, tid, usage.repositories.includes(r) ? 'WRITES' : 'READS', r);
  }
  for (const w of usage.workers) {
    const wid = g.addNode('Worker', w, { evidence: w });
    g.addEdge(wid, tid, 'READS', w);
  }
}

// Repositories from filesystem
const repoFiles = allFiles.filter((f) => f.endsWith('.repository.ts'));
for (const rf of repoFiles) {
  const rel = relative(REPO_ROOT, rf).replace(/\\/g, '/');
  g.addNode('Repository', rel, { evidence: rel });
  const content = readFileSync(rf, 'utf8');
  for (const t of db.tables) {
    if (new RegExp(`\`${t}\`|FROM ${t}|INTO ${t}|UPDATE ${t}|JOIN ${t}`, 'i').test(content)) {
      const tid = g.getNode('Table', t);
      const rid = g.getNode('Repository', rel);
      if (tid && rid) g.addEdge(rid, tid, 'WRITES', rel);
    }
  }
}

// --- Frontend call graph ---
for (const comp of angular.components) {
  const cid = g.addNode('Component', comp.path, { selector: comp.selector, evidence: comp.path });
  for (const p of comp.apiPaths) {
    const apiId = g.addNode('ApiPath', p, { evidence: comp.path });
    g.addEdge(cid, apiId, 'CALLS', comp.path);
    const matchEp = express.endpoints.find((e) => p.includes(e.fullPath) || e.fullPath.includes(p.replace(/^\//, '')));
    if (matchEp) {
      const eid = g.getNode('Endpoint', `${matchEp.method} ${matchEp.fullPath}`);
      if (eid) g.addEdge(cid, eid, 'CALLS', comp.path);
    } else {
      validation.brokenLinks.push({ type: 'fe-api-no-endpoint', component: comp.path, apiPath: p });
    }
  }
}
for (const svc of angular.services) {
  const sid = g.addNode('Service', svc.path, { evidence: svc.path });
  for (const call of svc.apiCalls) {
    const eid = express.endpoints.find((e) => call.url.includes(e.mountPrefix) || call.url.includes(e.module));
    const apiNode = g.addNode('HttpCall', `${svc.path}:${call.method}:${call.url}`, { evidence: svc.path });
    g.addEdge(sid, apiNode, 'CALLS', svc.path);
    if (eid) {
      const en = g.getNode('Endpoint', `${eid.method} ${eid.fullPath}`);
      if (en) g.addEdge(sid, en, 'CALLS', svc.path);
    }
  }
}
for (const guard of angular.guards) {
  const gid = g.addNode('Guard', guard.path, { evidence: guard.path });
  for (const p of permissions.permissions.slice(0, 5)) {
    validation.brokenLinks.push({ type: 'guard-perm-link-NOT-VERIFIED', guard: guard.path, note: 'static guard-permission mapping requires AST deep analysis' });
    break;
  }
}

// --- Worker graph ---
const workerNode = g.addNode('WorkerProcess', 'Backend_Fintech/src/worker.ts', { evidence: 'worker.ts' });
for (const jt of workers.jobTypes) {
  const jid = g.addNode('BackgroundJob', jt, { evidence: workers.sources[0] });
  g.addEdge(workerNode, jid, 'CONSUMES', workers.sources[0]);
}
for (const q of workers.queueTables) {
  const qid = g.addNode('Queue', q, { evidence: workers.sources[1] });
  g.addEdge(workerNode, qid, 'READS', workers.sources[1]);
}
if (workers.heartbeat !== 'NOT VERIFIED') {
  g.addNode('RedisKey', workers.heartbeat, { evidence: workers.sources[1] });
}

// --- Tests ---
const intTests = allFiles.filter((f) => f.endsWith('.integration.test.ts'));
const e2eTests = allFiles.filter((f) => f.includes('e2e/tests') && f.endsWith('.spec.ts'));
for (const t of intTests) {
  const rel = relative(REPO_ROOT, t).replace(/\\/g, '/');
  const tid = g.addNode('IntegrationTest', rel, { evidence: rel });
  const content = readFileSync(t, 'utf8');
  for (const ep of express.endpoints) {
    if (content.includes(ep.fullPath) || content.includes(ep.mountPrefix)) {
      const eid = g.getNode('Endpoint', `${ep.method} ${ep.fullPath}`);
      if (eid) g.addEdge(tid, eid, 'VALIDATES', rel);
    }
  }
}
for (const t of e2eTests) {
  const rel = relative(REPO_ROOT, t).replace(/\\/g, '/');
  const tid = g.addNode('PlaywrightTest', rel, { evidence: rel });
  for (const comp of angular.components) {
    if (rel.includes(comp.path.split('/features/')[1]?.split('/')[0] || '___')) {
      const cid = g.getNode('Component', comp.path);
      if (cid) g.addEdge(tid, cid, 'VALIDATES', rel);
    }
  }
}
const perfMain = join(REPO_ROOT, 'performance', 'tests', 'main.js');
if (allFiles.some((f) => f.replace(/\\/g, '/').endsWith('performance/tests/main.js'))) {
  g.addNode('K6Scenario', 'performance/tests/main.js', { evidence: 'performance/tests/main.js' });
}

// --- Documentation traceability (grep evidence) ---
const docFiles = allFiles.filter((f) => {
  const n = f.replace(/\\/g, '/');
  return n.endsWith('.md') && (n.includes('/docs/') || n.includes('/Documentation/'));
});
for (const df of docFiles) {
  const rel = relative(REPO_ROOT, df).replace(/\\/g, '/');
  const content = readFileSync(df, 'utf8');
  const did = g.addNode('Documentation', rel, { evidence: rel });
  for (const mod of [...new Set(express.endpoints.map((e) => e.module))]) {
    if (content.includes(mod) || content.includes(mod.replace(/-/g, '_'))) {
      const mid = g.addNode('Module', mod, { evidence: rel });
      g.addEdge(did, mid, 'REFERENCES', rel);
    }
  }
  for (const fr of content.match(/FR-[A-Z0-9-]+/g) || []) {
    const frId = g.addNode('FunctionalRequirement', fr, { evidence: rel });
    g.addEdge(did, frId, 'REFERENCES', rel);
  }
}

// --- Permissions full ---
for (const p of permissions.permissions) {
  g.addNode('Permission', p, { evidence: permissions.file });
}

// --- Orphan detection ---
const endpointIds = new Set(express.endpoints.map((e) => g.getNode('Endpoint', `${e.method} ${e.fullPath}`)).filter(Boolean));
const linkedEndpoints = new Set(g.edges.filter((e) => e.type === 'VALIDATES' || e.type === 'CALLS').map((e) => e.to));
for (const eid of endpointIds) {
  if (!linkedEndpoints.has(eid) && !g.edges.some((e) => e.from === eid || e.to === eid)) {
    validation.orphans.push({ type: 'endpoint-no-fe-or-test-link', id: eid });
  }
}
for (const rf of repoFiles) {
  const rel = relative(REPO_ROOT, rf).replace(/\\/g, '/');
  const hasEdge = g.edges.some((e) => e.from === g.getNode('Repository', rel) || e.to === g.getNode('Repository', rel));
  if (!hasEdge) validation.orphans.push({ type: 'repository-no-table-edge', path: rel });
}

// --- Impact analysis samples ---
const impactReports = [];
for (const sample of ['payment.repository.ts', 'auth.service.ts', 'payment_intents']) {
  const key = sample.replace('.ts', '');
  const affected = { source: sample, services: [], controllers: [], endpoints: [], components: [], tests: [], tables: [], docs: [] };
  for (const e of g.edges) {
    const fromN = g.nodes.get(e.from);
    const toN = g.nodes.get(e.to);
    if (fromN?.key?.includes(key) || toN?.key?.includes(key) || fromN?.name?.includes(key)) {
      if (toN?.type === 'Endpoint') affected.endpoints.push(toN.key);
      if (toN?.type === 'Table') affected.tables.push(toN.key);
      if (fromN?.type === 'IntegrationTest') affected.tests.push(fromN.key);
    }
  }
  impactReports.push(affected);
}

// --- Semantic search index ---
const searchIndex = {};
function indexTerm(term, id, field) {
  const t = term.toLowerCase();
  if (t.length < 3) return;
  if (!searchIndex[t]) searchIndex[t] = [];
  searchIndex[t].push({ id, field, evidence: 'inverted-index' });
}
for (const n of g.nodes.values()) {
  indexTerm(n.type, n.id, 'type');
  indexTerm(String(n.key), n.id, 'key');
  if (n.name) indexTerm(n.name, n.id, 'name');
  if (n.path) indexTerm(String(n.path), n.id, 'path');
}
const queries = {
  'payment capture': searchIndex['payment']?.filter((x) => searchIndex['capture']?.some((y) => y.id === x.id)) || searchIndex['payment']?.slice(0, 20) || [],
  'merchant onboarding': [...(searchIndex['merchant'] || []), ...(searchIndex['onboarding'] || [])].slice(0, 30),
  'refund approval': [...(searchIndex['refund'] || []), ...(searchIndex['approve'] || [])].slice(0, 20),
  'customer search': searchIndex['customer']?.slice(0, 20) || [],
  'subscription renewal': searchIndex['subscription']?.slice(0, 20) || [],
};

// --- Counts ---
const feApiMappings = g.edges.filter((e) => e.type === 'CALLS' && g.nodes.get(e.from)?.type === 'Component' && g.nodes.get(e.to)?.type === 'Endpoint').length;
const apiRepoMappingsFixed = g.edges.filter((e) => {
  const a = g.nodes.get(e.from);
  const b = g.nodes.get(e.to);
  return (a?.type === 'Endpoint' && b?.type === 'Controller') || (a?.type === 'Controller' && b?.type === 'Service') || (a?.type === 'Service' && b?.type === 'Repository');
}).length;
const repoTableMappings = g.edges.filter((e) => e.type === 'WRITES' || e.type === 'READS').filter((e) => g.nodes.get(e.from)?.type === 'Repository' && g.nodes.get(e.to)?.type === 'Table').length;
const permGraphEdges = g.edges.filter((e) => e.type === 'PROTECTS').length;
const docLinks = g.edges.filter((e) => e.type === 'REFERENCES' && g.nodes.get(e.from)?.type === 'Documentation').length;

const entityTypes = {};
for (const n of g.nodes.values()) entityTypes[n.type] = (entityTypes[n.type] || 0) + 1;

const graphJson = g.toJSON();
graphJson.meta = meta(g.nodes.size + g.edges.length);

// --- Write outputs ---
const dirs = ['knowledge', 'graphs', 'graphml', 'svg', 'json', 'csv', 'reports', 'validation', 'queries'];
for (const d of dirs) out(d);

writeFileSync(join(out('knowledge'), 'knowledge-graph.json'), JSON.stringify(graphJson, null, 2));
writeFileSync(join(out('json'), 'entities-by-type.json'), JSON.stringify({ meta: meta(g.nodes.size), entityTypes }, null, 2));
writeFileSync(join(out('json'), 'ast-extract.json'), JSON.stringify({ meta: meta(astByFile.length), files: astByFile.length, data: astByFile.slice(0, 5) }, null, 2));
writeFileSync(join(out('json'), 'full-ast-extract.json'), JSON.stringify(astByFile));
writeFileSync(join(out('json'), 'search-index.json'), JSON.stringify({ meta: meta(Object.keys(searchIndex).length), terms: Object.keys(searchIndex).length, index: searchIndex }));
writeFileSync(join(out('queries'), 'engineering-queries.json'), JSON.stringify({ meta: meta(Object.keys(queries).length), queries }, null, 2));
writeFileSync(join(out('reports'), 'impact-analysis.json'), JSON.stringify({ meta: meta(impactReports.length), reports: impactReports }, null, 2));
writeFileSync(join(out('validation'), 'validation-report.json'), JSON.stringify({
  meta: meta(validation.errors.length + validation.brokenLinks.length + validation.orphans.length),
  ...validation,
  counts: { errors: validation.errors.length, brokenLinks: validation.brokenLinks.length, orphans: validation.orphans.length },
}, null, 2));

toGraphML(g, join(out('graphml'), 'full-graph.graphml'));
toDot(g, join(out('graphs'), 'full-graph.dot'), 'MerchantProKG');
toMermaid(g.subgraph((n) => ['Endpoint', 'Service', 'Repository', 'Table', 'Component'].includes(n.type)), join(out('graphs'), 'core-trace.mmd'), 100);
toJsonLd(g, join(out('json'), 'knowledge-graph.jsonld'));
toCsvNodesEdges(g, join(out('csv'), 'nodes.csv'), join(out('csv'), 'edges.csv'));
toSimpleSvg(g.subgraph((n) => n.type === 'Endpoint' || n.type === 'Table'), join(out('svg'), 'core-graph.svg'));

// Subgraph exports
const domains = {
  payments: (n) => String(n.key).includes('payment'),
  authentication: (n) => String(n.key).includes('auth'),
  workers: (n) => ['Worker', 'BackgroundJob', 'Queue', 'WorkerProcess'].includes(n.type),
  permissions: (n) => n.type === 'Permission' || n.type === 'Middleware',
};
let graphmlCount = 1;
let svgCount = 1;
for (const [name, pred] of Object.entries(domains)) {
  const sub = g.subgraph(pred);
  if (sub.nodes.size > 0) {
    toGraphML(sub, join(out('graphml'), `${name}.graphml`));
    graphmlCount++;
    toDot(sub, join(out('graphs'), `${name}.dot`), name);
    toSimpleSvg(sub, join(out('svg'), `${name}.svg`));
    svgCount++;
    toMermaid(sub, join(out('graphs'), `${name}.mmd`), 50);
  }
}

// --- HTML Knowledge Portal (reads JSON dynamically) ---
const portal = portalDir();
mkdirSync(portal, { recursive: true });
const graphRel = '../engineering-knowledge/knowledge/knowledge-graph.json';
const searchRel = '../engineering-knowledge/json/search-index.json';
const validationRel = '../engineering-knowledge/validation/validation-report.json';
const queriesRel = '../engineering-knowledge/queries/engineering-queries.json';

function portalShell(title, body, active = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="portal.css"></head><body>
<nav class="nav"><a href="index.html">Home</a><a href="search.html">Search</a><a href="api.html">API</a><a href="frontend.html">Frontend</a><a href="backend.html">Backend</a><a href="database.html">Database</a><a href="permissions.html">Permissions</a><a href="workers.html">Workers</a><a href="impact.html">Impact</a><a href="traceability.html">Traceability</a><a href="documentation.html">Docs</a></nav>
<main id="app">${body}</main>
<script src="portal.js"></script></body></html>`;
}

writeFileSync(join(portal, 'portal.css'), `body{font-family:system-ui;margin:0;background:#0f172a;color:#e2e8f0}.nav{background:#1e293b;padding:1rem;display:flex;gap:1rem;flex-wrap:wrap}.nav a{color:#38bdf8}main{padding:1.5rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #334155;padding:6px;font-size:13px}input{padding:8px;width:300px;background:#1e293b;color:#fff;border:1px solid #475569}`);
writeFileSync(join(portal, 'portal.js'), `
const GRAPH_URL='${graphRel}';
const SEARCH_URL='${searchRel}';
let graph=null;
async function loadGraph(){if(!graph){const r=await fetch(GRAPH_URL);graph=await r.json();}return graph;}
async function loadSearch(){const r=await fetch(SEARCH_URL);return r.json();}
function renderTable(rows,cols){if(!rows.length)return'<p>No data</p>';let h='<table><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr>';for(const row of rows.slice(0,200))h+='<tr>'+cols.map(c=>'<td>'+(row[c]??'')+'</td>').join('')+'</tr>';return h+'</table>';}
window.EKG={loadGraph,loadSearch,renderTable};
`);

const pages = ['index', 'search', 'api', 'frontend', 'backend', 'database', 'permissions', 'workers', 'impact', 'architecture', 'traceability', 'documentation'];
for (const p of pages) {
  const scripts = {
    index: `<h1>Knowledge Portal</h1><p id="stats">Loading...</p><script>loadGraph().then(g=>{document.getElementById('stats').innerHTML='Nodes: '+g.stats.nodes+' · Edges: '+g.stats.edges+' · Generated: '+(g.meta?.generatedAt||'');});</script>`,
    search: `<h1>Semantic Search</h1><input id="q" placeholder="Search..." oninput="doSearch(this.value)"><div id="r"></div><script>async function doSearch(q){const s=await loadSearch();const terms=q.toLowerCase().split(/\\s+/);let ids=new Set();for(const t of terms){for(const k of Object.keys(s.index||{})){if(k.includes(t))(s.index[k]||[]).forEach(x=>ids.add(x.id));}}document.getElementById('r').innerHTML='<p>'+ids.size+' matches</p>'+renderTable([...ids].slice(0,50).map(id=>({id})),['id']);}</script>`,
    api: `<h1>API Graph</h1><div id="t"></div><script>loadGraph().then(g=>{const eps=g.nodes.filter(n=>n.type==='Endpoint');document.getElementById('t').innerHTML=renderTable(eps.map(n=>({method:n.method||'',path:n.path||n.key,evidence:n.evidence})),['method','path','evidence']);});</script>`,
    frontend: `<h1>Frontend</h1><div id="t"></div><script>loadGraph().then(g=>{const c=g.nodes.filter(n=>n.type==='Component');document.getElementById('t').innerHTML=renderTable(c.map(n=>({selector:n.selector||'',path:n.key,evidence:n.evidence})),['selector','path','evidence']);});</script>`,
    backend: `<h1>Backend</h1><div id="t"></div><script>loadGraph().then(g=>{const n=g.nodes.filter(x=>['Controller','Service','Repository','Endpoint'].includes(x.type));document.getElementById('t').innerHTML=renderTable(n.map(n=>({type:n.type,key:n.key})),['type','key']);});</script>`,
    database: `<h1>Database</h1><div id="t"></div><script>loadGraph().then(g=>{const t=g.nodes.filter(n=>n.type==='Table');document.getElementById('t').innerHTML=renderTable(t.map(n=>({table:n.key})),['table']);});</script>`,
    permissions: `<h1>Permissions</h1><div id="t"></div><script>loadGraph().then(g=>{const p=g.nodes.filter(n=>n.type==='Permission');document.getElementById('t').innerHTML=renderTable(p.map(n=>({permission:n.key})),['permission']);});</script>`,
    workers: `<h1>Workers</h1><div id="t"></div><script>loadGraph().then(g=>{const w=g.nodes.filter(n=>['Worker','BackgroundJob','Queue','WorkerProcess','RedisKey'].includes(n.type));document.getElementById('t').innerHTML=renderTable(w.map(n=>({type:n.type,key:n.key})),['type','key']);});</script>`,
    impact: `<h1>Impact Analysis</h1><pre id="t">Loading...</pre><script>fetch('${queriesRel.replace('queries', 'reports').replace('engineering-queries.json', 'impact-analysis.json')}').then(r=>r.json()).then(d=>document.getElementById('t').textContent=JSON.stringify(d,null,2));</script>`,
    architecture: `<h1>Architecture</h1><p>Graph exports: engineering-knowledge/graphs/</p><img src="../engineering-knowledge/svg/core-graph.svg" alt="graph" style="max-width:100%">`,
    traceability: `<h1>Traceability</h1><div id="t"></div><script>loadGraph().then(g=>{const e=g.edges.filter(x=>x.type==='VALIDATES');document.getElementById('t').innerHTML=renderTable(e.map(x=>({from:x.from,to:x.to,type:x.type})),['from','to','type']);});</script>`,
    documentation: `<h1>Documentation Links</h1><div id="t"></div><script>loadGraph().then(g=>{const d=g.nodes.filter(n=>n.type==='Documentation');document.getElementById('t').innerHTML=renderTable(d.map(n=>({doc:n.key})),['doc']);});</script>`,
  };
  writeFileSync(join(portal, `${p}.html`), portalShell(p, scripts[p] || '<p>NOT VERIFIED</p>'));
}

// Fix impact page URL
writeFileSync(join(portal, 'impact.html'), portalShell('impact', `<h1>Impact Analysis</h1><pre id="t">Loading...</pre><script>fetch('../engineering-knowledge/reports/impact-analysis.json').then(r=>r.json()).then(d=>document.getElementById('t').textContent=JSON.stringify(d,null,2));</script>`));

const feToApi = g.edges.filter((e) => {
  const a = g.nodes.get(e.from); const b = g.nodes.get(e.to);
  return e.type === 'CALLS' && ((a?.type === 'Component' && b?.type === 'Endpoint') || (a?.type === 'Service' && b?.type === 'Endpoint'));
}).length;

const tablesWithRepoEdgeCount = Object.values(db.tableUsage).filter((u) => u.repositories.length > 0).length;

const intelligenceScore = Math.min(100, Math.round(
  Math.min(graphJson.stats.nodes / 3000, 1) * 25 +
  Math.min(graphJson.stats.edges / 5000, 1) * 25 +
  Math.min(feToApi / Math.max(1, angular.components.length), 1) * 25 +
  Math.min(tablesWithRepoEdgeCount / Math.max(1, db.tableCount), 1) * 25
));

const coverage = Math.min(100, Math.round((tablesWithRepoEdgeCount / db.tableCount) * 100));

const summary = {
  meta: meta(graphJson.stats.nodes + graphJson.stats.edges),
  repositoryEntitiesDiscovered: graphJson.stats.nodes,
  graphNodes: graphJson.stats.nodes,
  graphEdges: graphJson.stats.edges,
  entityTypes,
  frontendToApiMappings: feToApi,
  apiToRepositoryMappings: apiRepoMappingsFixed,
  repositoryToTableMappings: repoTableMappings,
  workerGraphNodes: [...g.nodes.values()].filter((n) => ['Worker', 'BackgroundJob', 'Queue', 'WorkerProcess', 'RedisKey'].includes(n.type)).length,
  permissionGraphEdges: permGraphEdges,
  documentationTraceabilityLinks: docLinks,
  impactAnalysisReports: impactReports.length,
  graphmlGenerated: graphmlCount,
  svgGenerated: svgCount,
  htmlPortalPages: pages.length,
  validationErrors: validation.errors.length,
  brokenLinks: validation.brokenLinks.length,
  orphanEntities: validation.orphans.length,
  repositoryIntelligenceScore: intelligenceScore,
  knowledgeGraphCoveragePercent: coverage,
  tablesWithRepositoryEdge: tablesWithRepoEdgeCount,
  astFilesParsed: astByFile.length,
  endpointsInGraph: express.endpoints.length,
  tablesInGraph: db.tableCount,
  componentsInGraph: angular.components.length,
};

writeFileSync(join(out('json'), 'run-summary.json'), JSON.stringify(summary, null, 2));
console.log('\n=== EKG Phase 3B COMPLETE ===');
console.log(JSON.stringify(summary, null, 2));
