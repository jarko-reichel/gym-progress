import { db, type SetEntry } from '../schema';
import { uuid } from '@/utils/uuid';
import { estimateOneRm, type OneRmFormulaName } from '@/domain/oneRm';

export const setRepo = {
  byWorkout: (workoutId: string) =>
    db.sets.where('workoutId').equals(workoutId).sortBy('orderIndex'),
  byExercise: (exerciseId: string) => db.sets.where('exerciseId').equals(exerciseId).toArray(),
  byExerciseChrono: (exerciseId: string) =>
    db.sets.where('[exerciseId+completedAt]').between([exerciseId, ''], [exerciseId, '\uffff']).toArray(),
  get: (id: string) => db.sets.get(id),
  create: async (
    data: Omit<SetEntry, 'id' | 'estimatedOneRm' | 'completedAt'> & { completedAt?: string },
    formula: OneRmFormulaName,
  ): Promise<SetEntry> => {
    const set: SetEntry = {
      id: uuid(),
      completedAt: data.completedAt ?? new Date().toISOString(),
      estimatedOneRm: estimateOneRm(data.weight, data.reps, formula),
      workoutId: data.workoutId,
      exerciseId: data.exerciseId,
      orderIndex: data.orderIndex,
      weight: data.weight,
      reps: data.reps,
      rpe: data.rpe,
      tempo: data.tempo,
    };
    await db.sets.add(set);
    return set;
  },
  update: async (id: string, patch: Partial<SetEntry>, formula: OneRmFormulaName) => {
    const existing = await db.sets.get(id);
    if (!existing) return;
    const merged = { ...existing, ...patch };
    merged.estimatedOneRm = estimateOneRm(merged.weight, merged.reps, formula);
    await db.sets.put(merged);
  },
  remove: (id: string) => db.sets.delete(id),
};
