import {
  db,
  type Exercise,
  type PersonalRecord,
  type SetEntry,
  type Workout,
  type WorkoutTemplate,
} from './schema';
import { uuid } from '@/utils/uuid';
import { estimateOneRm } from '@/domain/oneRm';
import { detectNewPrs } from '@/domain/personalRecords';

interface ExercisePlan {
  matcher: (name: string) => boolean;
  baseWeight: number;
  weeklyIncrement: number;
  sets: number;
  reps: number;
  rpe?: number;
}

interface SessionPlan {
  name: string;
  dayOfWeek: 1 | 3 | 5; // Mon/Wed/Fri
  exercises: ExercisePlan[];
}

const PLAN: SessionPlan[] = [
  {
    name: 'Push A',
    dayOfWeek: 1,
    exercises: [
      { matcher: (n) => n === 'Tlak v ľahu', baseWeight: 60, weeklyIncrement: 2.5, sets: 3, reps: 5, rpe: 7 },
      { matcher: (n) => n === 'Tlak nad hlavu s činkou', baseWeight: 35, weeklyIncrement: 1.25, sets: 3, reps: 6, rpe: 7.5 },
      { matcher: (n) => n === 'Tlak v ľahu s jednoručkami', baseWeight: 22.5, weeklyIncrement: 1.25, sets: 3, reps: 8, rpe: 8 },
      { matcher: (n) => n === 'Tricepsový push-down', baseWeight: 25, weeklyIncrement: 1, sets: 3, reps: 10, rpe: 8 },
    ],
  },
  {
    name: 'Pull A',
    dayOfWeek: 3,
    exercises: [
      { matcher: (n) => n === 'Mŕtvy ťah', baseWeight: 90, weeklyIncrement: 5, sets: 3, reps: 5, rpe: 7 },
      { matcher: (n) => n === 'Príťahy s činkou v predklone', baseWeight: 50, weeklyIncrement: 2.5, sets: 3, reps: 6, rpe: 7.5 },
      { matcher: (n) => n === 'Príťahy jednoručky', baseWeight: 22.5, weeklyIncrement: 1.25, sets: 3, reps: 8, rpe: 8 },
      { matcher: (n) => n === 'Bicepsové zdvihy s činkou', baseWeight: 25, weeklyIncrement: 1.25, sets: 3, reps: 10, rpe: 8 },
    ],
  },
  {
    name: 'Legs A',
    dayOfWeek: 5,
    exercises: [
      { matcher: (n) => n === 'Drep s činkou', baseWeight: 80, weeklyIncrement: 2.5, sets: 3, reps: 5, rpe: 7.5 },
      { matcher: (n) => n === 'Mŕtvy ťah rumunský', baseWeight: 70, weeklyIncrement: 2.5, sets: 3, reps: 8, rpe: 7 },
      { matcher: (n) => n === 'Bulharský drep', baseWeight: 20, weeklyIncrement: 1.25, sets: 3, reps: 10, rpe: 8 },
      { matcher: (n) => n === 'Výpony na lýtka', baseWeight: 60, weeklyIncrement: 2.5, sets: 4, reps: 12, rpe: 8 },
    ],
  },
];

const WEEKS = 8;

function isoAt(year: number, month: number, day: number, hour: number): string {
  const d = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  return d.toISOString();
}

function findMatchingExercise(
  exercises: Exercise[],
  plan: ExercisePlan,
): Exercise | undefined {
  return exercises.find((e) => plan.matcher(e.name));
}

