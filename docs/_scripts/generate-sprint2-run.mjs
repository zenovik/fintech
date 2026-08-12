#!/usr/bin/env node
/**
 * Main entry: node docs/_scripts/generate-sprint2-run.mjs
 */
import { STATS } from './generate-sprint2-docs.mjs';
import './generate-sprint2-run-part1.mjs';
import './generate-sprint2-run-part2.mjs';

console.log('\n=== Merchant Pro Documentation Generation Complete ===');
console.log('Files created:', STATS.files);
console.log('ADR count:', STATS.adrs);
console.log('Mermaid diagram count (approx):', STATS.mermaid);
console.log('Sequence diagram count:', STATS.sequence);
console.log('ER diagram count:', STATS.er);
