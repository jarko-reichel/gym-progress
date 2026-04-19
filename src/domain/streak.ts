import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Workout } from '@/db/schema';

/**
 * Counts consecutive days (back from today) on which at least one workout exists.
 * If today has no workout but yesterday does, streak counts from yesterday.
 */
export function calculateStreak(workouts: ReadonlyArray<Workout>, today = new Date()): number {
  if (workouts.length === 0) return 0;
  const dayKeys = new Set(
    workouts.map((w) => parseISO(w.date).toISOString().slice(0, 10)),
  );
  let cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  // Allow today gap: if today missing but yesterday present, start from yesterday.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function workoutsInLastDays(
  workouts: ReadonlyArray<Workout>,
  days: number,
  today = new Date(),
): number {
  return workouts.filter((w) => {
    const d = differenceInCalendarDays(today, parseISO(w.date));
    return d >= 0 && d < days;
  }).length;
}
