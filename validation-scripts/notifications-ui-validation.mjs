import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:4200';
const EMAIL = 'admin@merchantpro.com';
const PASSWORD = 'Password123!';

const report = {
  timestamp: new Date().toISOString(),
  screens: {},
  errors: [],
  consoleErrors: [],
};

async function screenshot(page, name) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function extractPageInfo(page) {
  return page.evaluate(() => {
    const getText = (sel) => Array.from(document.querySelectorAll(sel)).map((el) => el.textContent?.trim()).filter(Boolean);
    const visible = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const count = (sel) => document.querySelectorAll(sel).length;
    const headings = getText('h1, h2, h3, h4').slice(0, 20);
    const buttons = getText('button, a.notif-btn, .notif-btn').slice(0, 30);
    const url = window.location.href;
    const title = document.title;
    const bodyText = document.body.innerText.slice(0, 3000);
    return { url, title, headings, buttons, bodyText, visible };
  });
}

async function login(page) {
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#email', { timeout: 15000 });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 30000 });
  await page.waitForTimeout(2000);
}

async function validateScreen(page, key, url, checks) {
  const result = { url, loaded: false, screenshot: null, observations: {}, checks: {}, errors: [] };
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    result.screenshot = await screenshot(page, key);
    const info = await extractPageInfo(page);
    result.url = info.url;
    result.title = info.title;
    result.headings = info.headings;
    result.buttons = info.buttons;
    result.bodyPreview = info.bodyPreview || info.bodyText?.slice(0, 500);
    result.loaded = !info.url.includes('/auth/login') && !info.bodyText?.includes('Access Denied');

    for (const [name, fn] of Object.entries(checks)) {
      try {
        result.checks[name] = await fn(page, info);
      } catch (e) {
        result.checks[name] = { pass: false, error: e.message };
      }
    }
  } catch (e) {
    result.errors.push(e.message);
    report.errors.push(`${key}: ${e.message}`);
    try {
      result.screenshot = await screenshot(page, `${key}-error`);
    } catch {}
  }
  report.screens[key] = result;
  return result;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') report.consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => report.errors.push(`PageError: ${err.message}`));

try {
  // Step 1-2: Login
  await login(page);
  report.screens.login = {
    loaded: true,
    url: page.url(),
    screenshot: await screenshot(page, '01-post-login-dashboard'),
  };

  // Step 3: Dashboard notification bell
  const bellInfo = await page.evaluate(() => {
    const bell = document.querySelector('.dash-topnav__notif-btn, [aria-label="Notifications"]');
    const badge = document.querySelector('.dash-topnav__badge');
    return {
      bellExists: !!bell,
      bellVisible: bell ? bell.getBoundingClientRect().width > 0 : false,
      badgeExists: !!badge,
      badgeText: badge?.textContent?.trim() || null,
      badgeVisible: badge ? badge.getBoundingClientRect().width > 0 : false,
    };
  });
  report.screens.dashboardBell = { ...bellInfo, screenshot: await screenshot(page, '02-dashboard-bell') };

  // Step 4: Notification Center
  await validateScreen(page, '03-notification-center', `${BASE}/notifications`, {
    hasTitle: async (p) => ({ pass: (await p.textContent('h1'))?.includes('Notification Center') }),
    hasMarkAsRead: async (p) => ({ pass: await p.locator('button:has-text("Mark as Read")').count() > 0 }),
    hasArchiveAll: async (p) => ({ pass: await p.locator('button:has-text("Archive All")').count() > 0 }),
    hasSearch: async (p) => ({ pass: await p.locator('input[placeholder*="Search notifications"]').count() > 0 }),
    hasSidebarView: async (p) => ({ pass: await p.locator('text=View').count() > 0 }),
    hasCategories: async (p) => ({ pass: await p.locator('text=Categories').count() > 0 }),
    hasNotificationItems: async (p) => ({ pass: await p.locator('.notif-card, article.notif-card').count(), count: await p.locator('.notif-card').count() }),
    hasAllNotificationsFilter: async (p) => ({ pass: await p.locator('text=All Notifications').count() > 0 }),
    hasUnreadFilter: async (p) => ({ pass: await p.locator('text=Unread').count() > 0 }),
    hasArchivedFilter: async (p) => ({ pass: await p.locator('text=Archived').count() > 0 }),
    shellNav: async (p) => ({
      center: await p.locator('a[href="/notifications"]').count(),
      preferences: await p.locator('a[href="/notifications/preferences"]').count(),
      broadcasts: await p.locator('a[href="/notifications/broadcasts"]').count(),
      templates: await p.locator('a[href="/notifications/templates"]').count(),
    }),
    pageState: async (p) => ({
      loading: await p.locator('.notif-loading').count(),
      error: await p.locator('.notif-error').count(),
      empty: await p.locator('.notif-empty').count(),
      cards: await p.locator('.notif-card').count(),
    }),
  });

  // Step 5: Click notification for details
  const cardCount = await page.locator('.notif-card').count();
  if (cardCount > 0) {
    await page.locator('.notif-card').first().click();
    await page.waitForTimeout(2000);
    await validateScreen(page, '04-notification-details', page.url(), {
      isDetailsRoute: async (p) => ({ pass: /\/notifications\/[^/]+$/.test(p.url()) && !p.url().includes('/preferences') && !p.url().includes('/broadcasts') && !p.url().includes('/templates') }),
      hasBackLink: async (p) => ({ pass: await p.locator('a[routerlink="/notifications"], a.notif-back').count() > 0 }),
      hasContent: async (p) => ({ pass: (await p.locator('.notif-details, .notif-page').count()) > 0 }),
    });
  } else {
    report.screens['04-notification-details'] = { loaded: false, error: 'No notification cards to click', screenshot: await screenshot(page, '04-no-cards') };
  }

  // Step 6: Preferences
  await validateScreen(page, '05-preferences', `${BASE}/notifications/preferences`, {
    hasPreferencesContent: async (p) => ({
      pass: await p.locator('text=Preferences, text=Notification Preferences, .notif-preferences, table, .notif-page__title').count() > 0,
      title: await p.locator('h1, h2').first().textContent().catch(() => null),
    }),
    hasMatrix: async (p) => ({
      table: await p.locator('table').count(),
      toggles: await p.locator('input[type="checkbox"], .mat-mdc-slide-toggle, .notif-toggle').count(),
      rows: await p.locator('tr, .notif-pref-row').count(),
    }),
  });

  // Step 7: Broadcasts
  await validateScreen(page, '06-broadcasts', `${BASE}/notifications/broadcasts`, {
    hasBroadcastContent: async (p) => ({
      title: await p.locator('h1, h2').first().textContent().catch(() => null),
      pass: !p.url().includes('/auth/'),
    }),
    hasCreateOrList: async (p) => ({
      buttons: await p.locator('button').allTextContents(),
      cards: await p.locator('.notif-broadcast, table, .notif-card').count(),
    }),
  });

  // Step 8: Templates
  await validateScreen(page, '07-templates', `${BASE}/notifications/templates`, {
    hasTemplatesContent: async (p) => ({
      title: await p.locator('h1, h2').first().textContent().catch(() => null),
      pass: !p.url().includes('/auth/'),
    }),
    hasTable: async (p) => ({
      table: await p.locator('table').count(),
      rows: await p.locator('tr').count(),
      headers: await p.locator('th').allTextContents().catch(() => []),
    }),
  });

} catch (e) {
  report.errors.push(`Fatal: ${e.message}`);
  await screenshot(page, 'fatal-error');
} finally {
  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
