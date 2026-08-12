import { writeFileSync } from 'node:fs';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escDot(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export function toGraphML(graph, path) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n`;
  xml += `<key id="type" for="node" attr.name="type" attr.type="string"/>\n`;
  xml += `<key id="label" for="node" attr.name="label" attr.type="string"/>\n`;
  xml += `<key id="verification" for="node" attr.name="verification" attr.type="string"/>\n`;
  xml += `<key id="rel" for="edge" attr.name="rel" attr.type="string"/>\n`;
  xml += `<graph id="G" edgedefault="directed">\n`;
  for (const n of graph.nodes) {
    xml += `<node id="${esc(n.id)}"><data key="type">${esc(n.type)}</data><data key="label">${esc(n.label)}</data><data key="verification">${esc(n.verification ?? '')}</data></node>\n`;
  }
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    xml += `<edge id="e${i}" source="${esc(e.from)}" target="${esc(e.to)}"><data key="rel">${esc(e.type)}</data></edge>\n`;
  }
  xml += `</graph></graphml>`;
  writeFileSync(path, xml);
}

export function toDot(graph, path, title = 'graph') {
  let dot = `digraph "${title}" {\n  rankdir=LR;\n  node [shape=box fontsize=10];\n`;
  const ids = new Map();
  let i = 0;
  for (const n of graph.nodes) {
    ids.set(n.id, `n${i++}`);
    dot += `  ${ids.get(n.id)} [label="${escDot(n.type)}\\n${escDot(String(n.label).slice(0, 36))}"];\n`;
  }
  for (const e of graph.edges) {
    if (ids.has(e.from) && ids.has(e.to)) dot += `  ${ids.get(e.from)} -> ${ids.get(e.to)} [label="${escDot(e.type)}"];\n`;
  }
  dot += '}\n';
  writeFileSync(path, dot);
}

export function toMermaid(graph, path) {
  const short = new Map();
  let m = 'flowchart LR\n';
  graph.nodes.forEach((n, i) => {
    short.set(n.id, `N${i}`);
    m += `  N${i}["${n.type}: ${String(n.label).slice(0, 26).replace(/"/g, '')}"]\n`;
  });
  for (const e of graph.edges) {
    if (short.has(e.from) && short.has(e.to)) m += `  ${short.get(e.from)} -->|${e.type}| ${short.get(e.to)}\n`;
  }
  writeFileSync(path, m);
}

export function toSimpleSvg(graph, path, w = 1400, h = 900) {
  const nodes = graph.nodes.slice(0, 100);
  const cols = Math.ceil(Math.sqrt(nodes.length)) || 1;
  const positions = new Map();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(n.id, { x: 90 + col * 150, y: 60 + row * 85 });
  });
  const idSet = new Set(nodes.map((n) => n.id));
  const colors = { Endpoint: '#4ade80', Controller: '#38bdf8', Service: '#a78bfa', Repository: '#f472b6', Table: '#fbbf24' };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0f172a"/>`;
  for (const e of graph.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (a && b) svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#475569" stroke-width="1"/>`;
  }
  for (const n of nodes) {
    const p = positions.get(n.id);
    svg += `<circle cx="${p.x}" cy="${p.y}" r="7" fill="${colors[n.type] ?? '#94a3b8'}"/>`;
    svg += `<text x="${p.x + 10}" y="${p.y + 4}" fill="#e2e8f0" font-size="8">${esc(String(n.label).slice(0, 22))}</text>`;
  }
  svg += '</svg>';
  writeFileSync(path, svg);
}

export function toCsv(nodes, edges, nodesPath, edgesPath) {
  const nl = ['id,type,label,verification', ...nodes.map((n) => [n.id, n.type, n.label, n.verification ?? ''].map(csvEsc).join(','))];
  const el = ['from,to,type', ...edges.map((e) => [e.from, e.to, e.type].map(csvEsc).join(','))];
  writeFileSync(nodesPath, nl.join('\n'));
  writeFileSync(edgesPath, el.join('\n'));
}

function csvEsc(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

function explorerHtml(title, dataKey, items, fields) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${title}</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;margin:0;padding:1rem}
input{width:100%;padding:.5rem;margin-bottom:1rem;background:#1e293b;border:1px solid #475569;color:#e2e8f0;border-radius:4px}
.card{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:.75rem;margin-bottom:.5rem;font-size:.85rem}
.tag{font-size:.7rem;background:#334155;padding:.1rem .4rem;border-radius:3px;margin-right:.25rem}
</style></head><body>
<h1>${title}</h1>
<input id="q" placeholder="Search..."/>
<div id="list"></div>
<script>
const DATA=${JSON.stringify(items)};
const FIELDS=${JSON.stringify(fields)};
function render(list){document.getElementById('list').innerHTML=list.slice(0,300).map(i=>'<div class="card">'+FIELDS.map(f=>'<div><span class="tag">'+f+'</span> '+(Array.isArray(i[f])?i[f].join(', '):JSON.stringify(i[f]))+'</div>').join('')+'</div>').join('');}
document.getElementById('q').oninput=e=>{const q=e.target.value.toLowerCase();render(DATA.filter(i=>JSON.stringify(i).toLowerCase().includes(q)));};
render(DATA);
</script></body></html>`;
}

export function generateHtmlDashboards(analysis, htmlDir) {
  const pages = [
    ['backend-analysis.html', 'Backend Analysis', analysis.endpoints, ['method', 'fullPath', 'module', 'verification']],
    ['controller-explorer.html', 'Controller Explorer', analysis.controllerServiceMap, ['controller', 'service', 'verification']],
    ['repository-explorer.html', 'Repository Explorer', analysis.repositorySqlMap, ['repository', 'method', 'operation', 'tables']],
    ['transaction-explorer.html', 'Transaction Explorer', analysis.transactionMap, ['class', 'method', 'hasBegin', 'hasRollback', 'verification']],
    ['worker-explorer.html', 'Worker Explorer', analysis.workerMap, ['class', 'function', 'type']],
    ['redis-explorer.html', 'Redis Explorer', analysis.redisMap, ['class', 'function', 'key', 'operation']],
    ['audit-explorer.html', 'Audit Explorer', analysis.auditMap, ['source', 'method', 'verification']],
    ['impact-analysis.html', 'Impact Analysis', Object.values(analysis.impactAnalysis), ['entity', 'entityType', 'affectedServices', 'affectedEndpoints']],
  ];
  for (const [file, title, items, fields] of pages) {
    writeFileSync(`${htmlDir}/${file}`, explorerHtml(title, file, items, fields));
  }
}
