import { test, expect } from '@playwright/test';
import { clearDb, visitAndWait } from './helpers';

test('prvé otvorenie zobrazí prehľad s navigáciou a seed cvikmi', async ({ page }) => {
  await page.goto('/');
  await clearDb(page);
  await visitAndWait(page);

  await expect(page.getByRole('heading', { name: 'Prehľad' })).toBeVisible();

  await page.getByRole('link', { name: 'Cviky' }).first().click();
  await expect(page.getByText('Drep s činkou')).toBeVisible();
  await expect(page.getByText('Tlak v ľahu').first()).toBeVisible();
});
