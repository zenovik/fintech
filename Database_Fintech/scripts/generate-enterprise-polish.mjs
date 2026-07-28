/**
 * Sprint 12 — enterprise demo polish: relationship tables, history, analytics snapshots.
 */

export function appendEnterprisePolish(ctx) {
  const {
    lines, batchInsert, COUNTS, DAYS, NOW, txMeta, settledTx, uuid, esc, pick, rand, daysAgo, sqlDate,
    TX_STATUS, MERCHANT_NAMES, BUSINESS_CATEGORIES,
    totalRevenue, totalTx, successRate, invMeta, plMeta, pmCounts, pmAmounts, regVol,
  } = ctx;

  const CITIES = ['New York', 'London', 'Singapore', 'Berlin', 'Sydney', 'Toronto', 'Mumbai', 'Paris', 'Dubai', 'Chicago'];
  const DOC_TYPES = ['business_registration', 'tax_certificate', 'bank_statement', 'identity_proof', 'address_proof', 'pci_attestation'];
  const TAG_DEFS = [
    [1, 'Enterprise', 'primary'], [2, 'High Volume', 'secondary'], [3, 'Retail', 'green'],
    [4, 'At Risk', 'error'], [5, 'VIP', 'amber'], [6, 'SaaS', 'blue'], [7, 'Healthcare', 'teal'],
    [8, 'Travel', 'purple'], [9, 'Subscription', 'orange'], [10, 'New', 'cyan'],
  ];
  const FRAUD_TYPES = [
    ['Velocity spike — 45 txns in 10 minutes', 'velocity', 3],
    ['BIN attack pattern on card range 4111xx', 'bin_attack', 4],
    ['Card testing — micro-charges detected', 'card_testing', 3],
    ['Geo mismatch — billing US, IP Singapore', 'geo_mismatch', 2],
    ['Impossible travel — NYC then Tokyo in 20 min', 'impossible_travel', 4],
    ['High amount — single charge exceeds $25,000', 'high_amount', 3],
    ['Multiple declines — 8 failed attempts', 'multiple_declines', 2],
    ['Blacklisted IP — TOR exit node', 'blacklisted_ip', 4],
    ['Suspicious merchant — velocity + refund spike', 'suspicious_merchant', 3],
    ['AML review — cumulative volume threshold', 'aml_review', 4],
  ];

  lines.push(`INSERT INTO merchant_tags (id, name, color) VALUES\n  ${TAG_DEFS.map(([id, name, color]) => `(${id}, '${name}', '${color}')`).join(',\n  ')}\nON DUPLICATE KEY UPDATE color = VALUES(color);\n`);

  let docId = 0, apiId = 0, whId = 0, noteId = 0, mpmId = 0;
  const docRows = [], apiRows = [], whRows = [], noteRows = [], tagAssignRows = [], mpmRows = [];
  const NOTE_TEXTS = {
    risk: ['Elevated chargeback ratio in last 30 days.', 'Velocity threshold breached twice this month.', 'Manual review required for high-value transactions.'],
    compliance: ['Annual PCI attestation due next quarter.', 'KYC refresh completed — documents on file.', 'OFAC screening passed — no matches found.'],
    onboarding: ['Merchant onboarded after sales review.', 'Integration testing completed — webhooks verified.', 'Go-live approved by risk committee.'],
  };
  for (let m = 1; m <= COUNTS.merchants; m++) {
    const display = MERCHANT_NAMES[(m - 1) % MERCHANT_NAMES.length];
    const docCount = 2 + Math.floor(rand() * 3);
    for (let d = 0; d < docCount; d++) {
      docId++;
      const dt = DOC_TYPES[d % DOC_TYPES.length];
      docRows.push(`(${docId}, '${uuid('md', docId)}', ${m}, '${dt}', '${dt.replace(/_/g, '-')}-${m}-${d + 1}.pdf', '/docs/merchants/${m}/${dt}-${d + 1}.pdf', '${pick(['approved', 'approved', 'pending', 'rejected'])}', 1, ${rand() < 0.7 ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 60)} DAY)` : 'NULL'})`);
    }
    apiId++;
    apiRows.push(`(${apiId}, '${uuid('mk', apiId)}', ${m}, 'Production API Key', 'mp_live_${String(1000 + m)}', '$2b$12$demoHashForApiKey${String(m).padStart(4, '0')}', '${pick(['sandbox', 'production', 'production'])}', 1, ${rand() < 0.6 ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'}, NULL, 1)`);
    const whCount = 1 + Math.floor(rand() * 3);
    for (let w = 0; w < whCount; w++) {
      whId++;
      whRows.push(`(${whId}, '${uuid('mw', whId)}', ${m}, 'https://hooks.${display.toLowerCase().replace(/\s+/g, '')}.example/payments/v${w + 1}', '["payment.succeeded","payment.failed","refund.processed"]', NULL, ${rand() < 0.85 ? 1 : 0})`);
    }
    for (const texts of Object.values(NOTE_TEXTS)) {
      noteId++;
      noteRows.push(`(${noteId}, '${uuid('mn', noteId)}', ${m}, ${1 + (noteId % 10)}, '${esc(pick(texts))}', 1)`);
    }
    const tagCount = 2 + Math.floor(rand() * 5);
    const usedTags = new Set();
    for (let t = 0; t < tagCount; t++) {
      const tagId = 1 + Math.floor(rand() * TAG_DEFS.length);
      if (!usedTags.has(tagId)) {
        usedTags.add(tagId);
        tagAssignRows.push(`(${m}, ${tagId})`);
      }
    }
    for (const pmId of [1, 2, 3, 5]) {
      if (rand() < 0.85) {
        mpmId++;
        mpmRows.push(`(${mpmId}, ${m}, ${pmId}, 1)`);
      }
    }
  }
  lines.push(batchInsert('merchant_documents', ['id', 'uuid', 'merchant_id', 'document_type', 'file_name', 'file_url', 'status', 'uploaded_by', 'reviewed_at'], docRows, 300));
  lines.push(batchInsert('merchant_api_credentials', ['id', 'uuid', 'merchant_id', 'key_name', 'api_key_prefix', 'api_key_hash', 'environment', 'is_active', 'last_used_at', 'expires_at', 'created_by'], apiRows, 200));
  lines.push(batchInsert('merchant_webhooks', ['id', 'uuid', 'merchant_id', 'url', 'event_types', 'secret_hash', 'is_active'], whRows, 200));
  lines.push(batchInsert('merchant_notes', ['id', 'uuid', 'merchant_id', 'author_user_id', 'note_text', 'is_internal'], noteRows, 300));
  lines.push(batchInsert('merchant_tag_assignments', ['merchant_id', 'tag_id'], tagAssignRows, 500));
  lines.push(batchInsert('merchant_payment_methods', ['id', 'merchant_id', 'payment_method_type_id', 'is_enabled'], mpmRows, 400));

  const custAddrRows = [];
  for (let c = 1; c <= COUNTS.customers; c++) {
    if (c % 3 !== 0) {
      custAddrRows.push(`(${c}, '${uuid('ca', c)}', ${c}, '${pick(['billing', 'shipping'])}', '${100 + (c % 500)} ${pick(['Oak', 'Maple', 'Cedar', 'Pine'])} Avenue', ${c % 5 === 0 ? `'Apt ${c % 200}'` : 'NULL'}, '${pick(CITIES)}', 'Region ${c % 20}', '${10000 + (c % 90000)}', '${pick(['US', 'GB', 'SG', 'DE', 'AU', 'CA', 'IN', 'FR'])}', 1)`);
    }
  }
  lines.push(batchInsert('customer_addresses', ['id', 'uuid', 'customer_id', 'address_type', 'line1', 'line2', 'city', 'state_province', 'postal_code', 'country_code', 'is_primary'], custAddrRows, 400));

  const custActRows = [];
  for (let a = 1; a <= 800; a++) {
    const cid = 1 + (a % COUNTS.customers);
    custActRows.push(`('${uuid('ua', a)}', 1, 1, '${pick(['customer_viewed', 'customer_updated', 'customer_kyc_review', 'customer_blocked', 'customer_note_added'])}', 'customer', '${cid}', '192.168.2.${a % 255}', 'MerchantPro/1.0', NULL, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
  }
  lines.push(batchInsert('user_activity_logs', ['uuid', 'user_id', 'actor_user_id', 'action', 'resource_type', 'resource_id', 'ip_address', 'user_agent', 'metadata', 'created_at'], custActRows, 200));

  const txEventRows = [];
  const txHistRows = [];
  let evId = 0, histId = 0;
  const lifecycle = {
    [TX_STATUS.settled]: ['created', 'authorized', 'captured', 'processing', 'settled'],
    [TX_STATUS.pending]: ['created', 'authorized', 'pending'],
    [TX_STATUS.failed]: ['created', 'authorized', 'failed'],
    [TX_STATUS.flagged]: ['created', 'authorized', 'captured', 'flagged'],
  };
  for (const tx of txMeta) {
    const events = lifecycle[tx.statusId] ?? lifecycle[TX_STATUS.pending];
    for (let i = 0; i < events.length; i++) {
      evId++;
      const evt = events[i];
      const ts = new Date(tx.processed.getTime() - (events.length - i) * 600000);
      txEventRows.push(`(${evId}, '${uuid('te', evId)}', ${tx.id}, '${evt}', NULL, ${i === 0 ? 'NULL' : 1}, '${sqlDate(ts)}')`);
    }
    histId++;
    txHistRows.push(`(${histId}, ${tx.id}, NULL, ${tx.statusId}, 'Transaction lifecycle completed', 1, '${sqlDate(tx.processed)}')`);
  }
  lines.push(batchInsert('transaction_events', ['id', 'uuid', 'transaction_id', 'event_type', 'event_data', 'actor_user_id', 'created_at'], txEventRows, 500));
  lines.push(batchInsert('transaction_status_history', ['id', 'transaction_id', 'from_status_id', 'to_status_id', 'reason', 'changed_by', 'created_at'], txHistRows, 500));

  const feeRows = [];
  let feeId = 0;
  for (const tx of settledTx.slice(0, Math.min(settledTx.length, 8000))) {
    feeId++;
    feeRows.push(`(${feeId}, ${tx.id}, 'processing', ${tx.fee.toFixed(2)}, 'USD', 'Standard processing fee')`);
    if (rand() < 0.3) {
      feeId++;
      feeRows.push(`(${feeId}, ${tx.id}, 'interchange', ${(tx.fee * 0.4).toFixed(2)}, 'USD', 'Interchange component')`);
    }
  }
  lines.push(batchInsert('transaction_fees', ['id', 'transaction_id', 'fee_type', 'amount', 'currency', 'description'], feeRows, 500));

  const refHistRows = [];
  let rsId = 0;
  for (let r = 1; r <= COUNTS.refunds; r++) {
    rsId++;
    refHistRows.push(`(${rsId}, ${r}, NULL, 'pending', 'Refund requested by customer', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 60)} DAY))`);
    rsId++;
    refHistRows.push(`(${rsId}, ${r}, 'pending', '${pick(['approved', 'processed', 'rejected'])}', 'Refund review completed', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 45)} DAY))`);
  }
  lines.push(batchInsert('refund_status_history', ['id', 'refund_id', 'from_status', 'to_status', 'reason', 'changed_by', 'created_at'], refHistRows, 200));

  const dispHistRows = [], dispEvidenceRows = [];
  let dsId = 0, deId = 0;
  for (let d = 1; d <= COUNTS.chargebacks; d++) {
    dsId++;
    dispHistRows.push(`(${dsId}, ${d}, NULL, 'open', 'Chargeback opened by issuer', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 50)} DAY))`);
    dsId++;
    dispHistRows.push(`(${dsId}, ${d}, 'open', '${pick(['under_review', 'representment_submitted', 'won', 'lost'])}', 'Dispute lifecycle update', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY))`);
    if (d % 2 === 0) {
      deId++;
      dispEvidenceRows.push(`(${deId}, '${uuid('de', deId)}', ${d}, 'evidence-${d}.pdf', '/disputes/${d}/evidence.pdf', 'application/pdf', 'Supporting documentation', 1)`);
    }
  }
  lines.push(batchInsert('dispute_status_history', ['id', 'dispute_id', 'from_status', 'to_status', 'reason', 'changed_by', 'created_at'], dispHistRows, 100));
  if (dispEvidenceRows.length) lines.push(batchInsert('dispute_evidence', ['id', 'uuid', 'dispute_id', 'file_name', 'file_url', 'mime_type', 'description', 'uploaded_by'], dispEvidenceRows, 100));

  const pltRows = [];
  let pltId = 0;
  for (const pl of plMeta.filter((p) => p.status === 'active' || p.status === 'expired').slice(0, 180)) {
    const tx = settledTx[(pl.id * 13) % settledTx.length];
    if (tx) {
      pltId++;
      pltRows.push(`(${pltId}, ${pl.id}, ${tx.id}, ${tx.amount.toFixed(2)})`);
    }
  }
  if (pltRows.length) lines.push(batchInsert('payment_link_transactions', ['id', 'payment_link_id', 'transaction_id', 'paid_amount'], pltRows, 200));

  const invPayRows = [];
  let ipId = 0;
  for (const inv of invMeta.filter((i) => ['paid', 'partially_paid'].includes(i.status))) {
    ipId++;
    const amt = inv.status === 'paid' ? inv.total : (parseFloat(inv.total) * 0.5).toFixed(2);
    const tx = settledTx[(inv.id * 7) % settledTx.length];
    invPayRows.push(`(${ipId}, ${inv.id}, ${tx ? tx.id : 'NULL'}, NULL, ${amt}, '${pick(['card', 'bank_transfer', 'wallet', 'upi'])}', '${inv.status === 'partially_paid' ? 'Partial payment received' : 'Full payment received'}', 1)`);
    if (inv.status === 'partially_paid' && rand() < 0.5) {
      ipId++;
      invPayRows.push(`(${ipId}, ${inv.id}, NULL, NULL, ${(parseFloat(inv.total) * 0.25).toFixed(2)}, 'card', 'Second partial payment', 1)`);
    }
  }
  if (invPayRows.length) lines.push(batchInsert('invoice_payments', ['id', 'invoice_id', 'transaction_id', 'payment_link_id', 'amount', 'payment_method', 'notes', 'created_by'], invPayRows, 200));

  const subInvRows = [];
  for (let s = 1; s <= Math.min(COUNTS.subscriptions, COUNTS.invoices); s++) {
    subInvRows.push(`(${s}, ${s}, ${s}, '${pick(['2026-01', '2026-02', '2026-Q1', '2026-Q2'])}')`);
  }
  lines.push(batchInsert('subscription_invoices', ['id', 'subscription_id', 'invoice_id', 'billing_period'], subInvRows, 200));

  const qrTxRows = [];
  for (let qt = 1; qt <= 120; qt++) {
    const qrId = 1 + (qt % COUNTS.qrCodes);
    const tx = settledTx[(qt * 11) % settledTx.length];
    if (tx) qrTxRows.push(`(${qt}, ${qrId}, ${tx.id}, ${tx.amount.toFixed(2)})`);
  }
  lines.push(batchInsert('qr_transactions', ['id', 'qr_code_id', 'transaction_id', 'paid_amount'], qrTxRows, 100));

  const pbRows = [];
  for (let b = 1; b <= 10; b++) {
    pbRows.push(`(${b}, '${uuid('pb', b)}', 'PBATCH-${NOW.getFullYear()}-${1000 + b}', '${pick(['completed', 'completed', 'processing', 'failed'])}', ${(100000 + rand() * 400000).toFixed(2)}, ${Math.floor(COUNTS.payouts / 10)}, 'USD', DATE_SUB(NOW(), INTERVAL ${b * 5} DAY), ${b % 2 === 0 ? `DATE_SUB(NOW(), INTERVAL ${b * 5 - 1} DAY)` : 'NULL'}, 1)`);
  }
  lines.push(batchInsert('payout_batches', ['id', 'uuid', 'batch_ref', 'status', 'total_amount', 'payout_count', 'currency', 'scheduled_at', 'processed_at', 'created_by'], pbRows));

  const payoutHistRows = [];
  const PAYOUT_FLOW = ['pending', 'scheduled', 'processing', 'sent', 'confirmed'];
  let phId = 0;
  for (let p = 1; p <= COUNTS.payouts; p++) {
    const steps = 2 + Math.floor(rand() * 3);
    for (let s = 0; s < steps; s++) {
      phId++;
      payoutHistRows.push(`(${phId}, ${p}, ${s === 0 ? 'NULL' : `'${PAYOUT_FLOW[s - 1]}'`}, '${PAYOUT_FLOW[Math.min(s, PAYOUT_FLOW.length - 1)]}', '${pick(['Approved by finance', 'Bank processing', 'Retry after failure', 'Manual review complete'])}', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
    }
  }
  lines.push(batchInsert('payout_status_history', ['id', 'payout_id', 'from_status', 'to_status', 'reason', 'changed_by', 'created_at'], payoutHistRows, 500));

  const stlHistRows = [], stlNoteRows = [];
  const STL_FLOW = ['pending', 'processing', 'processed'];
  let shId = 0, snId = 0;
  for (let s = 1; s <= COUNTS.settlements; s++) {
    for (let step = 0; step < 2 + (s % 2); step++) {
      shId++;
      stlHistRows.push(`(${shId}, ${s}, ${step === 0 ? 'NULL' : `'${STL_FLOW[step - 1]}'`}, '${STL_FLOW[Math.min(step, STL_FLOW.length - 1)]}', '${pick(['Weekend delay applied', 'Batch processing started', 'Bank transfer initiated', 'Retry after holiday'])}', 1, DATE_SUB(NOW(), INTERVAL ${Math.floor((s / COUNTS.settlements) * DAYS)} DAY))`);
    }
    if (s % 8 === 0) {
      snId++;
      stlNoteRows.push(`(${snId}, '${uuid('sn', snId)}', ${s}, 1, '${esc(pick(['Weekend settlement delayed to Monday.', 'Manual adjustment applied after review.', 'Merchant requested hold on batch.']))}', 1)`);
    }
  }
  lines.push(batchInsert('settlement_status_history', ['id', 'settlement_id', 'from_status', 'to_status', 'reason', 'changed_by', 'created_at'], stlHistRows, 500));
  if (stlNoteRows.length) lines.push(batchInsert('settlement_notes', ['id', 'uuid', 'settlement_id', 'author_user_id', 'note_text', 'is_internal'], stlNoteRows, 100));

  const supActRows = [], supAttRows = [];
  const ACT_TYPES = ['created', 'assigned', 'status_changed', 'escalated', 'note_added', 'resolved', 'closed'];
  let actId = 0, attId = 0;
  for (let t = 1; t <= COUNTS.supportTickets; t++) {
    const actCount = 2 + Math.floor(rand() * 4);
    for (let a = 0; a < actCount; a++) {
      actId++;
      supActRows.push(`(${actId}, ${t}, '${pick(ACT_TYPES)}', '${esc(pick(['Ticket opened by merchant', 'Assigned to support agent', 'Escalated to tier 2', 'Customer responded', 'Issue resolved', 'Ticket closed']))}', ${1 + (actId % 10)}, NULL, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 60)} DAY))`);
    }
    if (t % 3 === 0) {
      attId++;
      supAttRows.push(`(${attId}, ${t}, 'attachment-${t}.pdf', 'application/pdf', ${1024 + t * 100}, '/support/${t}/attachment.pdf', ${1 + (t % 10)})`);
    }
  }
  lines.push(batchInsert('support_ticket_activities', ['id', 'ticket_id', 'activity_type', 'summary', 'actor_id', 'metadata', 'created_at'], supActRows, 400));
  if (supAttRows.length) lines.push(batchInsert('support_ticket_attachments', ['id', 'ticket_id', 'file_name', 'mime_type', 'file_size', 'storage_path', 'uploaded_by'], supAttRows, 100));

  const fraudRows = [];
  for (let f = 1; f <= 210; f++) {
    const [title, source, sev] = pick(FRAUD_TYPES);
    fraudRows.push(`(${f}, '${uuid('fa', f)}', '${esc(title)}', 'Fraud alert ${f}: ${esc(title)} — review recommended.', ${1 + (f % COUNTS.merchants)}, ${sev}, '${pick(['NA', 'EMEA', 'APAC'])}', '${source}', ${f % 5 !== 0 ? 1 : 0}, ${f % 7 === 0 ? 1 : 0}, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY), ${f % 4 === 0 ? 'DATE_ADD(NOW(), INTERVAL 7 DAY)' : 'NULL'})`);
  }
  lines.push(batchInsert('fraud_alerts', ['id', 'uuid', 'title', 'message', 'merchant_id', 'severity_id', 'region_code', 'source', 'is_active', 'is_dismissed', 'created_at', 'expires_at'], fraudRows, 200));

  const kpiRows = [];
  const baseRev = totalRevenue / 180;
  const baseTx = totalTx / 180;
  for (let d = 179; d >= 0; d--) {
    const growth = 0.65 + (179 - d) / 179 * 0.35;
    const dow = daysAgo(d).getDay();
    const weekend = dow === 0 || dow === 6 ? 0.58 : 1;
    kpiRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${d} DAY), 'daily', ${(baseRev * growth * weekend).toFixed(2)}, ${Math.max(1, Math.floor(baseTx * growth * weekend))}, ${Math.min(COUNTS.merchants, 80 + Math.floor((179 - d) / 6))}, ${(parseFloat(successRate) + (rand() - 0.5) * 2).toFixed(2)}, ${(2 + rand() * 4).toFixed(2)}, ${(2 + rand() * 3).toFixed(2)}, ${(0.1 + rand() * 0.5).toFixed(2)})`);
  }
  for (let w = 25; w >= 0; w--) {
    const growth = 0.7 + (25 - w) / 25 * 0.3;
    kpiRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${w * 7} DAY), 'weekly', ${(baseRev * 7 * growth).toFixed(2)}, ${Math.floor(baseTx * 7 * growth)}, ${Math.min(COUNTS.merchants, 85 + w)}, ${(parseFloat(successRate) - 0.2 + rand()).toFixed(2)}, ${(4 + rand() * 5).toFixed(2)}, ${(5 + rand() * 4).toFixed(2)}, ${(0.5 + rand()).toFixed(2)})`);
  }
  for (let m = 11; m >= 0; m--) {
    const growth = 0.55 + (11 - m) / 11 * 0.45;
    kpiRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${m} MONTH), 'monthly', ${(totalRevenue * growth / 6).toFixed(2)}, ${Math.floor(totalTx * growth / 6)}, ${Math.min(COUNTS.merchants, 70 + m * 4)}, ${(parseFloat(successRate) + m * 0.1).toFixed(2)}, ${(8 + m * 1.2).toFixed(2)}, ${(7 + m).toFixed(2)}, ${(1 + m * 0.3).toFixed(2)})`);
  }
  lines.push(batchInsert('dashboard_kpi_snapshots', ['snapshot_date', 'period_type', 'total_revenue', 'total_transactions', 'total_merchants', 'success_rate', 'revenue_change_pct', 'transactions_change_pct', 'merchants_change_pct'], kpiRows, 200));

  const revRows = [];
  for (let d = 179; d >= 0; d--) {
    const growth = 0.65 + (179 - d) / 179 * 0.35;
    const dow = daysAgo(d).getDay();
    const weekend = dow === 0 || dow === 6 ? 0.58 : 1;
    revRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${d} DAY), 'daily', 'day', ${(baseRev * growth * weekend).toFixed(2)}, ${(baseRev * growth * weekend * 0.96).toFixed(2)}, 'USD')`);
  }
  for (let w = 25; w >= 0; w--) {
    const growth = 0.7 + (25 - w) / 25 * 0.3;
    revRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${w * 7} DAY), 'weekly', 'week', ${(baseRev * 7 * growth).toFixed(2)}, ${(baseRev * 7 * growth * 0.95).toFixed(2)}, 'USD')`);
  }
  for (let m = 11; m >= 0; m--) {
    const growth = 0.55 + (11 - m) / 11 * 0.45;
    revRows.push(`(DATE_SUB(CURDATE(), INTERVAL ${m} MONTH), 'monthly', 'month', ${(totalRevenue * growth / 6).toFixed(2)}, ${(totalRevenue * growth / 6 * 0.97).toFixed(2)}, 'USD')`);
  }
  lines.push(batchInsert('revenue_time_series', ['period_date', 'period_type', 'granularity', 'actual_revenue', 'forecast_revenue', 'currency'], revRows, 200));

  const pmDistRows = [], regDistRows = [];
  const pmTotal = Object.values(pmAmounts).reduce((a, b) => a + b, 0) || 1;
  const regTotal = Object.values(regVol).reduce((a, b) => a + b, 0) || 1;
  for (let d = 29; d >= 0; d--) {
    const snap = `DATE_SUB(CURDATE(), INTERVAL ${d} DAY)`;
    for (const pmId of [1, 2, 3, 5]) {
      const factor = 0.8 + rand() * 0.4;
      pmDistRows.push(`(${snap}, 'daily', ${pmId}, ${Math.floor((pmCounts[pmId] ?? 0) * factor / 30)}, ${((pmAmounts[pmId] ?? 0) * factor / 30).toFixed(2)}, ${(((pmAmounts[pmId] ?? 0) / pmTotal) * 100).toFixed(2)})`);
    }
    for (const rId of [1, 2, 3]) {
      regDistRows.push(`(${snap}, 'daily', ${rId}, ${((regVol[rId] ?? 0) * (0.8 + rand() * 0.4) / 30).toFixed(2)}, ${(((regVol[rId] ?? 0) / regTotal) * 100).toFixed(2)}, ${(55 + rId * 12).toFixed(2)})`);
    }
  }
  lines.push(batchInsert('payment_method_distribution', ['snapshot_date', 'period_type', 'payment_method_type_id', 'transaction_count', 'total_amount', 'percentage'], pmDistRows, 300));
  lines.push(batchInsert('regional_distribution', ['snapshot_date', 'period_type', 'region_id', 'total_volume', 'percentage', 'progress_pct'], regDistRows, 200));

  const analRows = [];
  const groups = ['revenue_trend', 'transaction_trend', 'refund_rate', 'chargeback_rate', 'merchant_growth', 'customer_growth'];
  let asId = 0;
  for (let d = 179; d >= 0; d -= 7) {
    for (const g of groups) {
      asId++;
      const growth = 0.6 + (179 - d) / 179 * 0.4;
      analRows.push(`('${uuid('as', asId)}', DATE_SUB(CURDATE(), INTERVAL ${d} DAY), 'daily', '${g}', JSON_OBJECT('value', ${(totalRevenue * growth / 180).toFixed(2)}, 'count', ${Math.floor(totalTx * growth / 180)}, 'rate', ${(2 + rand() * 3).toFixed(2)}))`);
    }
  }
  lines.push(batchInsert('analytics_snapshots', ['uuid', 'snapshot_date', 'period_type', 'metric_group', 'data'], analRows, 300));

  const repExpRows = [], repLogRows = [];
  for (let r = 5; r <= 40; r++) {
    const st = pick(['completed', 'completed', 'failed']);
    repExpRows.push(`('${uuid('re', r + 100)}', ${1 + (r % 5)}, ${1 + (r % 6)}, '${pick(['csv', 'pdf', 'xlsx'])}', '${st}', ${st === 'completed' ? `'/exports/report-${r}.csv'` : 'NULL'}, ${st === 'completed' ? `'report-export-${r}.csv'` : 'NULL'}, ${st === 'completed' ? Math.floor(10 + rand() * 500) : 'NULL'}, '{}', DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
    repLogRows.push(`('${uuid('el', r + 200)}', ${1 + (r % 6)}, ${1 + (r % 5)}, '${pick(['manual', 'scheduled', 'export'])}', '${pick(['completed', 'completed', 'failed'])}', ${Math.floor(10 + rand() * 800)}, ${100 + Math.floor(rand() * 2000)}, '{}', DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY), DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
  }
  lines.push(`INSERT INTO report_exports (uuid, user_id, report_id, format, status, file_url, file_name, row_count, filter_params, completed_at) VALUES\n  ${repExpRows.join(',\n  ')};\n`);
  lines.push(`INSERT INTO report_execution_logs (uuid, report_id, user_id, execution_type, status, rows_returned, duration_ms, filter_params, started_at, completed_at) VALUES\n  ${repLogRows.join(',\n  ')};\n`);

  const ndRows = [];
  for (let n = 1; n <= 500; n++) {
    ndRows.push(`(${n}, '${uuid('nd', n)}', ${1 + (n % COUNTS.notifications)}, ${1 + (n % 20)}, '${pick(['in_app', 'email', 'push', 'sms'])}', NULL, '${pick(['delivered', 'delivered', 'sent', 'failed'])}', ${n % 12 === 0 ? "'SMTP timeout'" : 'NULL'}, ${n % 3 !== 0 ? `DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'}, DATE_SUB(NOW(6), INTERVAL ${Math.floor(rand() * DAYS)} DAY))`);
  }
  lines.push(batchInsert('notification_deliveries', ['id', 'uuid', 'notification_id', 'user_id', 'channel', 'template_id', 'status', 'error_message', 'sent_at', 'delivered_at'], ndRows, 200));

  // Transaction notes/attachments/exports (detail screens)
  const txNoteRows = [], txAttRows = [], txExpRows = [];
  for (let n = 1; n <= 150; n++) {
    const txId = 1 + (n * 17) % txMeta.length;
    txNoteRows.push(`(${n}, '${uuid('tn', n)}', ${txId}, ${1 + (n % 10)}, '${esc(pick(['Manual review note', 'Customer called to confirm charge', 'Flagged for compliance check']))}', 1)`);
    if (n % 3 === 0) {
      txAttRows.push(`(${n}, '${uuid('ta', n)}', ${txId}, 'receipt-${n}.pdf', '/attachments/tx/${n}.pdf', 'application/pdf', 1)`);
    }
  }
  for (let e = 1; e <= 25; e++) {
    const st = pick(['completed', 'completed', 'failed']);
    txExpRows.push(`(${e}, '${uuid('txe', e)}', ${1 + (e % 10)}, '${pick(['csv', 'xlsx', 'pdf'])}', '{}', '${st}', ${st === 'completed' ? `'/exports/transactions/export-${e}.csv'` : 'NULL'}, ${st === 'completed' ? 500 + e * 10 : 'NULL'}, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 30)} DAY))`);
  }
  lines.push(batchInsert('transaction_notes', ['id', 'uuid', 'transaction_id', 'author_user_id', 'note_text', 'is_internal'], txNoteRows, 100));
  lines.push(batchInsert('transaction_attachments', ['id', 'uuid', 'transaction_id', 'file_name', 'file_url', 'mime_type', 'uploaded_by'], txAttRows, 100));
  lines.push(batchInsert('transaction_exports', ['id', 'uuid', 'user_id', 'format', 'filter_params', 'status', 'file_url', 'row_count', 'completed_at'], txExpRows, 50));

  // Settlement adjustments + bank transfers
  const adjRows = [], btRows = [];
  const ADJ_TYPES = ['credit', 'debit', 'chargeback', 'fee_correction'];
  for (let a = 1; a <= 40; a++) {
    adjRows.push(`(${a}, '${uuid('sa', a)}', ${1 + (a % COUNTS.settlements)}, '${pick(ADJ_TYPES)}', ${(100 + rand() * 5000).toFixed(2)}, 'USD', '${esc(pick(['Weekend processing adjustment', 'Chargeback reserve hold', 'Manual credit applied']))}', 1)`);
    const btSt = pick(['confirmed', 'confirmed', 'sent', 'pending', 'failed']);
    btRows.push(`(${a}, '${uuid('bt', a)}', ${1 + (a % COUNTS.settlements)}, '${pick(['Chase Bank', 'HSBC', 'Deutsche Bank'])}', '****${String(1000 + a).slice(-4)}', 'TRF-${NOW.getFullYear()}-${10000 + a}', ${(5000 + rand() * 100000).toFixed(2)}, 'USD', '${btSt}', ${btSt !== 'pending' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 60)} DAY)` : 'NULL'}, ${btSt === 'confirmed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 55)} DAY)` : 'NULL'})`);
  }
  lines.push(batchInsert('settlement_adjustments', ['id', 'uuid', 'settlement_id', 'adjustment_type', 'amount', 'currency', 'reason', 'created_by'], adjRows, 50));
  lines.push(batchInsert('settlement_bank_transfers', ['id', 'uuid', 'settlement_id', 'bank_name', 'account_masked', 'transfer_ref', 'amount', 'currency', 'status', 'sent_at', 'confirmed_at'], btRows, 50));

  // Dashboard export jobs
  const dejRows = [];
  for (let j = 1; j <= 15; j++) {
    const st = pick(['completed', 'completed', 'pending', 'failed']);
    dejRows.push(`(${j}, '${uuid('dj', j)}', ${1 + (j % 10)}, ${1 + (j % 3)}, '{}', '${st}', ${st === 'completed' ? `'/exports/dashboard/job-${j}.csv'` : 'NULL'}, ${st === 'failed' ? "'Export timeout'" : 'NULL'}, DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY), ${st === 'completed' ? `DATE_SUB(NOW(), INTERVAL ${Math.floor(rand() * 14)} DAY)` : 'NULL'})`);
  }
  lines.push(batchInsert('dashboard_export_jobs', ['id', 'uuid', 'user_id', 'format_id', 'date_range_params', 'status', 'file_url', 'error_message', 'created_at', 'completed_at'], dejRows, 20));
}
