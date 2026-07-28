/**
 * Shared summary handler — JSON, HTML, trend-friendly output.
 */
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js';

export function buildSummary(data, profile, env) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = `performance/reports/${profile}-${env}-${timestamp}`;

  const summary = {
    profile,
    environment: env,
    timestamp: new Date().toISOString(),
    metrics: extractKeyMetrics(data),
    thresholds: data.root_group?.checks ?? {},
  };

  return {
    [`${prefix}.json`]: JSON.stringify(summary, null, 2),
    [`${prefix}-raw.json`]: JSON.stringify(data, null, 2),
    [`${prefix}.html`]: renderHtml(summary, data),
    [`${prefix}-summary.txt`]: textSummary(data, { indent: ' ', enableColors: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function extractKeyMetrics(data) {
  const m = data.metrics || {};
  return {
    http_reqs: metricValue(m.http_reqs, 'rate'),
    http_req_failed: metricValue(m.http_req_failed, 'rate'),
    http_req_duration_avg: metricValue(m.http_req_duration, 'avg'),
    http_req_duration_med: metricValue(m.http_req_duration, 'med'),
    http_req_duration_p90: metricValue(m.http_req_duration, 'p(90)'),
    http_req_duration_p95: metricValue(m.http_req_duration, 'p(95)'),
    http_req_duration_p99: metricValue(m.http_req_duration, 'p(99)'),
    iteration_duration_p95: metricValue(m.iteration_duration, 'p(95)'),
    vus_max: metricValue(m.vus_max, 'max'),
    checks_pass_rate: m.checks ? m.checks.values?.rate : null,
    login_duration_p95: metricValue(m.login_duration, 'p(95)'),
    payment_create_duration_p95: metricValue(m.payment_create_duration, 'p(95)'),
    checkout_public_pay_duration_p95: metricValue(m.checkout_public_pay_duration, 'p(95)'),
    scenario_errors: metricValue(m.scenario_errors, 'count'),
    timeout_errors: metricValue(m.timeout_errors, 'count'),
  };
}

function metricValue(metric, key) {
  if (!metric?.values) return null;
  return metric.values[key] ?? null;
}

function renderHtml(summary, data) {
  const m = summary.metrics;
  const passed = data?.root_group?.checks ? 'See k6 output' : 'N/A';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>k6 Performance Report — ${summary.profile}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #f8fafc; color: #0f172a; }
    h1 { color: #003d9b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
    .label { font-size: 0.85rem; color: #64748b; }
    .value { font-size: 1.4rem; font-weight: 700; margin-top: 0.25rem; }
    .pass { color: #059669; } .fail { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; background: #fff; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <h1>Performance Report</h1>
  <p><strong>Profile:</strong> ${summary.profile} &nbsp;|&nbsp; <strong>Environment:</strong> ${summary.environment} &nbsp;|&nbsp; <strong>Time:</strong> ${summary.timestamp}</p>
  <div class="grid">
    <div class="card"><div class="label">RPS</div><div class="value">${fmt(m.http_reqs)}</div></div>
    <div class="card"><div class="label">Failure Rate</div><div class="value ${(m.http_req_failed ?? 0) < 0.01 ? 'pass' : 'fail'}">${pct(m.http_req_failed)}</div></div>
    <div class="card"><div class="label">P95 Latency</div><div class="value ${(m.http_req_duration_p95 ?? 9999) < 500 ? 'pass' : 'fail'}">${fmtMs(m.http_req_duration_p95)}</div></div>
    <div class="card"><div class="label">P99 Latency</div><div class="value ${(m.http_req_duration_p99 ?? 9999) < 1000 ? 'pass' : 'fail'}">${fmtMs(m.http_req_duration_p99)}</div></div>
    <div class="card"><div class="label">Avg Latency</div><div class="value">${fmtMs(m.http_req_duration_avg)}</div></div>
    <div class="card"><div class="label">Median Latency</div><div class="value">${fmtMs(m.http_req_duration_med)}</div></div>
    <div class="card"><div class="label">Max VUs</div><div class="value">${fmt(m.vus_max)}</div></div>
    <div class="card"><div class="label">Scenario Errors</div><div class="value">${fmt(m.scenario_errors)}</div></div>
  </div>
  <h2>Threshold Targets</h2>
  <table>
    <tr><th>Metric</th><th>Target</th><th>Actual</th></tr>
    <tr><td>HTTP failure rate</td><td>&lt; 1%</td><td>${pct(m.http_req_failed)}</td></tr>
    <tr><td>P95 response time</td><td>&lt; 500ms</td><td>${fmtMs(m.http_req_duration_p95)}</td></tr>
    <tr><td>P99 response time</td><td>&lt; 1000ms</td><td>${fmtMs(m.http_req_duration_p99)}</td></tr>
    <tr><td>Payment create P95</td><td>&lt; 800ms</td><td>${fmtMs(m.payment_create_duration_p95)}</td></tr>
    <tr><td>Checkout pay P95</td><td>&lt; 1000ms</td><td>${fmtMs(m.checkout_public_pay_duration_p95)}</td></tr>
  </table>
  <h2>Notes</h2>
  <p>Database slow queries, Redis queue depth, and worker throughput should be correlated via <code>/api/v1/system/performance</code> and infrastructure monitoring during soak/stress runs.</p>
</body>
</html>`;
}

function fmt(v) {
  if (v == null) return '—';
  return typeof v === 'number' ? v.toFixed(2) : String(v);
}

function fmtMs(v) {
  if (v == null) return '—';
  return `${Number(v).toFixed(1)} ms`;
}

function pct(v) {
  if (v == null) return '—';
  return `${(Number(v) * 100).toFixed(2)}%`;
}
