#!/usr/bin/env tsx
import { chromium, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

async function clearDb(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('gym-progress');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

async function shot(page: Page, file: string) {
  const outPath = path.join(outDir, file);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`  → ${file}`);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, theme);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    baseURL: BASE,
    locale: 'sk-SK',
  });
  const page = await context.newPage();

  await page.goto('/');
  await clearDb(page);
  await page.goto('/');
  await page.waitForSelector('nav', { timeout: 15000 });
  await page.waitForTimeout(600);

  console.log('▼ Dashboard (light)');
  await setTheme(page, 'light');
  await shot(page, '01_dashboard_light.png');

  console.log('▼ Dashboard (dark)');
  await setTheme(page, 'dark');
  await shot(page, '02_dashboard_dark.png');
  await setTheme(page, 'light');

  console.log('▼ New workout');
  await page.goto('/workouts/new');
  await page.waitForTimeout(400);
  await shot(page, '03_new_workout.png');

  console.log('▼ Active workout with sets');
  await page.fill('input#wk-name', 'Push A · demo');
  await page.getByRole('button', { name: 'Začať tréning' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Pridať cvik/i }).click();
  await page.getByPlaceholder('Hľadať…').fill('Drep');
  await page.getByRole('button', { name: /Drep s činkou/i }).first().click();
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
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(300);
  await shot(page, '04_active_workout.png');

  console.log('▼ Exercises list');
  await page.goto('/exercises');
  await page.waitForTimeout(400);
  await shot(page, '05_exercises_list.png');

  console.log('▼ Exercise detail — progress');
  await page.locator('a', { hasText: 'Drep s činkou' }).first().click();
  await page.waitForTimeout(700);
  await shot(page, '06_exercise_detail_progress.png');

  console.log('▼ Settings');
  await page.goto('/settings');
  await page.waitForTimeout(400);
  await shot(page, '07_settings.png');

  console.log('▼ Offline banner');
  await page.goto('/');
  await page.waitForTimeout(400);
  await context.setOffline(true);
  await page.addStyleTag({
    content: `#fake-offline{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#f97316;color:#fff;padding:8px 14px;border-radius:9999px;font-family:system-ui;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999}`,
  });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'fake-offline';
    el.textContent = 'Offline režim · dáta sa ukladajú lokálne';
    document.body.appendChild(el);
  });
  await page.waitForTimeout(300);
  await shot(page, '08_offline_mode.png');
  await page.evaluate(() => document.querySelector('#fake-offline')?.remove());
  await context.setOffline(false);

  console.log('▼ Install-prompt mock');
  await page.goto('/');
  await page.waitForTimeout(400);
  await page.addStyleTag({
    content: `#fake-install{position:fixed;inset:auto 16px 24px 16px;background:#0f766e;color:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 10px 20px rgba(0,0,0,.3);font-family:system-ui;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:9999} #fake-install b{font-weight:600}`,
  });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'fake-install';
    el.innerHTML =
      '<div><b>Nainštaluj Gym Progress</b><div style="font-size:12px;opacity:.9">Rýchlejší prístup, funguje offline.</div></div><button style="background:white;color:#0f766e;border:0;border-radius:8px;padding:6px 12px;font-weight:600">Nainštalovať</button>';
    document.body.appendChild(el);
  });
  await page.waitForTimeout(300);
  await shot(page, '09_install_prompt.png');

  console.log('▼ Mobile view');
  await page.setViewportSize({ width: 390, height: 820 });
  await page.evaluate(() => document.querySelector('#fake-install')?.remove());
  await page.goto('/');
  await page.waitForTimeout(600);
  await shot(page, '10_pwa_installed.png');

  await browser.close();
  console.log('✔ screenshots generated in', outDir);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
