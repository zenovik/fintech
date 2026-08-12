import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { REPO_ROOT } from './constants.mjs';
import { walkFiles } from './walk.mjs';

export function analyzeDatabase() {
  const masterPath = join(REPO_ROOT, 'Database_Fintech', 'master_database.sql');
  const master = readFileSync(masterPath, 'utf8');
  const tables = [...master.matchAll(/CREATE TABLE IF NOT EXISTS `?(\w+)`?\s*\(/g)].map((m) => m[1]);
  const views = [...master.matchAll(/CREATE VIEW `([^`]+)`/g)].map((m) => m[1]);
  const procedures = [...master.matchAll(/CREATE PROCEDURE `?([^`\s(]+)`?/g)].map((m) => m[1]);
  const indexes = [...master.matchAll(/CREATE INDEX `([^`]+)` ON `([^`]+)`/g)].map((m) => ({ name: m[1], table: m[2] }));
  const fks = [...master.matchAll(/CONSTRAINT `([^`]+)` FOREIGN KEY.*?REFERENCES `([^`]+)`/g)].map((m) => ({ constraint: m[1], references: m[2] }));

  const sqlFiles = walkFiles(join(REPO_ROOT, 'Database_Fintech')).filter((f) => f.endsWith('.sql'));
  const repoFiles = walkFiles(join(REPO_ROOT, 'Backend_Fintech', 'src')).filter((f) => f.endsWith('.repository.ts') || f.endsWith('.service.ts'));

  const tableUsage = {};
  for (const t of tables) tableUsage[t] = { repositories: [], services: [], endpoints: [], workers: [] };

  for (const rf of repoFiles) {
    const content = readFileSync(rf, 'utf8');
    const rel = relative(REPO_ROOT, rf).replace(/\\/g, '/');
    for (const t of tables) {
      if (new RegExp(`\`${t}\`|FROM ${t}|INTO ${t}|UPDATE ${t}|JOIN ${t}`, 'i').test(content)) {
        if (!tableUsage[t]) tableUsage[t] = { repositories: [], services: [], endpoints: [], workers: [] };
        if (rel.includes('.repository.')) tableUsage[t].repositories.push(rel);
        else tableUsage[t].services.push(rel);
      }
    }
  }

  const workerFiles = walkFiles(join(REPO_ROOT, 'Backend_Fintech', 'src')).filter((f) => /worker|job-handler/i.test(f));
  for (const wf of workerFiles) {
    const content = readFileSync(wf, 'utf8');
    for (const t of tables) {
      if (new RegExp(`\`${t}\`|FROM ${t}|INTO ${t}|UPDATE ${t}`, 'i').test(content)) {
        if (tableUsage[t]) tableUsage[t].workers.push(relative(REPO_ROOT, wf).replace(/\\/g, '/'));
      }
    }
  }

  const softDeleteTables = tables.filter((t) => {
    const re = new RegExp(`CREATE TABLE IF NOT EXISTS \`?${t}\`?\\s*\\([\\s\\S]*?;`, 'm');
    const block = master.match(re)?.[0] || '';
    return block.includes('deleted_at');
  });

  return {
    masterSqlFile: relative(REPO_ROOT, masterPath).replace(/\\/g, '/'),
    tables,
    tableCount: tables.length,
    views,
    procedures,
    indexes,
    foreignKeys: fks,
    softDeleteTables,
    sqlFileCount: sqlFiles.length,
    tableUsage,
  };
}

export function mapRepositoriesToTables(tableUsage) {
  return Object.entries(tableUsage)
    .filter(([, u]) => u.repositories.length > 0)
    .map(([table, u]) => ({ table, repositories: u.repositories, evidenceCount: u.repositories.length }));
}
