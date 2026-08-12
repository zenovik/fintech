export class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.nodeIndex = new Map();
  }

  addNode(type, key, props = {}) {
    const id = props.id || `${type}:${key}`;
    if (!this.nodes.has(id)) {
      const node = { id, type, key, ...props, evidence: props.evidence || props.source || 'NOT VERIFIED' };
      this.nodes.set(id, node);
      this.nodeIndex.set(`${type}:${key}`, id);
    }
    return id;
  }

  addEdge(fromId, toId, rel, evidence = 'NOT VERIFIED') {
    if (!fromId || !toId) return;
    this.edges.push({ from: fromId, to: toId, type: rel, evidence });
  }

  getNode(type, key) {
    return this.nodeIndex.get(`${type}:${key}`);
  }

  toJSON() {
    return {
      nodes: [...this.nodes.values()],
      edges: this.edges,
      stats: { nodes: this.nodes.size, edges: this.edges.length },
    };
  }

  subgraph(predicate) {
    const g = new KnowledgeGraph();
    const kept = new Set();
    for (const n of this.nodes.values()) {
      if (predicate(n)) {
        g.nodes.set(n.id, n);
        g.nodeIndex.set(`${n.type}:${n.key}`, n.id);
        kept.add(n.id);
      }
    }
    for (const e of this.edges) {
      if (kept.has(e.from) && kept.has(e.to)) g.edges.push(e);
    }
    return g;
  }
}
