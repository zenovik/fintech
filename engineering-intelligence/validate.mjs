import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'output', 'json');
const certPath = join(root, 'certification.json');
if (!existsSync(certPath)) {
  console.error('Run node run.mjs first');
  process.exit(1);
}
const cert = JSON.parse(readFileSync(certPath, 'utf8'));
const required = ['filesAnalyzed', 'endpointsDiscovered', 'angularComponents', 'sqlTablesMapped'];
let errors = 0;
for (const k of required) {
  if (!cert[k] && cert[k] !== 0) {
    console.error('Missing', k);
    errors++;
  }
}
if (cert.filesAnalyzed < 100) errors++;
if (cert.endpointsDiscovered < 100) errors++;
console.log(errors ? `VALIDATION FAILED: ${errors} errors` : 'VALIDATION OK');
console.log(JSON.stringify(cert, null, 2));
process.exit(errors ? 1 : 0);
