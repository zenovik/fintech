import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: join(outDir, 'login-after.png'), fullPage: true });
await browser.close();
console.log('Saved login-after.png');
