import { setVolume, totalVolume, volumeInRange } from '../../src/domain/volume';
import type { SetEntry } from '../../src/db/schema';

const set = (overrides: Partial<SetEntry> = {}): SetEntry => ({
  id: overrides.id ?? 's1',
  workoutId: 'w1',
  exerciseId: 'e1',
  orderIndex: 0,
  weight: 100,
  reps: 5,
  completedAt: '2026-04-19T10:00:00.000Z',
  estimatedOneRm: 116.7,
  ...overrides,
});

describe('volume', () => {
  test('setVolume = weight × reps', () => {
    expect(setVolume(set({ weight: 80, reps: 8 }))).toBe(640);
  });

  test('totalVolume sums sets', () => {
    expect(totalVolume([set({ weight: 100, reps: 5 }), set({ weight: 80, reps: 8 })])).toBe(1140);
  });

  test('totalVolume of empty array is 0', () => {
    expect(totalVolume([])).toBe(0);
  });

  test('volumeInRange filters by date', () => {
    const sets = [
      set({ id: 'a', completedAt: '2026-04-19T10:00:00.000Z', weight: 100, reps: 5 }),
      set({ id: 'b', completedAt: '2026-04-12T10:00:00.000Z', weight: 100, reps: 5 }),
    ];
    const v = volumeInRange(sets, '2026-04-15T00:00:00.000Z', '2026-04-20T00:00:00.000Z');
    expect(v).toBe(500);
  });
});
