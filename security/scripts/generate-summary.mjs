#!/usr/bin/env node
/**
 * Summarize ZAP JSON reports into risk-summary.md
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = join(__dirname, '..', 'reports');

const RISK_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

function loadZapReports() {
  if (!existsSync(reportsDir)) return [];
  return readdirSync(reportsDir)
    .filter((f) => f.endsWith('.json') && f.startsWith('zap-'))
    .map((f) => {
      try {
        return { file: f, data: JSON.parse(readFileSync(join(reportsDir, f), 'utf8')) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function summarize(reports) {
  const counts = Object.fromEntries(RISK_ORDER.map((r) => [r, 0]));
  const findings = [];

  for (const { file, data } of reports) {
    const site = data.site?.[0];
    if (!site?.alerts) continue;
    for (const alert of site.alerts) {
      const risk = alert.riskdesc?.split(' ')[0] ?? alert.risk ?? 'Informational';
      if (counts[risk] !== undefined) counts[risk] += 1;
      findings.push({
        source: file,
        name: alert.name,
        risk,
        count: alert.count ?? 1,
        url: alert.instances?.[0]?.uri ?? '',
      });
    }
  }

  return { counts, findings };
}

const reports = loadZapReports();
const { counts, findings } = summarize(reports);

const md = [
  '# OWASP ZAP Risk Summary',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Alert Counts',
  '',
  ...RISK_ORDER.map((r) => `- **${r}**: ${counts[r] ?? 0}`),
  '',
  '## Top Findings',
  '',
];

if (findings.length === 0) {
  md.push('_No ZAP JSON reports found. Run `npm run security:zap` with Docker to generate scans._');
} else {
  for (const f of findings.slice(0, 50)) {
    md.push(`- [${f.risk}] **${f.name}** (${f.count}) — ${f.url || f.source}`);
  }
}

writeFileSync(join(reportsDir, 'risk-summary.md'), md.join('\n'));
console.log('Wrote security/reports/risk-summary.md');
