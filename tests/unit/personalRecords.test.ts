import { detectNewPrs } from '../../src/domain/personalRecords';
import type { SetEntry, PersonalRecord } from '../../src/db/schema';

const mk = (overrides: Partial<SetEntry> = {}): SetEntry => ({
  id: overrides.id ?? `s-${Math.random()}`,
  workoutId: 'w1',
  exerciseId: 'ex1',
  orderIndex: 0,
  weight: 100,
  reps: 5,
  estimatedOneRm: 116.7,
  completedAt: '2026-04-19T10:00:00.000Z',
  ...overrides,
});

describe('detectNewPrs', () => {
  test('first ever set yields all three PRs', () => {
    const newSet = mk({ id: 'new', weight: 100, reps: 5, estimatedOneRm: 116.7 });
    const prs = detectNewPrs(newSet, [newSet], []);
    const types = prs.map((p) => p.type).sort();
    expect(types).toEqual(['best_set', 'one_rm', 'volume']);
  });

  test('same lift, no new PR', () => {
    const old = mk({ id: 'old', weight: 100, reps: 5, estimatedOneRm: 116.7 });
    const same = mk({ id: 'new', weight: 100, reps: 5, estimatedOneRm: 116.7 });
    const existing: PersonalRecord[] = [
      { id: 'p1', exerciseId: 'ex1', type: 'one_rm', value: 116.7, achievedAt: 'x', workoutId: 'w' },
      { id: 'p2', exerciseId: 'ex1', type: 'best_set', value: 100, repsContext: 5, achievedAt: 'x', workoutId: 'w' },
      { id: 'p3', exerciseId: 'ex1', type: 'volume', value: 500, achievedAt: 'x', workoutId: 'w' },
    ];
    expect(detectNewPrs(same, [old, same], existing)).toEqual([]);
  });

  test('new heavier set creates PRs', () => {
    const old = mk({ id: 'old', weight: 100, reps: 5, estimatedOneRm: 116.7 });
    const big = mk({ id: 'new', weight: 110, reps: 5, estimatedOneRm: 128.3 });
    const prs = detectNewPrs(big, [old, big], []);
    expect(prs.find((p) => p.type === 'one_rm')?.value).toBe(128.3);
    expect(prs.find((p) => p.type === 'best_set')?.value).toBe(110);
    expect(prs.find((p) => p.type === 'volume')?.value).toBe(550);
  });
});
