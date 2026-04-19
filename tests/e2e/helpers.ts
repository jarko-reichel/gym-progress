import type { Page } from '@playwright/test';

export async function clearDb(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('gym-progress');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

export async function visitAndWait(page: Page, url = '/'): Promise<void> {
  await page.goto(url);
  // wait for app to finish seeding
  await page.waitForSelector('nav', { timeout: 10_000 });
}
