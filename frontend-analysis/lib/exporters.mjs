import { writeFileSync } from 'node:fs';
import { REPO_ROOT } from './constants.mjs';

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export function toGraphML(graph, path) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n`;
  xml += `<key id="type" for="node" attr.name="type" attr.type="string"/>\n`;
  xml += `<key id="label" for="node" attr.name="label" attr.type="string"/>\n`;
  xml += `<key id="rel" for="edge" attr.name="rel" attr.type="string"/>\n`;
  xml += `<graph id="G" edgedefault="directed">\n`;
  for (const n of graph.nodes) {
    xml += `<node id="${esc(n.id)}"><data key="type">${esc(n.type)}</data><data key="label">${esc(n.label)}</data></node>\n`;
  }
  for (let i = 0; i < graph.edges.length; i++) {
    const e = graph.edges[i];
    xml += `<edge id="e${i}" source="${esc(e.from)}" target="${esc(e.to)}"><data key="rel">${esc(e.type)}</data></edge>\n`;
  }
  xml += `</graph></graphml>`;
  writeFileSync(path, xml);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function toDot(graph, path, title = 'graph') {
  let dot = `digraph "${title}" {\n  rankdir=LR;\n  node [shape=box fontsize=10];\n`;
  const ids = new Map();
  let i = 0;
  for (const n of graph.nodes) {
    ids.set(n.id, `n${i++}`);
    dot += `  ${ids.get(n.id)} [label="${escDot(n.type)}\\n${escDot(String(n.label).slice(0, 40))}"];\n`;
  }
  for (const e of graph.edges) {
    if (ids.has(e.from) && ids.has(e.to)) dot += `  ${ids.get(e.from)} -> ${ids.get(e.to)} [label="${escDot(e.type)}"];\n`;
  }
  dot += '}\n';
  writeFileSync(path, dot);
}

function escDot(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function toMermaid(graph, path) {
  const short = new Map();
  let m = 'flowchart LR\n';
  graph.nodes.forEach((n, i) => { short.set(n.id, `N${i}`); m += `  N${i}["${n.type}: ${String(n.label).slice(0, 28).replace(/"/g, '')}"]\n`; });
  for (const e of graph.edges) {
    if (short.has(e.from) && short.has(e.to)) m += `  ${short.get(e.from)} -->|${e.type}| ${short.get(e.to)}\n`;
  }
  writeFileSync(path, m);
}

export function toSimpleSvg(graph, path, w = 1400, h = 900) {
  const nodes = graph.nodes.slice(0, 80);
  const cols = Math.ceil(Math.sqrt(nodes.length)) || 1;
  const positions = new Map();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(n.id, { x: 100 + col * 160, y: 70 + row * 90 });
  });
  const idSet = new Set(nodes.map((n) => n.id));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0f172a"/>`;
  svg += `<text x="20" y="30" fill="#94a3b8" font-size="14">${esc(String(path).split(/[/\\]/).pop())}</text>`;
  for (const e of graph.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (a && b) svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#475569" stroke-width="1"/>`;
  }
  for (const n of nodes) {
    const p = positions.get(n.id);
    const color = n.type === 'Component' ? '#38bdf8' : n.type === 'Endpoint' ? '#4ade80' : '#a78bfa';
    svg += `<circle cx="${p.x}" cy="${p.y}" r="7" fill="${color}"/>`;
    svg += `<text x="${p.x + 10}" y="${p.y + 4}" fill="#e2e8f0" font-size="8">${escSvg(n.label.slice(0, 24))}</text>`;
  }
  svg += '</svg>';
  writeFileSync(path, svg);
}

