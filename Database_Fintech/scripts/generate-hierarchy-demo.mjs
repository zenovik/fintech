#!/usr/bin/env node
/**
 * Generates enterprise hierarchy demo: outlets + merchant users.
 * Output: structure_queries/51_enterprise_hierarchy_demo.sql
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'structure_queries', '51_enterprise_hierarchy_demo.sql');

const PASSWORD_HASH = '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e';
const MERCHANT_COUNT = 50;
const OUTLET_COUNT = 200;
const USER_COUNT = 600;
const OUTLETS_PER_MERCHANT = OUTLET_COUNT / MERCHANT_COUNT;

const OUTLET_LOCATIONS = [
  { city: 'Mumbai', area: 'Andheri', state: 'Maharashtra', lat: 19.1197, lng: 72.8468 },
  { city: 'Delhi', area: 'Connaught Place', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
  { city: 'Indore', area: 'Vijay Nagar', state: 'Madhya Pradesh', lat: 22.7533, lng: 75.8937 },
  { city: 'Jaipur', area: 'MI Road', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Hyderabad', area: 'Banjara Hills', state: 'Telangana', lat: 17.4156, lng: 78.4347 },
  { city: 'Bangalore', area: 'Whitefield', state: 'Karnataka', lat: 12.9698, lng: 77.7500 },
  { city: 'Chennai', area: 'T Nagar', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341 },
  { city: 'Pune', area: 'Koregaon Park', state: 'Maharashtra', lat: 18.5362, lng: 73.8958 },
  { city: 'Kolkata', area: 'Park Street', state: 'West Bengal', lat: 22.5510, lng: 88.3530 },
  { city: 'Ahmedabad', area: 'Satellite', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
];

const INDUSTRIES = ['Retail', 'F&B', 'Electronics', 'Fashion', 'Pharmacy', 'Grocery', 'Jewellery', 'Automotive', 'Wellness', 'Books'];
const BRANCH_TYPES = ['flagship', 'branch', 'branch', 'branch', 'warehouse', 'kiosk'];
const FIRST = ['Aarav', 'Vihaan', 'Ananya', 'Isha', 'Rohan', 'Priya', 'Karan', 'Neha', 'Arjun', 'Sneha', 'Rahul', 'Pooja', 'Amit', 'Kavya', 'Vikram', 'Divya', 'Sanjay', 'Meera', 'Nikhil', 'Tanvi'];
const LAST = ['Sharma', 'Patel', 'Reddy', 'Iyer', 'Gupta', 'Singh', 'Khan', 'Nair', 'Desai', 'Mehta', 'Joshi', 'Rao', 'Malhotra', 'Chopra', 'Kapoor', 'Verma', 'Bose', 'Pillai', 'Saxena', 'Khanna'];
const ROLES = [1, 2, 3, 4, 5, 6, 7, 8];

let seed = 140;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function uuid(prefix, n) {
  const seg1 = (prefix + String(n).padStart(Math.max(0, 8 - prefix.length), '0')).slice(0, 8);
  return `${seg1}-0000-4000-8000-${String(n).padStart(12, '0').slice(-12)}`;
}
function esc(s) { return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''"); }

const outlets = [];
let outletId = 1;

for (let m = 1; m <= MERCHANT_COUNT; m++) {
  const orgId = ((m - 1) % 8) + 1;
  for (let o = 0; o < OUTLETS_PER_MERCHANT; o++) {
    const loc = OUTLET_LOCATIONS[(outletId - 1) % OUTLET_LOCATIONS.length];
    const industry = pick(INDUSTRIES);
    outlets.push({
      id: outletId,
      merchantId: m,
      orgId,
      name: `${loc.city} ${loc.area} ${industry}`,
      code: `OUT-${String(outletId).padStart(5, '0')}`,
      branchType: pick(BRANCH_TYPES),
      isPrimary: o === 0,
      loc,
    });
    outletId++;
  }
}

const outletRows = outlets.map((o) =>
  `(${o.id}, '${uuid('ou', o.id)}', '${o.code}', '${esc(o.name)}', ${o.merchantId}, ${o.orgId}, '${o.branchType}', 'ST-${String(o.id).padStart(4, '0')}', NULL, '+91-98${String(10000000 + o.id).slice(-8)}', 'outlet${o.id}@merchant.in', 'active', DATE_SUB(CURDATE(), INTERVAL ${Math.floor(rand() * 900)} DAY), 'Asia/Kolkata', 'INR', ${o.isPrimary ? 1 : 0}, ${o.loc.lat}, ${o.loc.lng}, NULL, '${esc(`${o.loc.area} Main Road`)}', NULL, 'India', '${esc(o.loc.state)}', '${esc(o.loc.city)}', '${String(100000 + o.id).slice(-6)}', NULL, NULL, 1, 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 180)} DAY))`,
);

const usersPerMerchant = USER_COUNT / MERCHANT_COUNT;
let userId = 1001;
let merchantUserId = 1;
const userRows = [];
const merchantUserRows = [];
const merchantUserOutletRows = [];

for (let m = 1; m <= MERCHANT_COUNT; m++) {
  const orgId = ((m - 1) % 8) + 1;
  const merchantOutlets = outlets.filter((o) => o.merchantId === m).map((o) => o.id);

  for (let u = 0; u < usersPerMerchant; u++) {
    const fn = pick(FIRST);
    const ln = pick(LAST);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${userId}@merchant.in`;
    userRows.push(
      `(${userId}, '${uuid('hu', userId)}', '${email}', '${PASSWORD_HASH}', '${esc(fn)}', '${esc(ln)}', '+91-99${String(10000000 + userId).slice(-8)}', NOW(), 'active')`,
    );

    const roleId = pick(ROLES);
    const accessScope = roleId === 6 ? 'single' : roleId === 5 ? 'multiple' : 'all';
    const defaultOutlet = merchantOutlets[0];
    const status = rand() > 0.1 ? 'active' : (rand() > 0.5 ? 'invited' : 'inactive');
    merchantUserRows.push(
      `(${merchantUserId}, '${uuid('mu', merchantUserId)}', ${userId}, ${orgId}, ${m}, ${roleId}, ${defaultOutlet}, '${accessScope}', '${status}', ${status === 'invited' ? 'NOW()' : 'NULL'}, 1, ${status === 'active' ? 'NOW()' : 'NULL'}, 1, 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 120)} DAY))`,
    );

    if (accessScope === 'single') {
      merchantUserOutletRows.push(`(${merchantUserId}, ${defaultOutlet}, 1)`);
    } else if (accessScope === 'multiple') {
      for (const oid of merchantOutlets.slice(0, Math.min(3, merchantOutlets.length))) {
        merchantUserOutletRows.push(`(${merchantUserId}, ${oid}, 1)`);
      }
    }

    userId++;
    merchantUserId++;
  }
}

const sql = `-- =============================================================================
-- 51_enterprise_hierarchy_demo.sql
-- Enterprise hierarchy demo (auto-generated)
-- Regenerate: node Database_Fintech/scripts/generate-hierarchy-demo.mjs
-- Generated: ${new Date().toISOString()}
-- =============================================================================

USE fintech_db;

UPDATE merchant_code_sequences SET next_value = GREATEST(next_value, ${MERCHANT_COUNT + 1});

INSERT INTO merchant_outlets
  (id, uuid, outlet_code, outlet_name, merchant_id, organization_id, branch_type, store_number, gst_number, phone, email, status, opening_date, timezone, currency, is_primary, latitude, longitude, working_hours, address_line1, address_line2, country, state, city, pincode, notes, outlet_manager_id, created_by, updated_by, created_at)
VALUES
${outletRows.join(',\n')}
ON DUPLICATE KEY UPDATE outlet_name = VALUES(outlet_name);

INSERT INTO users (id, uuid, email, password_hash, first_name, last_name, phone_number, email_verified_at, status)
VALUES
${userRows.join(',\n')}
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

INSERT INTO merchant_users
  (id, uuid, user_id, organization_id, merchant_id, merchant_role_id, default_outlet_id, access_scope, status, invited_at, invited_by, activated_at, created_by, updated_by, created_at)
VALUES
${merchantUserRows.join(',\n')}
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO merchant_user_outlets (merchant_user_id, outlet_id, assigned_by)
VALUES
${merchantUserOutletRows.join(',\n')}
ON DUPLICATE KEY UPDATE assigned_at = assigned_at;
`;

writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT} — outlets: ${outlets.length}, users: ${userRows.length}`);
