import { test, expect } from '@playwright/test';
import { visitAndWait } from './helpers';

test('graf 1RM progresu sa zobrazí po 2+ sessionoch', async ({ page }) => {
  await page.goto('/');
  // Seed 2 workouts with sets directly via IndexedDB
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('gym-progress');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
  await visitAndWait(page);
  // pick first exercise id
  const exerciseId = await page.evaluate(async () => {
    const { db } = await import('/src/db/schema.ts' as string).catch(() => ({ db: null }));
    void db;
    // fallback: open DB manually
    return await new Promise<string>((resolve) => {
      const open = indexedDB.open('gym-progress');
      open.onsuccess = () => {
        const tx = open.result.transaction('exercises', 'readonly');
        const req = tx.objectStore('exercises').getAll();
        req.onsuccess = () => {
          const items = req.result as { id: string; name: string }[];
          const drep = items.find((e) => e.name.includes('Drep'))!;
          resolve(drep.id);
        };
      };
    });
  });

  // inject two workouts + sets
  await page.evaluate(async (exId) => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('gym-progress');
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(['workouts', 'sets'], 'readwrite');
        const w1 = { id: 'w1', date: '2026-04-12', startedAt: '2026-04-12T10:00:00.000Z', name: 'A' };
        const w2 = { id: 'w2', date: '2026-04-19', startedAt: '2026-04-19T10:00:00.000Z', name: 'B' };
        tx.objectStore('workouts').put(w1);
        tx.objectStore('workouts').put(w2);
        tx.objectStore('sets').put({
          id: 's1',
          workoutId: 'w1',
          exerciseId: exId,
          orderIndex: 0,
          weight: 100,
          reps: 5,
          estimatedOneRm: 116.7,
          completedAt: '2026-04-12T10:00:00.000Z',
        });
        tx.objectStore('sets').put({
          id: 's2',
          workoutId: 'w2',
          exerciseId: exId,
          orderIndex: 0,
          weight: 105,
          reps: 5,
          estimatedOneRm: 122.5,
          completedAt: '2026-04-19T10:00:00.000Z',
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }, exerciseId);

  await page.goto(`/exercises/${exerciseId}`);
  await expect(page.getByTestId('progress-chart')).toBeVisible();
  await expect(page.locator('svg.recharts-surface')).toBeVisible();
});
