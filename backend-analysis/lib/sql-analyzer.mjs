import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './constants.mjs';

const SQL_OPS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CALL'];

export function analyzeSql(sql) {
  if (!sql) return { operation: null, tables: [], columns: [], features: [], confidence: 'NOT VERIFIED' };
  const normalized = sql.replace(/\s+/g, ' ').trim();
  const upper = normalized.toUpperCase();
  let operation = null;
  for (const op of SQL_OPS) {
    if (upper.startsWith(op) || upper.includes(` ${op} `)) {
      operation = op === 'WITH' ? 'SELECT' : op;
      break;
    }
  }
  if (!operation) {
    if (upper.includes('INSERT INTO')) operation = 'INSERT';
    else if (upper.includes('UPDATE ')) operation = 'UPDATE';
    else if (upper.includes('DELETE FROM')) operation = 'DELETE';
    else if (upper.includes('SELECT ')) operation = 'SELECT';
  }

  const tables = extractTables(normalized);
  const columns = extractColumns(normalized);
  const features = [];
  if (/FOR UPDATE/i.test(normalized)) features.push('FOR UPDATE');
  if (/JOIN/i.test(normalized)) features.push('JOIN');
  if (/GROUP BY/i.test(normalized)) features.push('GROUP BY');
  if (/HAVING/i.test(normalized)) features.push('HAVING');
  if (/ORDER BY/i.test(normalized)) features.push('ORDER BY');
  if (/LIMIT/i.test(normalized)) features.push('LIMIT');
  if (/OFFSET/i.test(normalized)) features.push('OFFSET');
  if (/UNION/i.test(normalized)) features.push('UNION');
  if (/WITH\s+/i.test(normalized)) features.push('CTE');

  return { operation, tables, columns, features, confidence: operation ? 'HIGH' : 'NOT VERIFIED' };
}

function extractTables(sql) {
  const tables = new Set();
  const patterns = [
    /\bFROM\s+([a-z_][a-z0-9_]*)/gi,
    /\bJOIN\s+([a-z_][a-z0-9_]*)/gi,
    /\bINTO\s+([a-z_][a-z0-9_]*)/gi,
    /\bUPDATE\s+([a-z_][a-z0-9_]*)/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(sql)) !== null) {
      const name = m[1].split(/\s+/)[0].replace(/`/g, '');
      if (!['SET', 'WHERE', 'AND', 'OR', 'ON', 'VALUES'].includes(name.toUpperCase())) tables.add(name);
    }
  }
  return [...tables];
}

function extractColumns(sql) {
  const cols = new Set();
  const insertMatch = sql.match(/INSERT\s+INTO\s+[a-z_][a-z0-9_]*\s*\(([^)]+)\)/i);
  if (insertMatch) {
    for (const c of insertMatch[1].split(',')) cols.add(c.trim().replace(/`/g, ''));
  }
  return [...cols];
}

let _tablesCache = null;
export function loadDatabaseTables() {
  if (_tablesCache) return _tablesCache;
  try {
    const p = join(REPO_ROOT, 'engineering-intelligence/output/json/sql-tables.json');
    const data = JSON.parse(readFileSync(p, 'utf8'));
    _tablesCache = new Set((data.tables ?? []).map((t) => (typeof t === 'string' ? t : t.name)));
    return _tablesCache;
  } catch {
    try {
      const sql = readFileSync(join(REPO_ROOT, 'Database_Fintech/master_database.sql'), 'utf8');
      _tablesCache = new Set();
      for (const m of sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?([a-z_][a-z0-9_]*)`?/gi)) {
        _tablesCache.add(m[1]);
      }
      return _tablesCache;
    } catch {
      _tablesCache = new Set();
      return _tablesCache;
    }
  }
}

export function matchTables(extracted, knownTables) {
  return extracted.filter((t) => knownTables.has(t));
}
