import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WorkoutTemplate } from '@/db/schema';

const EMPTY: WorkoutTemplate[] = [];

export function useTemplates(): WorkoutTemplate[] {
  return useLiveQuery(() => db.templates.orderBy('name').toArray(), [], EMPTY);
}

export function useTemplate(id: string | undefined): WorkoutTemplate | undefined {
  return useLiveQuery(
    async () => (id ? await db.templates.get(id) : undefined),
    [id],
    undefined,
  );
}
