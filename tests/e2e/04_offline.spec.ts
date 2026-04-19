import { test, expect } from '@playwright/test';
import { clearDb, visitAndWait } from './helpers';

test('offline režim umožňuje pridať sériu a uloží ju do IndexedDB', async ({ page, context }) => {
  await page.goto('/');
  await clearDb(page);
  await visitAndWait(page);

  await page.getByRole('link', { name: /Nový tréning/i }).first().click();
  await page.fill('input#wk-name', 'Offline workout');
  await page.getByRole('button', { name: 'Začať tréning' }).click();
  await page.getByRole('button', { name: /Pridať cvik/i }).click();
  await page.getByPlaceholder('Hľadať…').fill('Drep');
  await page.getByRole('button', { name: /Drep s činkou/i }).click();

  await context.setOffline(true);

  await page.getByTestId('set-weight').fill('110');
  await page.getByTestId('set-reps').fill('4');
  await page.getByTestId('add-set-btn').click();

  await expect(page.getByTestId('set-row')).toHaveCount(1);

  const count = await page.evaluate(async () => {
    return await new Promise<number>((resolve) => {
      const open = indexedDB.open('gym-progress');
      open.onsuccess = () => {
        const tx = open.result.transaction('sets', 'readonly');
        const req = tx.objectStore('sets').count();
        req.onsuccess = () => resolve(req.result);
      };
    });
  });
  expect(count).toBe(1);

  await context.setOffline(false);
});
