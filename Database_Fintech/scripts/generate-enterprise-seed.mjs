#!/usr/bin/env node
/**
 * Generates realistic enterprise demo data for Merchant Pro.
 * Output: structure_queries/50_enterprise_demo_data.sql
 *
 * Usage: node Database_Fintech/scripts/generate-enterprise-seed.mjs
 */
import { createHash, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { appendEnterprisePolish } from './generate-enterprise-polish.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'structure_queries', '50_enterprise_demo_data.sql');

const PASSWORD_HASH = '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e';
const DAYS = 180;
const NOW = new Date();

const COUNTS = {
  orgs: 8,
  merchants: 120,
  customers: 1500,
  users: 80,
  transactions: 12000,
  refunds: 250,
  chargebacks: 80,
  settlements: 800,
  payouts: 500,
  paymentLinks: 300,
  invoices: 600,
  subscriptions: 250,
  supportTickets: 300,
  auditLogs: 5000,
  notifications: 1000,
  qrCodes: 80,
  systemAlerts: 40,
  incidents: 20,
  retryQueue: 30,
  backgroundJobs: 25,
};

const ORG_DEFS = [
  { code: 'merchant-pro', legal: 'Merchant Pro Inc.', display: 'Merchant Pro', currency: 'USD', country: 'US', region: 1, status: 'active', tz: 'America/New_York' },
  { code: 'acme-financial', legal: 'Acme Financial Solutions Ltd.', display: 'Acme Financial', currency: 'GBP', country: 'GB', region: 2, status: 'active', tz: 'Europe/London' },
  { code: 'nova-commerce', legal: 'Nova Commerce Pte Ltd', display: 'Nova Commerce', currency: 'SGD', country: 'SG', region: 3, status: 'active', tz: 'Asia/Singapore' },
  { code: 'helix-payments', legal: 'Helix Payments GmbH', display: 'Helix Payments', currency: 'EUR', country: 'DE', region: 2, status: 'active', tz: 'Europe/Berlin' },
  { code: 'pacific-pay', legal: 'Pacific Pay Australia Pty Ltd', display: 'Pacific Pay', currency: 'AUD', country: 'AU', region: 3, status: 'active', tz: 'Australia/Sydney' },
  { code: 'maple-checkout', legal: 'Maple Checkout Corp.', display: 'Maple Checkout', currency: 'CAD', country: 'CA', region: 1, status: 'active', tz: 'America/Toronto' },
  { code: 'saffron-retail', legal: 'Saffron Retail India Pvt Ltd', display: 'Saffron Retail', currency: 'INR', country: 'IN', region: 3, status: 'pending', tz: 'Asia/Kolkata' },
  { code: 'atlas-travel', legal: 'Atlas Travel Holdings SA', display: 'Atlas Travel', currency: 'EUR', country: 'FR', region: 2, status: 'inactive', tz: 'Europe/Paris' },
];

const MERCHANT_NAMES = [
  'Velocity Global', 'Azure Dynamics', 'Prime Logistics', 'Global Logistics', 'Skyline Software',
  'Venture Retail', 'Health-E Corp', 'Singapore FinTech', 'Global Retail Corp', 'Nexus Trading',
  'Atlas Commerce', 'Pacific Ventures', 'EuroPay Solutions', 'Stellar Payments', 'FreshMart Grocers',
  'Urban Threads', 'CloudKitchen Co', 'MediCare Plus', 'EduLearn Academy', 'GameForge Studios',
  'TravelNest', 'SubStack Pro', 'DataPulse SaaS', 'GreenLeaf Organics', 'Metro Electronics',
  'FitLife Gym', 'BookHaven', 'PetCare Express', 'AutoParts Direct', 'LuxStay Hotels',
  'QuickBite Delivery', 'StyleHub Fashion', 'TechNova IT', 'Wellness Pharmacy', 'CraftBeer Co',
  'KidsWorld Toys', 'SolarGrid Energy', 'LegalEase Services', 'PhotoPrint Studio', 'MusicStream Plus',
];

const FIRST_NAMES = ['James', 'Maria', 'Robert', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Chris', 'Anna', 'Raj', 'Priya', 'Wei', 'Yuki', 'Olivia', 'Daniel', 'Sophie', 'Marcus', 'Elena', 'Ahmed', 'Fatima', 'Carlos', 'Ingrid', 'Kenji', 'Nina'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Patel', 'Kim', 'Chen', 'Nguyen', 'Singh', 'Mueller', 'Santos'];

const BUSINESS_TYPES = ['retail', 'healthcare', 'services', 'saas', 'fintech', 'logistics', 'other'];
const BUSINESS_CATEGORIES = ['Retail', 'Healthcare', 'Travel', 'Education', 'Food & Beverage', 'Gaming', 'Subscription', 'SaaS', 'E-commerce', 'Financial Services'];
const KYC_STATUSES = ['verified', 'verified', 'verified', 'pending', 'rejected'];
const RISK_LEVELS = ['low', 'low', 'medium', 'high'];
const MERCHANT_STATUSES = ['active', 'active', 'active', 'pending', 'suspended', 'inactive'];

const PAYMENT_METHODS = [
  { id: 1, label: 'Visa', detail: 'Visa ****' },
  { id: 1, label: 'Mastercard', detail: 'Mastercard ****' },
  { id: 2, label: 'UPI', detail: 'UPI @' },
  { id: 3, label: 'Bank Transfer', detail: 'ACH ****' },
  { id: 5, label: 'Wallet', detail: 'Digital Wallet' },
];

const TX_STATUS = { settled: 1, pending: 2, failed: 3, flagged: 4 };
const REFUND_STATUS = ['pending', 'approved', 'rejected', 'processed', 'failed'];
const DISPUTE_STATUS = ['open', 'evidence_required', 'under_review', 'representment_submitted', 'won', 'lost'];
const SETTLEMENT_STATUS = ['pending', 'processing', 'processed', 'failed', 'reversed'];
const PAYOUT_STATUS = ['pending', 'scheduled', 'processing', 'sent', 'confirmed', 'failed', 'cancelled'];

let seed = 42;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function pickN(arr, n) { const a = [...arr]; const r = []; for (let i = 0; i < n && a.length; i++) { r.push(a.splice(Math.floor(rand() * a.length), 1)[0]); } return r; }
function uuid(prefix, n) {
  const seg1 = (prefix + String(n).padStart(Math.max(0, 8 - prefix.length), '0')).slice(0, 8);
  const seg5 = String(n).padStart(12, '0').slice(-12);
  return `${seg1}-0000-4000-8000-${seg5}`;
}
function esc(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''"); }
function sqlDate(d) { return d.toISOString().slice(0, 19).replace('T', ' '); }
function daysAgo(n, hour = 12) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour + Math.floor(rand() * 8), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
  return d;
}

function txRef(seq) {
  const y = NOW.getFullYear();
  return `TXN-${y}-${String(100000 + seq).slice(1)}`;
}

function batchInsert(table, columns, rows, chunkSize = 400) {
  const lines = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    lines.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES`);
    lines.push(chunk.map((r) => (typeof r === 'string' ? `  ${r}` : `  (${r.join(', ')})`)).join(',\n') + ';');
    lines.push('');
  }
  return lines.join('\n');
}

const lines = [];
lines.push(`-- =============================================================================
-- 50_enterprise_demo_data.sql
-- Enterprise demo volume (auto-generated)
-- Regenerate: npm run db:generate-enterprise
-- Generated: ${NOW.toISOString()}
-- =============================================================================

USE fintech_db;

SET FOREIGN_KEY_CHECKS = 0;
`);

// Clear prior volume data (preserve RBAC infra from earlier seeds)
const truncateTables = [
  'settlement_transactions', 'settlement_adjustments', 'settlement_fees', 'settlement_bank_transfers',
  'settlement_status_history', 'settlement_notes', 'settlement_reversals',
  'refund_status_history', 'dispute_evidence', 'dispute_status_history',
  'payout_status_history', 'payment_link_transactions', 'invoice_line_items', 'invoice_payments',
  'subscription_invoices', 'qr_transactions', 'transaction_events', 'transaction_status_history',
  'transaction_fees', 'transaction_notes', 'transaction_attachments', 'transaction_exports',
  'support_ticket_notes', 'support_ticket_attachments', 'support_ticket_activities',
  'notification_deliveries', 'audit_metadata',
  'dashboard_export_jobs', 'activity_events', 'fraud_alerts',
  'revenue_time_series', 'payment_method_distribution', 'regional_distribution', 'dashboard_kpi_snapshots',
  'analytics_snapshots',
  'notifications', 'audit_logs', 'api_logs', 'webhook_logs',
  'support_tickets', 'subscriptions', 'subscription_plans', 'qr_codes',
  'invoices', 'payment_links', 'payouts', 'payout_batches',
  'transaction_refunds', 'transaction_disputes', 'settlements', 'settlement_batches',
  'transactions', 'customer_merchants', 'customer_addresses', 'customers',
  'merchant_tag_assignments', 'merchant_webhooks', 'merchant_api_credentials', 'merchant_payment_methods',
  'merchant_notes', 'merchant_documents', 'merchant_contacts', 'merchant_addresses',
  'merchant_settlement_accounts', 'merchant_bank_accounts', 'merchants',
  'background_jobs', 'retry_queue', 'operations_incidents', 'system_alerts',
  'user_dashboard_preferences',
  'organization_billing', 'organization_api_keys', 'organization_branding', 'organization_preferences',
  'organization_members', 'organization_domains', 'organization_contacts', 'organization_addresses',
  'organizations',
  'user_roles', 'login_history', 'user_activity_logs',
  'users',
];
for (const t of truncateTables) lines.push(`TRUNCATE TABLE ${t};`);
lines.push('');

// Users 1-80
const userRows = [];
const userRoles = [];
const roleMap = { admin: 1, finance: 3, support: 5, ops: 4, merchant: 6, readonly: 7 };
userRows.push(`(1, '${uuid('a1', 1)}', 'admin@merchantpro.com', '${PASSWORD_HASH}', 'Alex', 'Rivera', '+14155554921', NOW(), NOW(), 0, 'none', NULL, 'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 2 MINUTE))`);
userRoles.push('(1, 1, 1)');

const deptRoles = [
  ['finance', 3], ['finance', 3], ['support', 5], ['support', 5], ['ops', 4], ['ops', 4],
  ['merchant', 6], ['merchant', 6], ['readonly', 7],
];
for (let i = 2; i <= COUNTS.users; i++) {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  const dept = i <= 10 ? pick(Object.keys(roleMap)) : pick(['finance', 'support', 'ops', 'merchant', 'admin', 'readonly']);
  const email = i === 2 ? 'finance@merchantpro.com' : i === 3 ? 'readonly@merchantpro.com' : `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@merchantpro.com`;
  const status = i === 3 ? 'locked' : 'active';
  userRows.push(`(${i}, '${uuid('a1', i)}', '${esc(email)}', '${PASSWORD_HASH}', '${esc(fn)}', '${esc(ln)}', NULL, NOW(), NOW(), 0, 'none', NULL, '${status}', 0, NULL, DATE_SUB(NOW(), INTERVAL ${30 + (i % 60)} DAY), DATE_SUB(NOW(), INTERVAL ${i % 48} HOUR))`);
  userRoles.push(`(${i}, ${roleMap[dept] ?? 6}, 1)`);
}
lines.push(batchInsert('users', ['id', 'uuid', 'email', 'password_hash', 'first_name', 'last_name', 'phone_number', 'phone_verified_at', 'email_verified_at', 'mfa_enabled', 'mfa_method', 'totp_secret', 'status', 'failed_login_attempts', 'locked_until', 'password_changed_at', 'last_login_at'], userRows));
lines.push('INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES');
lines.push(userRoles.map((r) => `  ${r}`).join(',\n') + ';\n');

// Organizations 1-8
const orgRows = ORG_DEFS.map((o, i) => {
  const id = i + 1;
  return `(${id}, '${uuid('og', id)}', '${o.code}', '${esc(o.legal)}', '${esc(o.display)}', '${esc(o.display)}', 'TAX-${o.country}-${1000 + id}', 'Financial Services', 'https://${o.code.replace(/-/g, '')}.example', '${o.status}', '${o.display.slice(0, 2).toUpperCase()}', '#003ec7', '${o.currency}', '${o.tz}', 'en-US', '${o.country === 'US' ? 'North America' : o.country === 'GB' || o.country === 'DE' || o.country === 'FR' ? 'Europe' : 'Asia Pacific'}', 'Enterprise tenant ${esc(o.display)}.', 1)`;
});
lines.push(batchInsert('organizations', ['id', 'uuid', 'code', 'legal_name', 'display_name', 'dba_name', 'tax_id', 'industry', 'website', 'status', 'logo_initials', 'primary_color', 'base_currency', 'timezone', 'locale', 'primary_region', 'description', 'created_by'], orgRows));

const memberRows = [];
for (let o = 1; o <= COUNTS.orgs; o++) {
  memberRows.push(`(${o}, '${uuid('om', o)}', ${o}, 1, 1, 'active', ${o === 1 ? 1 : 0}, 1, NOW(), NOW())`);
}
lines.push(batchInsert('organization_members', ['id', 'uuid', 'organization_id', 'user_id', 'org_role_id', 'status', 'is_default', 'invited_by', 'joined_at', 'created_at'], memberRows));

// Merchants 1-120
const merchantRows = [];
const merchantOrg = (id) => Math.ceil(id / 15);
for (let m = 1; m <= COUNTS.merchants; m++) {
  const base = MERCHANT_NAMES[(m - 1) % MERCHANT_NAMES.length];
  const suffix = m > MERCHANT_NAMES.length ? ` ${Math.ceil(m / MERCHANT_NAMES.length)}` : '';
  const display = `${base}${suffix}`.trim();
  const code = `MCH-${String(10000 + m)}`;
  const bt = pick(BUSINESS_TYPES);
  const cat = pick(BUSINESS_CATEGORIES);
  const kyc = pick(KYC_STATUSES);
  const risk = pick(RISK_LEVELS);
  const st = pick(MERCHANT_STATUSES);
  const region = ORG_DEFS[merchantOrg(m) - 1].region;
  const onboardDays = 30 + Math.floor(rand() * (DAYS - 30));
  const tpv = (50000 + rand() * 5000000).toFixed(2);
  const daily = (tpv / 30).toFixed(2);
  merchantRows.push(`(${m}, '${uuid('m1', m)}', '${code}', '${esc(display)} LLC', '${esc(display)}', '${display.slice(0, 2).toUpperCase()}', 'primary', '${bt}', '${esc(cat)}', 'LLC', '${code}', 'https://${code.toLowerCase()}.example', ${tpv}, '${kyc}', '${risk}', '${st}', ${region}, ${daily}, ${(daily * 3).toFixed(2)}, DATE_SUB(NOW(), INTERVAL ${onboardDays} DAY), DATE_SUB(NOW(), INTERVAL ${onboardDays} DAY))`);
}
lines.push(batchInsert('merchants', ['id', 'uuid', 'merchant_code', 'legal_name', 'display_name', 'logo_initials', 'logo_color', 'business_type', 'business_category', 'entity_type', 'registration_number', 'website', 'monthly_tpv_estimate', 'kyc_status', 'risk_level', 'status', 'region_id', 'daily_volume', 'wallet_balance', 'onboarded_at', 'created_at'], merchantRows));

const bankRows = [];
const settleAcctRows = [];
const BANKS = ['Chase Bank', 'HSBC', 'DBS Bank', 'Deutsche Bank', 'Commonwealth Bank', 'TD Canada Trust', 'HDFC Bank', 'BNP Paribas'];
for (let m = 1; m <= COUNTS.merchants; m++) {
  const display = MERCHANT_NAMES[(m - 1) % MERCHANT_NAMES.length];
  bankRows.push(`(${m}, '${uuid('ba', m)}', ${m}, '${esc(display)} LLC', '${pick(BANKS)}', '****${String(1000 + (m % 9000)).slice(-4)}', NULL, NULL, 'USD', 1)`);
  settleAcctRows.push(`(${m}, '${uuid('ms', m)}', ${m}, ${m}, '${pick(['daily', 'weekly', 'monthly'])}', 'USD', 1)`);
}
lines.push(batchInsert('merchant_bank_accounts', ['id', 'uuid', 'merchant_id', 'account_holder', 'bank_name', 'account_number_masked', 'iban', 'swift_bic', 'currency', 'is_primary'], bankRows));
lines.push(batchInsert('merchant_settlement_accounts', ['id', 'uuid', 'merchant_id', 'bank_account_id', 'settlement_cycle', 'currency', 'is_active'], settleAcctRows));

// Customers 1-1500
const customerRows = [];
const customerMerchantLinks = [];
for (let c = 1; c <= COUNTS.customers; c++) {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  const display = `${fn} ${ln}`;
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${c}@email.example`;
  const orgId = 1 + (c % COUNTS.orgs);
  const merchantId = 1 + (c % COUNTS.merchants);
  const isVip = c <= 50;
  const isInactive = c > 1400;
  const status = isInactive ? 'inactive' : c > 1450 ? 'blocked' : 'active';
  const spent = isVip ? (5000 + rand() * 50000).toFixed(2) : (20 + rand() * 3000).toFixed(2);
  const txCount = isVip ? Math.floor(5 + rand() * 40) : Math.floor(rand() * 8);
  const kyc = pick(['verified', 'verified', 'pending', 'not_required']);
  customerRows.push(`(${c}, '${uuid('cu', c)}', 'cust-${String(c).padStart(5, '0')}', ${orgId}, ${merchantId}, 'individual', '${esc(fn)}', '${esc(ln)}', '${esc(display)}', '${esc(email)}', '+1-555-${String(1000 + (c % 9000)).slice(-4)}', '${status}', '${kyc}', '${isVip ? 'low' : pick(['low', 'medium'])}', ${pick([1, 2, 3])}, ${spent}, ${txCount}, ${txCount > 0 ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY)` : 'NULL'}, 1)`);
  if (txCount > 0) {
    customerMerchantLinks.push(`(${c}, ${merchantId}, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY), DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY), ${txCount}, ${spent})`);
  }
}
lines.push(batchInsert('customers', ['id', 'uuid', 'customer_code', 'organization_id', 'primary_merchant_id', 'customer_type', 'first_name', 'last_name', 'display_name', 'email', 'phone', 'status', 'kyc_status', 'risk_level', 'region_id', 'total_spent', 'transaction_count', 'last_transaction_at', 'created_by'], customerRows));
if (customerMerchantLinks.length) {
  lines.push(batchInsert('customer_merchants', ['customer_id', 'merchant_id', 'first_transaction_at', 'last_transaction_at', 'transaction_count', 'total_spent'], customerMerchantLinks, 500));
}

// Transactions 1-12000
const txRows = [];
const txMeta = [];
let dailyVolumes = Array.from({ length: DAYS + 1 }, (_, i) => {
  const growth = 1 + (DAYS - i) / DAYS * 0.4;
  const dow = daysAgo(i).getDay();
  const weekend = dow === 0 || dow === 6 ? 0.55 : 1;
  return Math.floor(45 * growth * weekend);
});
const totalWeight = dailyVolumes.reduce((a, b) => a + b, 0);
dailyVolumes = dailyVolumes.map((v) => Math.max(1, Math.round(v * COUNTS.transactions / totalWeight)));

let txSeq = 0;
for (let day = DAYS; day >= 0; day--) {
  const count = dailyVolumes[day] ?? 1;
  for (let j = 0; j < count && txSeq < COUNTS.transactions; j++) {
    txSeq++;
    const id = txSeq;
    const merchantId = 1 + Math.floor(Math.pow(rand(), 1.5) * COUNTS.merchants);
    const customerId = 1 + Math.floor(rand() * COUNTS.customers);
    const pm = pick(PAYMENT_METHODS);
    const statusRoll = rand();
    const statusId = statusRoll < 0.86 ? TX_STATUS.settled : statusRoll < 0.93 ? TX_STATUS.pending : statusRoll < 0.98 ? TX_STATUS.failed : TX_STATUS.flagged;
    const baseAmt = 15 + Math.exp(rand() * 6) * 8;
    const amount = Math.round(baseAmt * 100) / 100;
    const fee = Math.round(amount * (0.018 + rand() * 0.012) * 100) / 100;
    const net = Math.round((amount - fee) * 100) / 100;
    const hour = 8 + Math.floor(rand() * 12);
    const processed = daysAgo(day, hour);
    const settled = statusId === TX_STATUS.settled ? new Date(processed.getTime() + 3600000) : null;
    const region = merchantOrg(merchantId) <= 2 ? 1 : merchantOrg(merchantId) <= 5 ? 2 : 3;
    const isHigh = amount >= 5000 ? 1 : 0;
    const ref = txRef(id);
    const cardNum = String(1000 + Math.floor(rand() * 9000));
    txRows.push(`(${id}, '${uuid('tx', id)}', '${ref}', ${merchantId}, ${customerId}, '${esc(pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES))}', 'cust-${String(customerId).padStart(5, '0')}@email.example', 'Payment for order #${10000 + id}', ${amount.toFixed(2)}, ${fee.toFixed(2)}, ${net.toFixed(2)}, 'USD', ${pm.id}, '${esc(pm.detail + cardNum)}', ${statusId}, ${region}, ${isHigh}, '${sqlDate(processed)}', ${settled ? `'${sqlDate(settled)}'` : 'NULL'})`);
    txMeta.push({ id, merchantId, customerId, amount, statusId, processed, fee, net, pmId: pm.id });
  }
}
// Pad to exact transaction target
while (txSeq < COUNTS.transactions) {
  txSeq++;
  const id = txSeq;
  const merchantId = 1 + Math.floor(Math.pow(rand(), 1.5) * COUNTS.merchants);
  const customerId = 1 + Math.floor(rand() * COUNTS.customers);
  const pm = pick(PAYMENT_METHODS);
  const statusId = TX_STATUS.settled;
  const amount = Math.round((15 + Math.exp(rand() * 6) * 8) * 100) / 100;
  const fee = Math.round(amount * (0.018 + rand() * 0.012) * 100) / 100;
  const net = Math.round((amount - fee) * 100) / 100;
  const processed = daysAgo(0, 10);
  const settled = new Date(processed.getTime() + 3600000);
  const region = merchantOrg(merchantId) <= 2 ? 1 : merchantOrg(merchantId) <= 5 ? 2 : 3;
  const ref = txRef(id);
  const cardNum = String(1000 + Math.floor(rand() * 9000));
  txRows.push(`(${id}, '${uuid('tx', id)}', '${ref}', ${merchantId}, ${customerId}, '${esc(pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES))}', 'cust-${String(customerId).padStart(5, '0')}@email.example', 'Payment for order #${10000 + id}', ${amount.toFixed(2)}, ${fee.toFixed(2)}, ${net.toFixed(2)}, 'USD', ${pm.id}, '${esc(pm.detail + cardNum)}', ${statusId}, ${region}, 0, '${sqlDate(processed)}', '${sqlDate(settled)}')`);
  txMeta.push({ id, merchantId, customerId, amount, statusId, processed, fee, net, pmId: pm.id });
}

lines.push(batchInsert('transactions', ['id', 'uuid', 'transaction_ref', 'merchant_id', 'customer_id', 'customer_name', 'customer_email', 'description', 'amount', 'fee_amount', 'net_amount', 'currency', 'payment_method_type_id', 'payment_method_detail', 'status_id', 'region_id', 'is_high_value', 'processed_at', 'settled_at'], txRows, 300));

// Refunds 250
const settledTx = txMeta.filter((t) => t.statusId === TX_STATUS.settled);
const refundRows = [];
const refundHistory = [];
for (let r = 1; r <= COUNTS.refunds; r++) {
  const tx = settledTx[Math.floor(rand() * settledTx.length)];
  const isPartial = rand() < 0.35;
  const amt = isPartial ? Math.round(tx.amount * (0.2 + rand() * 0.5) * 100) / 100 : tx.amount;
  const st = pick(['pending', 'approved', 'rejected', 'processed', 'processed', 'processed']);
  const ref = `REF-${NOW.getFullYear()}-${String(20000 + r)}`;
  refundRows.push(`(${r}, '${uuid('rf', r)}', ${tx.id}, ${tx.merchantId}, ${tx.customerId}, '${ref}', '${isPartial ? 'partial' : 'full'}', ${amt.toFixed(2)}, 'USD', '${esc(pick(['Customer return', 'Duplicate charge', 'Service not delivered', 'Billing error', 'Product defect']))}', '${st}', 1, ${st === 'processed' || st === 'approved' ? 1 : 'NULL'}, ${st === 'processed' ? `'${sqlDate(daysAgo(Math.floor(rand() * 60)))}'` : 'NULL'}, 1)`);
}
lines.push(batchInsert('transaction_refunds', ['id', 'uuid', 'transaction_id', 'merchant_id', 'customer_id', 'refund_ref', 'refund_type', 'amount', 'currency', 'reason', 'status', 'requested_by', 'approved_by', 'processed_at', 'created_by'], refundRows));

// Chargebacks 80
const chargebackRows = [];
for (let d = 1; d <= COUNTS.chargebacks; d++) {
  const tx = settledTx[Math.floor(rand() * settledTx.length)];
  const st = pick(DISPUTE_STATUS);
  const ref = `CB-${NOW.getFullYear()}-${String(30000 + d)}`;
  const reason = pick(['fraud', 'product_not_received', 'duplicate', 'subscription_cancelled']);
  chargebackRows.push(`(${d}, '${uuid('cb', d)}', ${tx.id}, ${tx.merchantId}, ${tx.customerId}, '${ref}', '${esc(pick(['Unauthorized charge', 'Product not received', 'Duplicate billing', 'Subscription dispute']))}', '${reason}', '${pick(['visa', 'mastercard', 'amex'])}', '${st}', ${Math.min(tx.amount, tx.amount).toFixed(2)}, 'USD', ${st === 'open' ? 'DATE_ADD(NOW(), INTERVAL 7 DAY)' : 'NULL'}, 1)`);
}
lines.push(batchInsert('transaction_disputes', ['id', 'uuid', 'transaction_id', 'merchant_id', 'customer_id', 'dispute_ref', 'reason', 'reason_code', 'card_network', 'status', 'amount', 'currency', 'evidence_due_at', 'created_by'], chargebackRows));

// Settlements 800 — create batches first
const batchRows = [];
for (let b = 1; b <= 16; b++) {
  batchRows.push(`(${b}, '${uuid('sb', b)}', 'SBATCH-${NOW.getFullYear()}-${String(1000 + b)}', '${pick(['pending', 'processing', 'completed', 'completed'])}', ${(50000 + rand() * 500000).toFixed(2)}, ${Math.floor(COUNTS.settlements / 16)}, 'USD', DATE_SUB(NOW(), INTERVAL ${b * 7} DAY), ${b % 2 === 0 ? `DATE_SUB(NOW(), INTERVAL ${b * 7 - 1} DAY)` : 'NULL'}, 1)`);
}
lines.push(batchInsert('settlement_batches', ['id', 'uuid', 'batch_ref', 'status', 'total_amount', 'settlement_count', 'currency', 'scheduled_at', 'processed_at', 'created_by'], batchRows));

const settlementRows = [];
const settlementTxLinks = [];
for (let s = 1; s <= COUNTS.settlements; s++) {
  const merchantId = 1 + ((s - 1) % COUNTS.merchants);
  const gross = (500 + rand() * 250000).toFixed(2);
  const fee = (parseFloat(gross) * 0.025).toFixed(2);
  const net = (parseFloat(gross) - parseFloat(fee)).toFixed(2);
  const st = pick(SETTLEMENT_STATUS);
  const ref = `STL-${NOW.getFullYear()}-${String(40000 + s)}`;
  const daysBack = Math.floor((s / COUNTS.settlements) * DAYS);
  const batchId = Math.ceil(s / 50);
  settlementRows.push(`(${s}, '${uuid('st', s)}', '${ref}', ${merchantId}, ${batchId}, ${gross}, ${fee}, 0.00, ${net}, 'USD', '${st}', '${pick(['daily', 'weekly', 'monthly'])}', DATE_SUB(NOW(), INTERVAL ${daysBack} DAY), ${st === 'processed' ? `DATE_SUB(NOW(), INTERVAL ${Math.max(0, daysBack - 1)} DAY)` : 'NULL'}, 1)`);
  const tx = settledTx[(s * 7) % settledTx.length];
  if (tx) settlementTxLinks.push(`(${s}, ${tx.id}, ${tx.amount.toFixed(2)})`);
}
lines.push(batchInsert('settlements', ['id', 'uuid', 'settlement_ref', 'merchant_id', 'batch_id', 'gross_amount', 'fee_amount', 'adjustment_amount', 'amount', 'currency', 'status', 'settlement_cycle', 'scheduled_at', 'processed_at', 'created_by'], settlementRows, 200));
lines.push(batchInsert('settlement_transactions', ['settlement_id', 'transaction_id', 'amount'], settlementTxLinks, 500));

// Payouts 500
const payoutRows = [];
for (let p = 1; p <= COUNTS.payouts; p++) {
  const merchantId = 1 + ((p - 1) % COUNTS.merchants);
  const settlementId = p <= COUNTS.settlements ? p : 'NULL';
  const amt = (200 + rand() * 150000).toFixed(2);
  const st = pick(PAYOUT_STATUS);
  const ref = `PO-${NOW.getFullYear()}-${String(50000 + p)}`;
  payoutRows.push(`(${p}, '${uuid('po', p)}', '${ref}', ${merchantId}, ${settlementId}, NULL, NULL, ${amt}, ${(parseFloat(amt) * 0.004).toFixed(2)}, 'USD', '${pick(['manual', 'scheduled'])}', 'bank_transfer', '${st}', ${st === 'confirmed' ? `'PO-TX-${500000 + p}'` : 'NULL'}, ${st === 'failed' ? `'Bank transfer rejected - invalid account details'` : 'NULL'}, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY), ${st === 'confirmed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY)` : 'NULL'}, ${st === 'confirmed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY)` : 'NULL'}, ${st !== 'pending' ? 1 : 'NULL'}, ${st !== 'pending' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY)` : 'NULL'}, 1)`);
}
lines.push(batchInsert('payouts', ['id', 'uuid', 'payout_ref', 'merchant_id', 'settlement_id', 'bank_account_id', 'batch_id', 'amount', 'fee_amount', 'currency', 'payout_type', 'payout_method', 'status', 'transfer_ref', 'failure_reason', 'scheduled_at', 'processed_at', 'confirmed_at', 'approved_by', 'approved_at', 'created_by'], payoutRows, 200));

// Payment links 300
const plRows = [];
const plMeta = [];
for (let pl = 1; pl <= COUNTS.paymentLinks; pl++) {
  const merchantId = 1 + (pl % COUNTS.merchants);
  const st = pick(['active', 'active', 'disabled', 'expired']);
  const amt = (10 + rand() * 5000).toFixed(2);
  plRows.push(`(${pl}, '${uuid('pl', pl)}', ${1 + (pl % COUNTS.orgs)}, ${merchantId}, ${1 + (pl % COUNTS.customers)}, 'PL-${String(60000 + pl)}', '${esc(pick(BUSINESS_CATEGORIES))} checkout', 'Secure payment link for ${esc(pick(BUSINESS_CATEGORIES))} services', ${amt}, 'USD', 0, ${st === 'expired' ? 'DATE_SUB(NOW(), INTERVAL 30 DAY)' : 'DATE_ADD(NOW(), INTERVAL 30 DAY)'}, NULL, 0, '${st}', 'pltok-${String(pl).padStart(8, '0')}', NULL, NULL, NULL, 1)`);
  plMeta.push({ id: pl, status: st });
}
lines.push(batchInsert('payment_links', ['id', 'uuid', 'organization_id', 'merchant_id', 'customer_id', 'link_ref', 'title', 'description', 'amount', 'currency', 'allow_custom_amount', 'expires_at', 'max_usage', 'current_usage', 'status', 'public_token', 'redirect_url', 'success_url', 'cancel_url', 'created_by'], plRows, 200));

// Invoices 600
const invRows = [];
const invLineRows = [];
const invMeta = [];
for (let inv = 1; inv <= COUNTS.invoices; inv++) {
  const merchantId = 1 + (inv % COUNTS.merchants);
  const customerId = 1 + (inv % COUNTS.customers);
  const subtotal = (100 + rand() * 25000).toFixed(2);
  const tax = (parseFloat(subtotal) * 0.08).toFixed(2);
  const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
  const st = pick(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'paid', 'overdue', 'cancelled']);
  const num = `INV-${NOW.getFullYear()}-${String(70000 + inv)}`;
  const paid = st === 'paid' ? total : st === 'partially_paid' ? (parseFloat(total) * 0.5).toFixed(2) : '0.00';
  const balance = (parseFloat(total) - parseFloat(paid)).toFixed(2);
  const issueDays = Math.floor(rand() * DAYS);
  invRows.push(`(${inv}, '${uuid('in', inv)}', ${1 + (inv % COUNTS.orgs)}, ${merchantId}, ${customerId}, NULL, '${num}', NULL, DATE_SUB(CURDATE(), INTERVAL ${issueDays} DAY), DATE_ADD(CURDATE(), INTERVAL ${14 + (inv % 30)} DAY), 'USD', '${st}', NULL, NULL, ${subtotal}, ${tax}, 0.00, ${total}, ${paid}, ${balance}, ${st === 'sent' || st === 'paid' ? `DATE_SUB(NOW(), INTERVAL ${issueDays} DAY)` : 'NULL'}, ${st === 'viewed' || st === 'paid' ? `DATE_SUB(NOW(), INTERVAL ${Math.max(0, issueDays - 1)} DAY)` : 'NULL'}, ${st === 'paid' ? `DATE_SUB(NOW(), INTERVAL ${Math.max(0, issueDays - 2)} DAY)` : 'NULL'}, 1)`);
  invLineRows.push(`(${inv}, 0, '${esc('Professional services — billing period ' + inv)}', 1.0000, ${subtotal}, 0.00, 0.00, ${subtotal})`);
  invMeta.push({ id: inv, status: st, total });
}
lines.push(batchInsert('invoices', ['id', 'uuid', 'organization_id', 'merchant_id', 'customer_id', 'payment_link_id', 'invoice_number', 'reference_number', 'issue_date', 'due_date', 'currency', 'status', 'notes', 'internal_notes', 'subtotal', 'tax_amount', 'discount_amount', 'total', 'amount_paid', 'balance_due', 'sent_at', 'viewed_at', 'paid_at', 'created_by'], invRows, 200));
lines.push(batchInsert('invoice_line_items', ['invoice_id', 'sort_order', 'description', 'quantity', 'unit_price', 'tax_amount', 'discount_amount', 'line_total'], invLineRows, 400));

// Subscriptions 250
const planRows = [
  `(1, '${uuid('sp', 1)}', 1, 1, 'PLAN-STARTER', 'Starter Monthly', 'Starter plan for SMB merchants', 29.99, 'USD', 'monthly', 14, 'active', 1)`,
  `(2, '${uuid('sp', 2)}', 1, 2, 'PLAN-PRO', 'Pro Quarterly', 'Professional quarterly billing', 79.99, 'USD', 'quarterly', 7, 'active', 1)`,
  `(3, '${uuid('sp', 3)}', 1, 3, 'PLAN-ENT', 'Enterprise Annual', 'Enterprise annual contract', 999.00, 'USD', 'yearly', 0, 'active', 1)`,
];
lines.push(`INSERT INTO subscription_plans (id, uuid, organization_id, merchant_id, plan_code, name, description, price, currency, billing_interval, trial_days, status, created_by) VALUES\n  ${planRows.join(',\n  ')};\n`);

const subRows = [];
for (let s = 1; s <= COUNTS.subscriptions; s++) {
  const planId = 1 + (s % 3);
  const st = pick(['active', 'active', 'paused', 'cancelled', 'failed', 'renewed']);
  const startDays = Math.floor(rand() * DAYS);
  subRows.push(`(${s}, '${uuid('sb', s)}', ${1 + (s % COUNTS.orgs)}, ${1 + (s % COUNTS.merchants)}, ${1 + (s % COUNTS.customers)}, ${planId}, 'SUB-${String(80000 + s)}', '${st}', DATE_SUB(CURDATE(), INTERVAL ${startDays} DAY), ${st === 'cancelled' ? `DATE_SUB(CURDATE(), INTERVAL ${Math.floor(rand() * 30)} DAY)` : 'NULL'}, NULL, DATE_ADD(CURDATE(), INTERVAL ${30 - (s % 28)} DAY), DATE_SUB(CURDATE(), INTERVAL ${startDays % 30} DAY), DATE_ADD(CURDATE(), INTERVAL ${30 - (s % 28)} DAY), NULL, ${s % 12}, 1)`);
}
lines.push(batchInsert('subscriptions', ['id', 'uuid', 'organization_id', 'merchant_id', 'customer_id', 'plan_id', 'subscription_ref', 'status', 'start_date', 'end_date', 'trial_end_date', 'next_billing_date', 'current_period_start', 'current_period_end', 'payment_link_id', 'renewal_count', 'created_by'], subRows, 200));

// QR codes 80
const qrRows = [];
const qrTypes = ['static', 'dynamic', 'merchant', 'customer'];
for (let q = 1; q <= COUNTS.qrCodes; q++) {
  const merchantId = 1 + (q % COUNTS.merchants);
  const st = pick(['active', 'active', 'disabled']);
  const amt = (5 + rand() * 2500).toFixed(2);
  qrRows.push(`(${q}, '${uuid('qr', q)}', ${1 + (q % COUNTS.orgs)}, ${merchantId}, ${q % 4 === 0 ? 1 + (q % COUNTS.customers) : 'NULL'}, 'QR-${String(85000 + q)}', '${pick(qrTypes)}', '${esc(pick(BUSINESS_CATEGORIES))} counter payment', 'Scan to pay at ${esc(pick(MERCHANT_NAMES))}', ${amt}, 'USD', 0, ${st === 'disabled' ? 'DATE_SUB(NOW(), INTERVAL 5 DAY)' : 'DATE_ADD(NOW(), INTERVAL 60 DAY)'}, ${Math.floor(rand() * 50)}, '${st}', 'qrtok-${String(q).padStart(8, '0')}', 1)`);
}
lines.push(batchInsert('qr_codes', ['id', 'uuid', 'organization_id', 'merchant_id', 'customer_id', 'qr_ref', 'qr_type', 'title', 'description', 'amount', 'currency', 'allow_custom_amount', 'expires_at', 'scan_count', 'status', 'public_token', 'created_by'], qrRows, 100));

// Support tickets 300
const ticketRows = [];
for (let t = 1; t <= COUNTS.supportTickets; t++) {
  const st = pick(['open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'closed']);
  const pri = pick(['low', 'medium', 'high', 'urgent']);
  ticketRows.push(`(${t}, '${uuid('tk', t)}', ${1 + (t % COUNTS.orgs)}, ${1 + (t % COUNTS.merchants)}, ${t % 3 === 0 ? 1 + (t % COUNTS.customers) : 'NULL'}, 'TKT-${String(90000 + t)}', '${esc(pick(['Settlement delay', 'Refund status inquiry', 'API integration issue', 'Chargeback evidence', 'Payout failure']))}', '${esc(pick(['Merchant reported delayed settlement batch.', 'Customer waiting on refund approval.', 'Webhook delivery failures since Tuesday.', 'Need help uploading chargeback documents.']))}', '${pick(['billing', 'settlements', 'technical', 'chargebacks', 'general'])}', '${st}', '${pri}', DATE_ADD(NOW(), INTERVAL ${1 + (t % 5)} DAY), 0, ${st === 'open' ? 'NULL' : 1}, NULL, NULL, 0, NULL, NULL, ${st === 'closed' || st === 'resolved' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'}, ${st === 'closed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 7)} DAY)` : 'NULL'}, 1)`);
}
lines.push(batchInsert('support_tickets', ['id', 'uuid', 'organization_id', 'merchant_id', 'customer_id', 'ticket_ref', 'subject', 'description', 'category', 'status', 'priority', 'sla_due_at', 'sla_breached', 'assigned_to', 'escalated_at', 'escalated_to', 'escalation_level', 'related_entity_type', 'related_entity_id', 'resolved_at', 'closed_at', 'created_by'], ticketRows, 200));

// Audit logs 5000 — diverse actions
const auditRows = [];
const AUDIT_DEFS = [
  ['login', 'auth', 'auth', 'user'], ['logout', 'auth', 'auth', 'user'],
  ['password_changed', 'auth', 'security', 'user'], ['dashboard_access', 'dashboard', 'auth', 'setting'],
  ['ai_chat_query', 'ai', 'system', 'setting'], ['merchant_update', 'merchants', 'merchants', 'merchant'],
  ['customer_update', 'customers', 'customers', 'user'], ['settlement_processed', 'settlements', 'transactions', 'settlement'],
  ['refund_approve', 'transactions', 'transactions', 'refund'], ['chargeback_decision', 'transactions', 'transactions', 'refund'],
  ['role_update', 'roles', 'roles', 'role'], ['permission_change', 'roles', 'roles', 'role'],
  ['user_create', 'users', 'auth', 'user'], ['report_generate', 'reports', 'reports', 'setting'],
  ['report_export', 'reports', 'reports', 'setting'], ['payout_sent', 'payouts', 'transactions', 'transaction'],
];
for (let a = 1; a <= COUNTS.auditLogs; a++) {
  const [action, module, category, entity] = AUDIT_DEFS[a % AUDIT_DEFS.length];
  const userId = 1 + (a % COUNTS.users);
  const daysBack = Math.floor((a / COUNTS.auditLogs) * DAYS);
  auditRows.push(`(${a}, '${uuid('al', a)}', '${uuid('co', a)}', ${userId}, NULL, NULL, '${module}', '${category}', '${action}', '${entity}', '${1 + (a % 500)}', '${esc(action.replace(/_/g, ' '))} recorded for enterprise audit trail.', '192.168.1.${a % 255}', 'Mozilla/5.0 Enterprise Demo', '${pick(['low', 'medium', 'high'])}', NULL, NULL, DATE_SUB(NOW(6), INTERVAL ${daysBack} DAY))`);
}
lines.push(batchInsert('audit_logs', ['id', 'uuid', 'correlation_id', 'user_id', 'actor_name', 'session_id', 'module', 'category_code', 'action_code', 'entity_type', 'entity_id', 'description', 'ip_address', 'user_agent', 'risk_level', 'before_values', 'after_values', 'created_at'], auditRows, 400));

// Notifications 1000 — expanded categories
const notifRows = [];
const NOTIF_DEFS = [
  ['password_changed', 'security', 'Password updated on your account'],
  ['settlement_completed', 'financial', 'Settlement batch processed successfully'],
  ['refund_processed', 'financial', 'Refund approved and processed'],
  ['payment_failed', 'financial', 'Payment attempt failed'],
  ['merchant_approved', 'merchant', 'Merchant account approved'],
  ['ticket_assigned', 'support', 'Support ticket assigned to you'],
  ['system_announcement', 'system', 'Scheduled maintenance this weekend'],
  ['ai_insight', 'system', 'AI revenue insight available'],
  ['fraud_alert', 'security', 'Fraud monitoring alert'],
  ['incident_opened', 'system', 'Operations incident opened'],
];
for (let n = 1; n <= COUNTS.notifications; n++) {
  const userId = 1 + (n % 20);
  const [ev, cat, title] = NOTIF_DEFS[n % NOTIF_DEFS.length];
  const st = n % 3 === 0 ? 'read' : 'unread';
  notifRows.push(`(${n}, '${uuid('nt', n)}', ${userId}, '${ev}', '${cat}', '${esc(title)}', 'Notification body for enterprise demo record ${n}.', '${pick(['low', 'normal', 'high', 'urgent'])}', '${st}', 'info', '/dashboard', 'View', NULL, NULL, NULL, NULL, NULL, ${st === 'read' ? `DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'}, NULL, DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
}
lines.push(batchInsert('notifications', ['id', 'uuid', 'user_id', 'event_code', 'category', 'title', 'body', 'priority', 'status', 'icon', 'action_url', 'action_label', 'metadata_json', 'related_entity_type', 'related_entity_id', 'group_id', 'broadcast_id', 'read_at', 'archived_at', 'created_at'], notifRows, 400));

// Dashboard aggregates from transaction meta
const totalRevenue = txMeta.reduce((s, t) => s + (t.statusId === TX_STATUS.settled ? t.amount : 0), 0);
const totalTx = txMeta.length;
const successRate = ((txMeta.filter((t) => t.statusId === TX_STATUS.settled).length / totalTx) * 100).toFixed(2);

const pmCounts = { 1: 0, 2: 0, 3: 0, 5: 0 };
const pmAmounts = { 1: 0, 2: 0, 3: 0, 5: 0 };
for (const t of txMeta) {
  const pm = t.pmId ?? 1;
  pmCounts[pm] = (pmCounts[pm] ?? 0) + 1;
  pmAmounts[pm] = (pmAmounts[pm] ?? 0) + t.amount;
}
const regVol = { 1: 0, 2: 0, 3: 0 };
for (const t of txMeta) {
  const r = 1 + (t.merchantId % 3);
  regVol[r] += t.amount;
}

// Activity events
const actRows = [];
for (let e = 1; e <= 120; e++) {
  actRows.push(`(${e}, '${uuid('ae', e)}', ${pick([1, 2, 3, 4])}, '${esc(pick(['Merchant onboarded', 'Settlement processed', 'Risk alert triggered', 'System update applied']))}', 'Enterprise activity event ${e}', ${1 + (e % COUNTS.users)}, ${1 + (e % COUNTS.merchants)}, ${e % 5 === 0 ? 1 + (e % COUNTS.settlements) : 'NULL'}, NULL, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
}
lines.push(batchInsert('activity_events', ['id', 'uuid', 'event_type_id', 'title', 'description', 'actor_user_id', 'merchant_id', 'settlement_id', 'metadata', 'occurred_at'], actRows, 100));

appendEnterprisePolish({
  lines, batchInsert, COUNTS, DAYS, NOW, txMeta, settledTx, uuid, esc, pick, rand, daysAgo, sqlDate,
  TX_STATUS, MERCHANT_NAMES, FIRST_NAMES, LAST_NAMES, BUSINESS_CATEGORIES, PAYMENT_METHODS,
  totalRevenue, totalTx, successRate, invMeta, plMeta, pmCounts, pmAmounts, regVol,
});

// Operations: system alerts, incidents, retry queue, background jobs
const alertRows = [];
const ALERT_TYPES = ['webhook_failure', 'settlement_delay', 'api_rate_limit', 'payout_failure', 'fraud_spike', 'db_connection'];
for (let sa = 1; sa <= COUNTS.systemAlerts; sa++) {
  const st = pick(['active', 'active', 'acknowledged', 'resolved']);
  alertRows.push(`(${sa}, '${uuid('sy', sa)}', ${1 + (sa % COUNTS.orgs)}, '${pick(ALERT_TYPES)}', '${pick(['info', 'warning', 'error', 'critical'])}', '${esc(pick(['Webhook delivery failures', 'Settlement batch delayed', 'API rate limit exceeded', 'Payout processing error', 'Fraud velocity spike', 'Database connection pool exhausted']))}', 'Automated monitoring alert ${sa} for operations review.', 'system', '${st}', ${sa % 3 === 0 ? "'transactions'" : 'NULL'}, ${sa % 3 === 0 ? `'${1 + (sa % 500)}'` : 'NULL'}, ${st === 'acknowledged' || st === 'resolved' ? 1 : 'NULL'}, ${st !== 'active' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 7)} DAY)` : 'NULL'}, ${st === 'resolved' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 3)} DAY)` : 'NULL'})`);
}
lines.push(batchInsert('system_alerts', ['id', 'uuid', 'organization_id', 'alert_type', 'severity', 'title', 'message', 'source', 'status', 'related_entity_type', 'related_entity_id', 'acknowledged_by', 'acknowledged_at', 'resolved_at'], alertRows, 50));

const incidentRows = [];
for (let inc = 1; inc <= COUNTS.incidents; inc++) {
  const st = pick(['open', 'investigating', 'mitigated', 'resolved', 'closed']);
  incidentRows.push(`(${inc}, '${uuid('oi', inc)}', ${1 + (inc % COUNTS.orgs)}, 'INC-${NOW.getFullYear()}-${String(1000 + inc)}', '${esc(pick(['Payment gateway latency spike', 'Settlement processor outage', 'Webhook delivery degradation', 'Database replication lag', 'API authentication failures']))}', '${esc(pick(['Elevated response times on payment API endpoints.', 'Settlement batch processing delayed by 45 minutes.', 'Webhook retry queue backing up.', 'Read replica lag exceeding 30 seconds.']))}', '${pick(['low', 'medium', 'high', 'critical'])}', '${st}', '${esc(pick(['Partial merchant impact', 'All merchants affected', 'Single region impact', 'No customer impact']))}', DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 60)} DAY), ${st === 'resolved' || st === 'closed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'}, 1, 1)`);
}
lines.push(batchInsert('operations_incidents', ['id', 'uuid', 'organization_id', 'incident_ref', 'title', 'description', 'severity', 'status', 'impact_summary', 'started_at', 'resolved_at', 'created_by', 'updated_by'], incidentRows, 30));

const retryRows = [];
const RETRY_OPS = ['webhook_delivery', 'settlement_process', 'payout_transfer', 'refund_process'];
for (let rq = 1; rq <= COUNTS.retryQueue; rq++) {
  const st = pick(['pending', 'processing', 'completed', 'failed', 'cancelled']);
  retryRows.push(`(${rq}, '${uuid('rq', rq)}', ${1 + (rq % COUNTS.orgs)}, '${pick(['transaction', 'payout', 'settlement', 'webhook'])}', '${1 + (rq % 500)}', '${pick(RETRY_OPS)}', '${st}', ${Math.floor(rand() * 3)}, 3, ${st === 'failed' ? `'Connection timeout after 30s'` : 'NULL'}, NULL, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY), ${st === 'completed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 7)} DAY)` : 'NULL'})`);
}
lines.push(batchInsert('retry_queue', ['id', 'uuid', 'organization_id', 'entity_type', 'entity_id', 'operation', 'status', 'attempt_count', 'max_attempts', 'last_error', 'payload', 'scheduled_at', 'processed_at'], retryRows, 50));

const jobRows = [];
const JOB_TYPES = ['settlement_batch', 'report_export', 'analytics_snapshot', 'notification_dispatch', 'data_sync'];
for (let jb = 1; jb <= COUNTS.backgroundJobs; jb++) {
  const st = pick(['queued', 'running', 'completed', 'failed', 'cancelled']);
  jobRows.push(`(${jb}, '${uuid('bj', jb)}', ${1 + (jb % COUNTS.orgs)}, '${pick(JOB_TYPES)}', '${st}', NULL, NULL, ${st === 'failed' ? `'Job execution failed: resource unavailable'` : 'NULL'}, ${st !== 'queued' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 7)} DAY)` : 'NULL'}, ${st === 'completed' || st === 'failed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 5)} DAY)` : 'NULL'})`);
}
lines.push(batchInsert('background_jobs', ['id', 'uuid', 'organization_id', 'job_type', 'status', 'payload', 'result', 'error_message', 'started_at', 'completed_at'], jobRows, 30));

// User dashboard preferences for admin/finance users
const prefRows = [];
for (let u = 1; u <= 10; u++) {
  prefRows.push(`(${u}, '${pick(['daily', 'weekly', 'monthly'])}', NULL, NULL, ${50000 + u * 1000}.00, ${pick([10, 25, 50])})`);
}
lines.push(`INSERT INTO user_dashboard_preferences (user_id, default_date_range, custom_date_from, custom_date_to, high_value_threshold, table_page_size) VALUES\n  ${prefRows.join(',\n  ')};\n`);

// Merchant addresses + contacts (detail pages)
const addrRows = [];
const contactRows = [];
const CITIES = ['New York', 'London', 'Singapore', 'Berlin', 'Sydney', 'Toronto', 'Mumbai', 'Paris'];
for (let m = 1; m <= COUNTS.merchants; m++) {
  const display = MERCHANT_NAMES[(m - 1) % MERCHANT_NAMES.length];
  addrRows.push(`(${m}, '${uuid('ma', m)}', ${m}, 'registered', '${100 + m} Commerce Street', 'Suite ${200 + (m % 50)}', '${pick(CITIES)}', 'State ${m % 50}', '${10000 + m}', 'US', 1)`);
  contactRows.push(`(${m}, '${uuid('mc', m)}', ${m}, 'primary', '${pick(FIRST_NAMES)}', '${pick(LAST_NAMES)}', 'contact@${display.toLowerCase().replace(/\s+/g, '')}.example', '+1-555-${String(2000 + m).slice(-4)}', 'Operations Manager', 1)`);
}
lines.push(batchInsert('merchant_addresses', ['id', 'uuid', 'merchant_id', 'address_type', 'line1', 'line2', 'city', 'state_province', 'postal_code', 'country_code', 'is_primary'], addrRows, 200));
lines.push(batchInsert('merchant_contacts', ['id', 'uuid', 'merchant_id', 'contact_type', 'first_name', 'last_name', 'email', 'phone', 'job_title', 'is_primary'], contactRows, 200));

// Support ticket notes
const noteRows = [];
for (let n = 1; n <= 240; n++) {
  noteRows.push(`(${n}, ${1 + (n % COUNTS.supportTickets)}, ${1 + (n % 10)}, '${esc(pick(['Investigating merchant report.', 'Requested additional documentation.', 'Escalated to finance team.', 'Issue resolved — closing ticket.', 'Customer confirmed fix applied.']))}', ${n % 4 === 0 ? 0 : 1})`);
}
lines.push(batchInsert('support_ticket_notes', ['id', 'ticket_id', 'author_id', 'body', 'is_internal'], noteRows, 200));

// API + webhook logs
const apiRows = [];
const paths = ['/api/v1/transactions', '/api/v1/merchants', '/api/v1/settlements', '/api/v1/refunds', '/api/v1/dashboard/kpi'];
for (let a = 1; a <= 150; a++) {
  apiRows.push(`(${a}, '${uuid('ap', a)}', '${uuid('co', a + 9000)}', ${1 + (a % COUNTS.users)}, '${pick(['GET', 'POST', 'PUT'])}', '${pick(paths)}', ${pick([200, 200, 201, 400, 401, 500])}, '192.168.1.${a % 255}', 'MerchantPro-API/1.0', ${50 + Math.floor(rand() * 800)}, DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
}
lines.push(batchInsert('api_logs', ['id', 'uuid', 'correlation_id', 'user_id', 'method', 'path', 'status_code', 'ip_address', 'user_agent', 'response_time_ms', 'created_at'], apiRows, 100));

const whRows = [];
for (let w = 1; w <= 60; w++) {
  whRows.push(`(${w}, '${uuid('wh', w)}', '${uuid('co', w + 9500)}', '${pick(['payment.succeeded', 'payment.failed', 'refund.processed', 'settlement.completed'])}', 'https://merchant.example/webhooks/payments', '${pick(['success', 'failed', 'pending', 'retrying'])}', ${pick([200, 200, 500, 502])}, NULL, NULL, ${1 + (w % 3)}, ${w % 2 === 0 ? `DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * 30)} DAY)` : 'NULL'}, DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
}
lines.push(batchInsert('webhook_logs', ['id', 'uuid', 'correlation_id', 'event_type', 'url', 'status', 'status_code', 'payload', 'response_body', 'attempt_count', 'delivered_at', 'created_at'], whRows, 50));

// Login history
const loginRows = [];
for (let l = 1; l <= 200; l++) {
  const ok = l % 8 !== 0;
  loginRows.push(`(${1 + (l % COUNTS.users)}, 'admin@merchantpro.com', '192.168.1.${l % 255}', ${ok ? 1 : 0}, ${ok ? 'NULL' : "'Invalid password'"}, DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
}
lines.push(`INSERT INTO login_history (user_id, email_attempted, ip_address, success, failure_reason, created_at) VALUES\n  ${loginRows.join(',\n  ')};\n`);

lines.push(`
SET FOREIGN_KEY_CHECKS = 1;
`);

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`Transactions: ${txSeq}, Customers: ${COUNTS.customers}, Merchants: ${COUNTS.merchants}`);
