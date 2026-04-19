import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercise } from '@/db/schema';

const EMPTY: Exercise[] = [];

export function useExercises(): Exercise[] {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray(), [], EMPTY);
}

export function useExercise(id: string | undefined): Exercise | undefined {
  return useLiveQuery(async () => (id ? await db.exercises.get(id) : undefined), [id], undefined);
}
