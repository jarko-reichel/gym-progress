import { test, expect } from '@playwright/test';
import { clearDb, visitAndWait } from './helpers';

test('vytvorenie tréningu, pridanie cviku a 3 sérií vypočíta 1RM', async ({ page }) => {
  await page.goto('/');
  await clearDb(page);
  await visitAndWait(page);

  await page.getByRole('link', { name: /Nový tréning/i }).first().click();
  await page.fill('input#wk-name', 'Push A');
  await page.getByRole('button', { name: 'Začať tréning' }).click();

  // Add exercise
  await page.getByRole('button', { name: /Pridať cvik/i }).click();
  await page.getByPlaceholder('Hľadať…').fill('Drep');
  await page.getByRole('button', { name: /Drep s činkou/i }).click();

  // Fill 3 sets
  const sets = [
    { w: '100', r: '5' },
    { w: '100', r: '5' },
    { w: '95', r: '6' },
  ];
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i]!;
    await page.getByTestId('set-weight').fill(s.w);
    await page.getByTestId('set-reps').fill(s.r);
    await page.getByTestId('add-set-btn').click();
    await expect(page.getByTestId('set-row')).toHaveCount(i + 1);
  }

  await expect(page.getByTestId('set-row')).toHaveCount(3);
  const estimates = await page.getByTestId('estimated-1rm').allInnerTexts();
  expect(estimates.some((t) => /kg 1RM/.test(t))).toBe(true);
});
