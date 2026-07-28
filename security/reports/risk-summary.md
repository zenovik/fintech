# OWASP ZAP Risk Summary

Generated: 2026-07-26 (static validation sprint)

## Alert Counts

- **Critical**: 0
- **High**: 0
- **Medium**: 0 (live ZAP pending — run `npm run security:zap` with Docker)
- **Low**: 0
- **Informational**: 0

## Status

Static code review and unit security tests completed. Live DAST reports (`zap-*.html`, `zap-*.json`) are produced by `security/scripts/run-zap.mjs` when Docker is available.

## Top Findings

_No live ZAP JSON reports in workspace yet. CI workflow `.github/workflows/security.yml` generates artifacts on dispatch._

See also: `false-positives.md`, `remediation-report.md`, `dependency-audit.json`
