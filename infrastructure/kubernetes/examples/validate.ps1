# PowerShell validation examples for Windows
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$Root\namespaces")) { $Root = Join-Path $PSScriptRoot ".." }

Write-Host "==> Applying namespaces (dry-run)"
kubectl apply --dry-run=client -f "$Root\namespaces\"

foreach ($env in @("development", "staging", "production")) {
    Write-Host ""
    Write-Host "==> Validating overlay: $env"
    kubectl apply --dry-run=client -k "$Root\overlays\$env"
    try {
        kubectl kustomize "$Root\overlays\$env" | kubectl apply --dry-run=server -f -
    } catch {
        Write-Host "    (server dry-run skipped)"
    }
}

Write-Host ""
Write-Host "==> Folder structure"
Get-ChildItem -Path $Root -Recurse -Include *.yaml,*.yml,*.md,*.sh | Select-Object -ExpandProperty FullName

Write-Host ""
Write-Host "Validation complete."
