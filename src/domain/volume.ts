import type { SetEntry, Exercise, MuscleGroup } from '@/db/schema';
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';

export const setVolume = (s: Pick<SetEntry, 'weight' | 'reps'>): number => s.weight * s.reps;

export const totalVolume = (sets: ReadonlyArray<Pick<SetEntry, 'weight' | 'reps'>>): number =>
  sets.reduce((acc, s) => acc + setVolume(s), 0);

export interface WeeklyVolumeBucket {
  weekStart: string;
  weekLabel: string;
  total: number;
  byMuscleGroup: Partial<Record<MuscleGroup, number>>;
}

export function weeklyVolume(
  sets: ReadonlyArray<SetEntry>,
  exerciseMap: Map<string, Exercise>,
  weeksBack = 4,
): WeeklyVolumeBucket[] {
  const today = new Date();
  const buckets: WeeklyVolumeBucket[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const ref = subWeeks(today, i);
    const ws = startOfWeek(ref, { weekStartsOn: 1 });
    const we = endOfWeek(ref, { weekStartsOn: 1 });
    buckets.push({
      weekStart: ws.toISOString(),
      weekLabel: format(ws, 'd. MMM', { locale: sk }),
      total: 0,
      byMuscleGroup: {},
    });
  }
  for (const s of sets) {
    const completed = parseISO(s.completedAt);
    for (const b of buckets) {
      const ws = parseISO(b.weekStart);
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      if (isWithinInterval(completed, { start: ws, end: we })) {
        const v = setVolume(s);
        b.total += v;
        const ex = exerciseMap.get(s.exerciseId);
        if (ex) {
          b.byMuscleGroup[ex.muscleGroup] = (b.byMuscleGroup[ex.muscleGroup] ?? 0) + v;
        }
        break;
      }
    }
  }
  return buckets;
}

export function volumeInRange(
  sets: ReadonlyArray<SetEntry>,
  fromIso: string,
  toIso: string,
): number {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  return totalVolume(
    sets.filter((s) => {
      const c = parseISO(s.completedAt);
      return c >= from && c <= to;
    }),
  );
}
