import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SetEntry, type Workout } from '@/db/schema';

const EMPTY_SETS: SetEntry[] = [];
const EMPTY_WORKOUTS: Workout[] = [];

export function useWorkouts(): Workout[] {
  return useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), [], EMPTY_WORKOUTS);
}

export function useWorkout(id: string | undefined): Workout | undefined {
  return useLiveQuery(
    async () => (id ? await db.workouts.get(id) : undefined),
    [id],
    undefined,
  );
}

export function useWorkoutSets(workoutId: string | undefined): SetEntry[] {
  return useLiveQuery(
    async () =>
      workoutId
        ? await db.sets.where('workoutId').equals(workoutId).sortBy('orderIndex')
        : EMPTY_SETS,
    [workoutId],
    EMPTY_SETS,
  );
}

export function useExerciseSets(exerciseId: string | undefined): SetEntry[] {
  return useLiveQuery(
    async () =>
      exerciseId
        ? await db.sets.where('exerciseId').equals(exerciseId).sortBy('completedAt')
        : EMPTY_SETS,
    [exerciseId],
    EMPTY_SETS,
  );
}

export function useAllSets(): SetEntry[] {
  return useLiveQuery(() => db.sets.toArray(), [], EMPTY_SETS);
}
