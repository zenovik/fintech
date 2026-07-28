# Rebuild master_database.sql from structure_queries/ source files.
# Run from repository root: npm run db:build

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$queriesDir = Join-Path $root 'Database_Fintech\structure_queries'
$output = Join-Path $root 'Database_Fintech\master_database.sql'

$files = @(
  # Schema (DDL) — dependency order
  '00_create_database.sql',
  '03_users.sql',
  '04_auth.sql',
  '02_organizations.sql',
  '01_lookup_tables.sql',
  '05_merchants.sql',
  '06_merchant_management.sql',
  '065_customers.sql',
  '07_transactions.sql',
  '08_transaction_management.sql',
  '09_settlement_management.sql',
  '10_payout_management.sql',
  '11_payment_links.sql',
  '12_invoices.sql',
  '13_qr_payments.sql',
  '14_subscriptions.sql',
  '15_support.sql',
  '16_operations.sql',
  '067_merchant_onboarding.sql',
  '10_roles_permissions.sql',
  '068_merchant_hierarchy.sql',
  '069_onboarding_approval_workflow.sql',
  '070_enterprise_payments_foundation.sql',
  '072_enterprise_payment_gateway.sql',
  '073_enterprise_hosted_checkout.sql',
  '074_enterprise_payment_acceptance.sql',
  '09_dashboard.sql',
  '11_reports_analytics.sql',
  '12_settings.sql',
  '14_notifications.sql',
  '15_audit.sql',
  '066_enterprise_stabilization.sql',
  '075_enterprise_platform_completion.sql',
  '076_p0_remediation.sql',
  '077_execution_layer.sql',
  '078_production_hardening.sql',
  '079_verified_remediation.sql',
  '071_enterprise_production_readiness.sql',
  # Seed data (DML)
  '21_dummy_data_auth.sql',
  '22_dummy_data_dashboard.sql',
  '26_dummy_data_roles.sql',
  '27_dummy_data_reports.sql',
  '28_dummy_data_settings.sql',
  '29_dummy_data_notifications.sql',
  '30_dummy_data_audit.sql',
  '31_dummy_data_organizations.sql',
  '32_dummy_data_customers.sql',
  '33_dummy_data_refunds.sql',
  '34_dummy_data_chargebacks.sql',
  '35_dummy_data_payouts.sql',
  '36_dummy_data_payment_links.sql',
  '37_dummy_data_invoices.sql',
  '38_dummy_data_qr_subscriptions.sql',
  '39_dummy_data_support_operations.sql',
  '40_dummy_data_ai.sql',
  '41_dummy_data_system.sql',
  '43_dummy_data_merchant_onboarding.sql',
  '44_dummy_data_merchant_hierarchy.sql',
  '45_dummy_data_onboarding_approval.sql',
  '46_dummy_data_enterprise_payments.sql',
  '47_dummy_data_production_readiness.sql',
  '50_enterprise_demo_data.sql',
  '066b_merchants_org_finalize.sql',
  '51_enterprise_hierarchy_demo.sql',
  '52_enterprise_payments_bulk_demo.sql',
  '53_dummy_data_payment_gateway.sql',
  '54_dummy_data_hosted_checkout.sql',
  '55_dummy_data_payment_acceptance.sql',
  '56_dummy_data_enterprise_platform.sql'
)

$header = @"
-- =============================================================================
-- MASTER DATABASE SCRIPT
-- Merchant Management Portal - Payment Gateway
-- Auto-synchronized with structure_queries/
-- Regenerate: npm run db:build
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SESSION sql_notes = 0;

"@

$footer = @"

SET FOREIGN_KEY_CHECKS = 1;

"@

$sb = [System.Text.StringBuilder]::new()
[void]$sb.Append($header)

foreach ($file in $files) {
  $path = Join-Path $queriesDir $file
  if (-not (Test-Path $path)) {
    throw "Missing source file: $path"
  }
  [void]$sb.AppendLine()
  [void]$sb.AppendLine("-- >>> FILE: $file")
  [void]$sb.Append((Get-Content -Path $path -Raw -Encoding UTF8))
  if (-not $sb.ToString().EndsWith("`n")) {
    [void]$sb.AppendLine()
  }
}

[void]$sb.Append($footer)

$content = $sb.ToString()
[System.IO.File]::WriteAllText($output, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $output ($($files.Count) files)"
