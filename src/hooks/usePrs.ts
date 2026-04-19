import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PersonalRecord } from '@/db/schema';

const EMPTY: PersonalRecord[] = [];

export function useExercisePrs(exerciseId: string | undefined): PersonalRecord[] {
  return useLiveQuery(
    async () =>
      exerciseId ? await db.prs.where('exerciseId').equals(exerciseId).toArray() : EMPTY,
    [exerciseId],
    EMPTY,
  );
}

export function useAllPrs(): PersonalRecord[] {
  return useLiveQuery(() => db.prs.toArray(), [], EMPTY);
}
