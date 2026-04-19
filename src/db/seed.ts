import { db, DEFAULT_SETTINGS, type Exercise } from './schema';
import { uuid } from '@/utils/uuid';

interface SeedExercise {
  name: string;
  muscleGroup: Exercise['muscleGroup'];
  category: Exercise['category'];
}

const SEED_EXERCISES: SeedExercise[] = [
  { name: 'Drep s činkou', muscleGroup: 'legs', category: 'compound' },
  { name: 'Mŕtvy ťah', muscleGroup: 'back', category: 'compound' },
  { name: 'Mŕtvy ťah rumunský', muscleGroup: 'legs', category: 'compound' },
  { name: 'Tlak v ľahu', muscleGroup: 'chest', category: 'compound' },
  { name: 'Tlak v ľahu s jednoručkami', muscleGroup: 'chest', category: 'compound' },
  { name: 'Tlak nad hlavu s činkou', muscleGroup: 'shoulders', category: 'compound' },
  { name: 'Príťahy s činkou v predklone', muscleGroup: 'back', category: 'compound' },
  { name: 'Príťahy jednoručky', muscleGroup: 'back', category: 'compound' },
  { name: 'Prítahy na hrazde', muscleGroup: 'back', category: 'compound' },
  { name: 'Dipy', muscleGroup: 'chest', category: 'compound' },
  { name: 'Bicepsové zdvihy s činkou', muscleGroup: 'arms', category: 'isolation' },
  { name: 'Bicepsové zdvihy s jednoručkami', muscleGroup: 'arms', category: 'isolation' },
  { name: 'Francúzsky tlak', muscleGroup: 'arms', category: 'isolation' },
  { name: 'Tricepsový push-down', muscleGroup: 'arms', category: 'isolation' },
  { name: 'Bulharský drep', muscleGroup: 'legs', category: 'compound' },
  { name: 'Hip thrust', muscleGroup: 'legs', category: 'compound' },
  { name: 'Výpony na lýtka', muscleGroup: 'legs', category: 'isolation' },
  { name: 'Plank', muscleGroup: 'core', category: 'activation' },
  { name: 'Hanging leg raises', muscleGroup: 'core', category: 'isolation' },
  { name: 'Face pull', muscleGroup: 'shoulders', category: 'isolation' },
];

export async function seedDatabase(): Promise<void> {
  const existing = await db.exercises.count();
  if (existing === 0) {
    const now = new Date().toISOString();
    const records: Exercise[] = SEED_EXERCISES.map((e) => ({
      id: uuid(),
      name: e.name,
      muscleGroup: e.muscleGroup,
      category: e.category,
      isCustom: false,
      createdAt: now,
    }));
    await db.exercises.bulkAdd(records);
  }
  const settings = await db.settings.get('singleton');
  if (!settings) {
    await db.settings.put(DEFAULT_SETTINGS);
  }
}
