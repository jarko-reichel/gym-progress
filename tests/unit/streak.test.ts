import { calculateStreak, workoutsInLastDays } from '../../src/domain/streak';
import type { Workout } from '../../src/db/schema';

const make = (date: string): Workout => ({
  id: date,
  date,
  startedAt: `${date}T10:00:00.000Z`,
});

describe('calculateStreak', () => {
  test('empty list returns 0', () => {
    expect(calculateStreak([], new Date('2026-04-19'))).toBe(0);
  });
  test('today + yesterday = 2', () => {
    const ws = [make('2026-04-19'), make('2026-04-18')];
    expect(calculateStreak(ws, new Date('2026-04-19T12:00:00Z'))).toBe(2);
  });
  test('skip a day breaks streak', () => {
    const ws = [make('2026-04-19'), make('2026-04-17')];
    expect(calculateStreak(ws, new Date('2026-04-19T12:00:00Z'))).toBe(1);
  });
  test('today missing but yesterday present counts from yesterday', () => {
    const ws = [make('2026-04-18'), make('2026-04-17')];
    expect(calculateStreak(ws, new Date('2026-04-19T12:00:00Z'))).toBe(2);
  });
});

describe('workoutsInLastDays', () => {
  test('counts only within window', () => {
    const ws = [make('2026-04-19'), make('2026-04-15'), make('2026-04-10')];
    expect(workoutsInLastDays(ws, 7, new Date('2026-04-19T12:00:00Z'))).toBe(2);
    expect(workoutsInLastDays(ws, 30, new Date('2026-04-19T12:00:00Z'))).toBe(3);
  });
});
