import { db, type Workout } from '../schema';
import { uuid } from '@/utils/uuid';

export const workoutRepo = {
  list: () => db.workouts.orderBy('startedAt').reverse().toArray(),
  get: (id: string) => db.workouts.get(id),
  create: async (data: Partial<Workout> & Pick<Workout, 'date' | 'startedAt'>): Promise<Workout> => {
    const workout: Workout = {
      id: uuid(),
      ...data,
    } as Workout;
    await db.workouts.add(workout);
    return workout;
  },
  update: (id: string, patch: Partial<Workout>) => db.workouts.update(id, patch),
  remove: async (id: string) => {
    await db.transaction('rw', db.workouts, db.sets, db.prs, async () => {
      await db.workouts.delete(id);
      await db.sets.where('workoutId').equals(id).delete();
      await db.prs.where('workoutId').equals(id).delete();
    });
  },
  inDateRange: (fromIso: string, toIso: string) =>
    db.workouts.where('startedAt').between(fromIso, toIso, true, true).toArray(),
};