export async function loadDemoData(): Promise<{
  workouts: number;
  sets: number;
  prs: number;
}> {
  const formula = (await db.settings.get('singleton'))?.oneRmFormula ?? 'epley';
  const exercises = await db.exercises.toArray();

  const today = new Date();
  const monday = new Date(today);
  const day = monday.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const startMonday = new Date(monday);
  startMonday.setUTCDate(startMonday.getUTCDate() - (WEEKS - 1) * 7);

  const workoutsToAdd: Workout[] = [];
  const setsToAdd: SetEntry[] = [];

  for (let w = 0; w < WEEKS; w++) {
    for (const session of PLAN) {
      const sessionDate = new Date(startMonday);
      sessionDate.setUTCDate(sessionDate.getUTCDate() + w * 7 + (session.dayOfWeek - 1));
      if (sessionDate > today) continue;

      const dateStr = sessionDate.toISOString().slice(0, 10);
      const startedAt = isoAt(
        sessionDate.getUTCFullYear(),
        sessionDate.getUTCMonth() + 1,
        sessionDate.getUTCDate(),
        17,
      );
      const endedAt = new Date(new Date(startedAt).getTime() + 65 * 60 * 1000).toISOString();
      const workoutId = uuid();
      workoutsToAdd.push({
        id: workoutId,
        date: dateStr,
        startedAt,
        endedAt,
        name: `${session.name} · týždeň ${w + 1}`,
      });

      let order = 0;
      for (const exPlan of session.exercises) {
        const ex = findMatchingExercise(exercises, exPlan);
        if (!ex) continue;
        const weight = exPlan.baseWeight + w * exPlan.weeklyIncrement;
        for (let s = 0; s < exPlan.sets; s++) {
          const variance = s === exPlan.sets - 1 ? -2.5 : 0;
          const finalWeight = Math.max(0, weight + variance);
          const completedAt = new Date(
            new Date(startedAt).getTime() + order * 3 * 60 * 1000,
          ).toISOString();
          setsToAdd.push({
            id: uuid(),
            workoutId,
            exerciseId: ex.id,
            orderIndex: order,
            weight: finalWeight,
            reps: exPlan.reps,
            rpe: exPlan.rpe,
            completedAt,
            estimatedOneRm: estimateOneRm(finalWeight, exPlan.reps, formula),
          });
          order++;
        }
      }
    }
  }

  await db.workouts.bulkAdd(workoutsToAdd);
  await db.sets.bulkAdd(setsToAdd);

  const setsByExercise = new Map<string, SetEntry[]>();
  for (const s of setsToAdd) {
    if (!setsByExercise.has(s.exerciseId)) setsByExercise.set(s.exerciseId, []);
    setsByExercise.get(s.exerciseId)!.push(s);
  }

  const prsToAdd: PersonalRecord[] = [];
  for (const [exerciseId, exSets] of setsByExercise) {
    exSets.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
    const history: SetEntry[] = [];
    const existing: PersonalRecord[] = [];
    for (const s of exSets) {
      const candidates = detectNewPrs(s, history, [...existing, ...prsToAdd.filter((p) => p.exerciseId === exerciseId)]);
      for (const c of candidates) {
        prsToAdd.push({
          id: uuid(),
          exerciseId,
          type: c.type,
          value: c.value,
          repsContext: c.repsContext,
          achievedAt: s.completedAt,
          workoutId: s.workoutId,
          setId: s.id,
        });
      }
      history.push(s);
    }
  }
  if (prsToAdd.length) await db.prs.bulkAdd(prsToAdd);

  const templatesToAdd: WorkoutTemplate[] = [];
  for (const session of PLAN) {
    const templateExercises = session.exercises
      .map((p) => findMatchingExercise(exercises, p))
      .filter((e): e is Exercise => Boolean(e))
      .map((e, idx) => {
        const plan = session.exercises[idx]!;
        return {
          exerciseId: e.id,
          targetSets: plan.sets,
          targetRepsMin: plan.reps,
          targetRepsMax: plan.reps + 2,
          targetRpe: plan.rpe,
        };
      });
    templatesToAdd.push({
      id: uuid(),
      name: session.name,
      exercises: templateExercises,
      createdAt: new Date().toISOString(),
    });
  }
  await db.templates.bulkAdd(templatesToAdd);

  return { workouts: workoutsToAdd.length, sets: setsToAdd.length, prs: prsToAdd.length };
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.workouts, db.sets, db.prs, db.templates], async () => {
    await db.workouts.clear();
    await db.sets.clear();
    await db.prs.clear();
    await db.templates.clear();
  });
}
