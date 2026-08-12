# Engineering Intelligence Platform (EIP) — Phase 3A

Code-first repository analysis. **No placeholder data.**

## Run

```bash
cd engineering-intelligence
node run.mjs
```

## Outputs

| Output | Path |
|--------|------|
| JSON artifacts | `output/json/` |
| CSV exports | `output/csv/` |
| Markdown reports | `output/markdown/` |
| Graphs (DOT, Mermaid) | `output/graphs/` |
| HTML dashboard | `../dashboard/` |

## Analyzers executed

1. Repository indexer (SHA-256 catalog)
2. TypeScript AST (Compiler API via Backend typescript)
3. Angular component/route/service discovery
4. Express endpoint + mount resolution
5. SQL table + repository usage grep
6. Permission + worker extraction
7. Static analysis (dead code heuristics, large files)
8. API traceability (endpoint → test file grep)

## Verification

See `output/json/certification.json` for evidence counts and `run-summary.json`.

Items marked **NOT VERIFIED** in reports indicate analyzer limitations, not fabricated data.
