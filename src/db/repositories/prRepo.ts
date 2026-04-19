import { db, type PersonalRecord } from '../schema';
import { uuid } from '@/utils/uuid';

export const prRepo = {
  byExercise: (exerciseId: string) => db.prs.where('exerciseId').equals(exerciseId).toArray(),
  list: () => db.prs.orderBy('achievedAt').reverse().toArray(),
  add: async (data: Omit<PersonalRecord, 'id'>): Promise<PersonalRecord> => {
    const pr: PersonalRecord = { id: uuid(), ...data };
    await db.prs.add(pr);
    return pr;
  },
  remove: (id: string) => db.prs.delete(id),
};
