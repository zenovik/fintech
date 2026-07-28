#!/usr/bin/env node
/**
 * npm audit across monorepo workspaces.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const reportsDir = join(root, 'security', 'reports');

mkdirSync(reportsDir, { recursive: true });

const workspaces = ['.', 'Backend_Fintech', 'Frontend_Fintech'];
const summary = { generatedAt: new Date().toISOString(), workspaces: {} };

for (const ws of workspaces) {
  const cwd = ws === '.' ? root : join(root, ws);
  const result = spawnSync('npm', ['audit', '--json'], {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  let parsed = {};
  try {
    parsed = JSON.parse(result.stdout || '{}');
  } catch {
    parsed = { error: result.stderr || 'audit failed' };
  }

  summary.workspaces[ws] = {
    exitCode: result.status,
    metadata: parsed.metadata ?? null,
    vulnerabilities: parsed.vulnerabilities ?? {},
  };
}

writeFileSync(join(reportsDir, 'dependency-audit.json'), JSON.stringify(summary, null, 2));

const lines = ['Dependency Audit Summary', '========================', ''];
for (const [ws, data] of Object.entries(summary.workspaces)) {
  const meta = data.metadata?.vulnerabilities ?? {};
  lines.push(`${ws}: critical=${meta.critical ?? 0} high=${meta.high ?? 0} moderate=${meta.moderate ?? 0} low=${meta.low ?? 0}`);
}
writeFileSync(join(reportsDir, 'dependency-audit.txt'), lines.join('\n'));
console.log(lines.join('\n'));
