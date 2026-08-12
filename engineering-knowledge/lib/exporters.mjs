import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function toGraphML(graph, path) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n`;
  xml += `<key id="type" for="node" attr.name="type" attr.type="string"/>\n`;
  xml += `<key id="key" for="node" attr.name="key" attr.type="string"/>\n`;
  xml += `<key id="rel" for="edge" attr.name="rel" attr.type="string"/>\n`;
  xml += `<graph id="G" edgedefault="directed">\n`;
  for (const n of graph.nodes.values()) {
    xml += `<node id="${esc(n.id)}"><data key="type">${esc(n.type)}</data><data key="key">${esc(n.key)}</data></node>\n`;
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
  for (const n of graph.nodes.values()) {
    ids.set(n.id, `n${i++}`);
    dot += `  ${ids.get(n.id)} [label="${escDot(n.type)}\\n${escDot(String(n.key).slice(0, 40))}"];\n`;
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

export function toMermaid(graph, path, maxNodes = 80) {
  const nodes = [...graph.nodes.values()].slice(0, maxNodes);
  const idSet = new Set(nodes.map((n) => n.id));
  let m = 'flowchart TB\n';
  const short = new Map();
  nodes.forEach((n, i) => { short.set(n.id, `N${i}`); m += `  N${i}["${n.type}: ${String(n.key).slice(0, 30).replace(/"/g, '')}"]\n`; });
  for (const e of graph.edges) {
    if (idSet.has(e.from) && idSet.has(e.to)) m += `  ${short.get(e.from)} -->|${e.type}| ${short.get(e.to)}\n`;
  }
  writeFileSync(path, m);
}

export function toJsonLd(graph, path) {
  const doc = {
    '@context': { '@vocab': 'https://merchant-pro.local/kg#' },
    '@graph': [
      ...[...graph.nodes.values()].map((n) => ({ '@id': n.id, '@type': n.type, name: n.key, ...n })),
      ...graph.edges.map((e, i) => ({ '@id': `edge:${i}`, '@type': e.type, from: e.from, to: e.to, evidence: e.evidence })),
    ],
  };
  writeFileSync(path, JSON.stringify(doc, null, 2));
}

export function toSimpleSvg(graph, path, w = 1200, h = 800) {
  const nodes = [...graph.nodes.values()].slice(0, 60);
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const positions = new Map();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(n.id, { x: 80 + col * 180, y: 60 + row * 100 });
  });
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#0f172a"/>`;
  const idSet = new Set(nodes.map((n) => n.id));
  for (const e of graph.edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (a && b) svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#64748b" stroke-width="1"/>`;
  }
  for (const n of nodes) {
    const p = positions.get(n.id);
    svg += `<circle cx="${p.x}" cy="${p.y}" r="8" fill="#38bdf8"/><text x="${p.x + 12}" y="${p.y + 4}" fill="#e2e8f0" font-size="9">${escSvg(n.type)}:${escSvg(String(n.key).slice(0, 20))}</text>`;
  }
  svg += '</svg>';
  writeFileSync(path, svg);
}

function escSvg(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

export function toCsvNodesEdges(graph, nodesPath, edgesPath) {
  const nl = ['id,type,key,evidence', ...[...graph.nodes.values()].map((n) =>
    [n.id, n.type, n.key, n.evidence || ''].map(csvEsc).join(','))];
  const el = ['from,to,type,evidence', ...graph.edges.map((e) =>
    [e.from, e.to, e.type, e.evidence || ''].map(csvEsc).join(','))];
  writeFileSync(nodesPath, nl.join('\n'));
  writeFileSync(edgesPath, el.join('\n'));
}

function csvEsc(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}
