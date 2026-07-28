# Validates master_database.sql imports cleanly into an empty MySQL instance.
# Usage: npm run db:validate
# Env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_VALIDATE_DB (default fintech_db_validate)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$masterSql = Join-Path $root 'Database_Fintech\master_database.sql'

$host_ = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { 'localhost' }
$port = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { '3306' }
$user = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { 'root' }
$password = $env:MYSQL_PASSWORD
$dbName = if ($env:MYSQL_VALIDATE_DB) { $env:MYSQL_VALIDATE_DB } else { 'fintech_db_validate' }

if (-not (Test-Path $masterSql)) {
  throw "master_database.sql not found. Run npm run db:build first."
}

$mysqlArgs = @('-h', $host_, '-P', $port, '-u', $user, '--protocol=TCP')
if ($password) {
  $env:MYSQL_PWD = $password
}

Write-Host "=== Database Build Validation ==="
Write-Host "Target: $host_`:$port / $dbName"

Write-Host "Dropping validation database (if exists)..."
& mysql @mysqlArgs -e "DROP DATABASE IF EXISTS ``$dbName``;"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Creating validation database..."
& mysql @mysqlArgs -e "CREATE DATABASE ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$importSql = @"
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS ``$dbName``;
CREATE DATABASE ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ``$dbName``;
SET SESSION sql_notes = 0;
"@

$normalizedMaster = (Get-Content -Path $masterSql -Raw -Encoding UTF8) `
  -replace 'CREATE DATABASE IF NOT EXISTS fintech_db', "CREATE DATABASE IF NOT EXISTS ``$dbName``" `
  -replace '\bUSE fintech_db\b', "USE ``$dbName``" `
  -replace '\bfintech_db\.', "$dbName."

$fullScript = $importSql + "`n" + $normalizedMaster + "`nSET FOREIGN_KEY_CHECKS = 1;`n"
$tmpFile = Join-Path $env:TEMP "validate-master-$([Guid]::NewGuid().ToString('N')).sql"
try {
  [System.IO.File]::WriteAllText($tmpFile, $fullScript, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Importing master_database.sql..."
  $sourcePath = $tmpFile.Replace('\', '/')
  & mysql @mysqlArgs -e "source $sourcePath"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "master_database.sql import failed (exit $LASTEXITCODE)"
    exit $LASTEXITCODE
  }
}
finally {
  if (Test-Path $tmpFile) { Remove-Item $tmpFile -Force }
}

$checks = @(
  "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = '$dbName' AND table_type = 'BASE TABLE'",
  "SELECT COUNT(*) AS fk_count FROM information_schema.table_constraints WHERE constraint_schema = '$dbName' AND constraint_type = 'FOREIGN KEY'",
  "SELECT COUNT(*) AS index_count FROM information_schema.statistics WHERE table_schema = '$dbName'",
  "SELECT COUNT(*) AS trigger_count FROM information_schema.triggers WHERE trigger_schema = '$dbName'",
  "SELECT COUNT(*) AS routine_count FROM information_schema.routines WHERE routine_schema = '$dbName'",
  "SELECT COUNT(*) AS event_count FROM information_schema.events WHERE event_schema = '$dbName'",
  "SELECT id FROM ``$dbName``.users WHERE email = 'admin@merchantpro.com' LIMIT 1"
)

$requiredTables = @(
  'users', 'organizations', 'merchants', 'payment_orders', 'payment_intents',
  'checkout_sessions', 'background_jobs', 'retry_queue', 'merchant_webhooks',
  'webhook_delivery_queue', 'audit_logs', 'notification_deliveries', 'report_exports'
)

Write-Host ""
Write-Host "--- Object Counts ---"
foreach ($sql in $checks) {
  & mysql @mysqlArgs -N -e $sql
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "--- Required Tables ---"
$missing = @()
foreach ($table in $requiredTables) {
  $exists = & mysql @mysqlArgs -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$dbName' AND table_name = '$table'"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  if ([int]$exists -ne 1) {
    $missing += $table
    Write-Host "MISSING: $table"
  }
  else {
    Write-Host "OK: $table"
  }
}

if ($missing.Count -gt 0) {
  Write-Error "Validation failed: missing tables: $($missing -join ', ')"
  exit 1
}

$tableCount = [int](& mysql @mysqlArgs -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$dbName' AND table_type = 'BASE TABLE'")
if ($tableCount -lt 100) {
  Write-Error "Validation failed: expected at least 100 tables, found $tableCount"
  exit 1
}

Write-Host ""
Write-Host "VALIDATION PASSED: $tableCount tables imported with seed data."
