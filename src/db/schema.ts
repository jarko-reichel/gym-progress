import Dexie, { type Table } from 'dexie';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core'
  | 'full_body'
  | 'other';

export type ExerciseCategory = 'compound' | 'isolation' | 'activation';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  isCustom: boolean;
  createdAt: string;
}

export interface Workout {
  id: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  name?: string;
  templateId?: string;
  note?: string;
}

export interface SetEntry {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  weight: number;
  reps: number;
  rpe?: number;
  tempo?: string;
  completedAt: string;
  estimatedOneRm: number;
}

export interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
}

export type PrType = 'one_rm' | 'volume' | 'best_set';

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: PrType;
  value: number;
  repsContext?: number;
  achievedAt: string;
  workoutId: string;
  setId?: string;
}

export type OneRmFormula = 'epley' | 'brzycki' | 'lesuer';

export interface UserSetting {
  id: 'singleton';
  oneRmFormula: OneRmFormula;
  units: 'kg' | 'lbs';
  theme: 'light' | 'dark' | 'system';
  locale: 'sk' | 'en';
}

export class GymDB extends Dexie {
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  sets!: Table<SetEntry, string>;
  templates!: Table<WorkoutTemplate, string>;
  prs!: Table<PersonalRecord, string>;
  settings!: Table<UserSetting, string>;

  constructor(name = 'gym-progress') {
    super(name);
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, isCustom',
      workouts: 'id, date, startedAt, templateId',
      sets: 'id, workoutId, exerciseId, completedAt, [exerciseId+completedAt]',
      templates: 'id, name',
      prs: 'id, exerciseId, type, achievedAt',
      settings: 'id',
    });
  }
}

export const db = new GymDB();

export const DEFAULT_SETTINGS: UserSetting = {
  id: 'singleton',
  oneRmFormula: 'epley',
  units: 'kg',
  theme: 'system',
  locale: 'sk',
};
