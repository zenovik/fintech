export interface SearchResult {
  id: string;
  type: string;
  label: string;
  detail?: string;
  route?: string;
  score: number;
}

export interface PortalMetrics {
  repositoryScore: number;
  securityScore: number;
  documentationScore: number;
  architectureScore: number;
  engineeringScore: number;
  coverage: number;
  files: number;
  endpoints: number;
  tables: number;
  components: number;
  workers: number;
  tests: number;
  permissions: number;
  redis: number;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type?: string;
}

export interface EndpointRow {
  method: string;
  fullPath: string;
  module: string;
  permissions: string[];
  authenticate?: boolean;
}

export interface TableRow {
  name: string;
  module?: string;
}

export interface FileRow {
  path: string;
  language: string;
  size: number;
  ownerModule: string;
}

export interface DocEntry {
  path: string;
  title: string;
  category: string;
}