function escSvg(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function generateHtmlDashboard(analysis, outPath) {
  const data = {
    mappings: analysis.feApiMappings,
    httpCalls: analysis.httpCalls,
    components: analysis.components.map((c) => ({ name: c.className, file: c.file, selector: c.selector })),
    services: analysis.frontendServices,
    routes: analysis.routeMap,
    endpointUsage: analysis.endpointUsage,
  };
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Frontend API Analysis — AST V2</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
  header { padding: 1rem 1.5rem; background: #1e293b; border-bottom: 1px solid #334155; }
  h1 { margin: 0; font-size: 1.25rem; }
  .stats { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: .5rem; font-size: .85rem; color: #94a3b8; }
  .stats span { background: #334155; padding: .2rem .6rem; border-radius: 4px; }
  main { display: grid; grid-template-columns: 280px 1fr; min-height: calc(100vh - 80px); }
  aside { padding: 1rem; border-right: 1px solid #334155; overflow-y: auto; }
  aside input { width: 100%; padding: .5rem; border: 1px solid #475569; border-radius: 4px; background: #1e293b; color: #e2e8f0; margin-bottom: .5rem; }
  aside label { font-size: .75rem; color: #94a3b8; display: block; margin-bottom: .25rem; }
  section { padding: 1rem 1.5rem; overflow-y: auto; }
  .chain { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: .75rem 1rem; margin-bottom: .5rem; cursor: pointer; }
  .chain:hover { border-color: #38bdf8; }
  .chain .path { font-size: .8rem; color: #94a3b8; margin-top: .25rem; }
  .chain .endpoint { color: #4ade80; font-weight: 600; }
  .detail { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 1rem; margin-top: 1rem; }
  .detail h3 { margin: 0 0 .5rem; font-size: 1rem; }
  .evidence { font-size: .8rem; color: #94a3b8; font-family: monospace; }
  .tag { display: inline-block; font-size: .7rem; padding: .1rem .4rem; border-radius: 3px; margin-right: .25rem; }
  .tag.HIGH { background: #166534; }
  .tag.MEDIUM { background: #854d0e; }
  .tag.LOW { background: #7f1d1d; }
  .tag.VERIFIED { background: #1e3a5f; }
  .highlight { outline: 2px solid #38bdf8; }
</style>
</head>
<body>
<header>
  <h1>Frontend → API AST Analyzer (V2)</h1>
  <div class="stats" id="stats"></div>
</header>
<main>
  <aside>
    <label>Search component</label>
    <input id="searchComponent" placeholder="MerchantListComponent"/>
    <label>Search endpoint</label>
    <input id="searchEndpoint" placeholder="GET /api/v1/merchants"/>
    <label>Search service</label>
    <input id="searchService" placeholder="MerchantApiService"/>
  </aside>
  <section>
    <div id="results"></div>
    <div id="detail" class="detail" style="display:none"></div>
  </section>
</main>
<script>
const DATA = ${JSON.stringify(data)};
const stats = document.getElementById('stats');
stats.innerHTML = [
  ['Components', DATA.components.length],
  ['Mappings', DATA.mappings.length],
  ['HttpClient calls', DATA.httpCalls.length],
  ['Endpoints resolved', DATA.httpCalls.filter(h=>h.endpoint).length],
].map(([k,v])=>'<span>'+k+': '+v+'</span>').join('');

const results = document.getElementById('results');
const detail = document.getElementById('detail');

function renderMappings(list) {
  results.innerHTML = list.slice(0, 200).map((m,i) =>
    '<div class="chain" data-idx="'+i+'">' +
    '<div><strong>'+m.component+'</strong> → '+m.service+' → <span class="endpoint">'+(m.httpMethod||'')+' '+(m.resolvedPath||'NOT VERIFIED')+'</span></div>' +
    '<div class="path">' +
    '<span class="tag '+m.confidence+'">'+m.confidence+'</span>' +
    '<span class="tag '+(m.verification||'')+'">'+(m.verification||'')+'</span>' +
    (m.chain||[]).join(' → ') +
    '</div></div>'
  ).join('');
  window._list = list;
  document.querySelectorAll('.chain').forEach(el => {
    el.onclick = () => showDetail(window._list[+el.dataset.idx]);
  });
}

function showDetail(m) {
  detail.style.display = 'block';
  detail.innerHTML = '<h3>'+m.component+' → '+m.httpMethod+' '+m.resolvedPath+'</h3>' +
    '<p>Service: '+m.service+' | Http service: '+m.httpService+'</p>' +
    '<p>Controller module: '+m.controller+'</p>' +
    '<p>Confidence: '+m.confidence+' | Verification: '+m.verification+'</p>' +
    '<div class="evidence">'+(m.evidence||[]).map(e=>e.role+': '+e.file+':'+e.line).join('<br>')+'</div>' +
    '<h4>Callers (same endpoint)</h4>' +
    DATA.mappings.filter(x=>x.resolvedPath===m.resolvedPath && x.httpMethod===m.httpMethod).map(x=>x.component).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
}

function filter() {
  const comp = document.getElementById('searchComponent').value.toLowerCase();
  const ep = document.getElementById('searchEndpoint').value.toLowerCase();
  const svc = document.getElementById('searchService').value.toLowerCase();
  let list = DATA.mappings;
  if (comp) list = list.filter(m => m.component.toLowerCase().includes(comp));
  if (ep) list = list.filter(m => (m.resolvedPath||'').toLowerCase().includes(ep) || (m.httpMethod||'').toLowerCase().includes(ep));
  if (svc) list = list.filter(m => (m.service||'').toLowerCase().includes(svc) || (m.httpService||'').toLowerCase().includes(svc));
  renderMappings(list);
}

document.getElementById('searchComponent').oninput = filter;
document.getElementById('searchEndpoint').oninput = filter;
document.getElementById('searchService').oninput = filter;
renderMappings(DATA.mappings);
</script>
</body>
</html>`;
  writeFileSync(outPath, html);
}
