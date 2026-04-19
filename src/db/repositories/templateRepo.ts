import { db, type WorkoutTemplate } from '../schema';
import { uuid } from '@/utils/uuid';

export const templateRepo = {
  list: () => db.templates.orderBy('name').toArray(),
  get: (id: string) => db.templates.get(id),
  create: async (data: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> => {
    const tpl: WorkoutTemplate = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    await db.templates.add(tpl);
    return tpl;
  },
  update: (id: string, patch: Partial<WorkoutTemplate>) => db.templates.update(id, patch),
  remove: (id: string) => db.templates.delete(id),
};
