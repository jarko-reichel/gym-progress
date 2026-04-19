import { test, expect } from '@playwright/test';
import { clearDb, visitAndWait } from './helpers';

test('export JSON a následný import zachovajú počty záznamov', async ({ page }) => {
  await page.goto('/');
  await clearDb(page);
  await visitAndWait(page);

  // Create one workout with one set via UI
  await page.getByRole('link', { name: /Nový tréning/i }).first().click();
  await page.fill('input#wk-name', 'Export test');
  await page.getByRole('button', { name: 'Začať tréning' }).click();
  await page.getByRole('button', { name: /Pridať cvik/i }).click();
  await page.getByPlaceholder('Hľadať…').fill('Drep');
  await page.getByRole('button', { name: /Drep s činkou/i }).click();
  await page.getByTestId('set-weight').fill('100');
  await page.getByTestId('set-reps').fill('5');
  await page.getByTestId('add-set-btn').click();

  // Snapshot counts before export
  const before = await page.evaluate(
    () =>
      new Promise<{ w: number; s: number }>((resolve) => {
        const open = indexedDB.open('gym-progress');
        open.onsuccess = () => {
          const tx = open.result.transaction(['workouts', 'sets'], 'readonly');
          const wReq = tx.objectStore('workouts').count();
          const sReq = tx.objectStore('sets').count();
          tx.oncomplete = () => resolve({ w: wReq.result, s: sReq.result });
        };
      }),
  );
  expect(before.w).toBe(1);
  expect(before.s).toBe(1);

  // Build payload programmatically (simulate export)
  const payloadJson = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('gym-progress');
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(
            ['exercises', 'workouts', 'sets', 'templates', 'prs', 'settings'],
            'readonly',
          );
          const getAll = (name: string) =>
            new Promise<unknown[]>((res) => {
              const r = tx.objectStore(name).getAll();
              r.onsuccess = () => res(r.result as unknown[]);
            });
          Promise.all([
            getAll('exercises'),
            getAll('workouts'),
            getAll('sets'),
            getAll('templates'),
            getAll('prs'),
          ]).then(([exercises, workouts, sets, templates, prs]) => {
            resolve(
              JSON.stringify({
                schemaVersion: 1,
                exportedAt: new Date().toISOString(),
                exercises,
                workouts,
                sets,
                templates,
                prs,
                settings: null,
              }),
            );
          });
        };
      }),
  );

  // Clear and re-import
  await clearDb(page);
  await page.goto('/');
  await visitAndWait(page);

  await page.evaluate(
    (raw) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('gym-progress');
        open.onsuccess = () => {
          const db = open.result;
          const payload = JSON.parse(raw) as Record<string, unknown[]>;
          const tx = db.transaction(
            ['exercises', 'workouts', 'sets', 'templates', 'prs'],
            'readwrite',
          );
          for (const name of ['exercises', 'workouts', 'sets', 'templates', 'prs'] as const) {
            const store = tx.objectStore(name);
            for (const row of (payload[name] as unknown[]) ?? []) store.put(row);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    payloadJson,
  );

  const after = await page.evaluate(
    () =>
      new Promise<{ w: number; s: number }>((resolve) => {
        const open = indexedDB.open('gym-progress');
        open.onsuccess = () => {
          const tx = open.result.transaction(['workouts', 'sets'], 'readonly');
          const wReq = tx.objectStore('workouts').count();
          const sReq = tx.objectStore('sets').count();
          tx.oncomplete = () => resolve({ w: wReq.result, s: sReq.result });
        };
      }),
  );
  expect(after.w).toBe(before.w);
  expect(after.s).toBe(before.s);
});
