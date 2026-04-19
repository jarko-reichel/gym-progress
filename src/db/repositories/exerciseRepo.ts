import { db, type Exercise, type MuscleGroup } from '../schema';
import { uuid } from '@/utils/uuid';

export const exerciseRepo = {
  list: () => db.exercises.orderBy('name').toArray(),
  get: (id: string) => db.exercises.get(id),
  byMuscleGroup: (mg: MuscleGroup) => db.exercises.where('muscleGroup').equals(mg).toArray(),
  search: async (query: string): Promise<Exercise[]> => {
    const all = await db.exercises.toArray();
    const q = query.toLowerCase().trim();
    if (!q) return all.sort((a, b) => a.name.localeCompare(b.name));
    return all
      .filter((e) => e.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  create: async (data: Omit<Exercise, 'id' | 'createdAt' | 'isCustom'>): Promise<Exercise> => {
    const exercise: Exercise = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      isCustom: true,
      ...data,
    };
    await db.exercises.add(exercise);
    return exercise;
  },
  update: (id: string, patch: Partial<Exercise>) => db.exercises.update(id, patch),
  remove: (id: string) => db.exercises.delete(id),
};
