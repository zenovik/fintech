import { test as setup } from '@playwright/test';
import path from 'node:path';
import { USERS } from '../data/users';
import { loginViaUi } from '../helpers/auth.helper';

const authDir = path.join(process.cwd(), 'e2e', '.auth');

for (const user of Object.values(USERS)) {
  setup(`authenticate ${user.key}`, async ({ page }) => {
    await loginViaUi(page, user);
    await page.context().storageState({ path: path.join(authDir, `${user.key}.json`) });
  });
}
