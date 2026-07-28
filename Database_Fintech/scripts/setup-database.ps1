# Fresh database setup — runs ONLY master_database.sql (no manual steps).
# Usage: npm run db:setup
# Optional env: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$masterSql = Join-Path $root 'Database_Fintech\master_database.sql'

$host_ = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { 'localhost' }
$port = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { '3306' }
$user = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { 'root' }
$password = $env:MYSQL_PASSWORD

if (-not (Test-Path $masterSql)) {
  throw "master_database.sql not found at $masterSql"
}

$mysqlArgs = @('-h', $host_, '-P', $port, '-u', $user, '--protocol=TCP')
if ($password) {
  $mysqlArgs += "-p$password"
}

Write-Host "Dropping database fintech_db (if exists)..."
& mysql @mysqlArgs -e "SET FOREIGN_KEY_CHECKS=0; DROP DATABASE IF EXISTS fintech_db;"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running master_database.sql..."
$sourcePath = $masterSql.Replace('\', '/')
& mysql @mysqlArgs -e "source $sourcePath"
if ($LASTEXITCODE -ne 0) {
  Write-Error "master_database.sql failed"
  exit $LASTEXITCODE
}

Write-Host "Database setup complete."
