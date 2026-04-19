import { db, type Exercise, type SetEntry, type Workout, type WorkoutTemplate, type PersonalRecord, type UserSetting } from '@/db/schema';

export interface ExportPayload {
  schemaVersion: 1;
  exportedAt: string;
  exercises: Exercise[];
  workouts: Workout[];
  sets: SetEntry[];
  templates: WorkoutTemplate[];
  prs: PersonalRecord[];
  settings: UserSetting | null;
}

export async function buildExport(): Promise<ExportPayload> {
  const [exercises, workouts, sets, templates, prs, settingsRow] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.templates.toArray(),
    db.prs.toArray(),
    db.settings.get('singleton'),
  ]);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    sets,
    templates,
    prs,
    settings: settingsRow ?? null,
  };
}

export function exportToJsonString(payload: ExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function exportToCsv(payload: ExportPayload): string {
  // sets-centric CSV with denormalized exercise + workout fields
  const exMap = new Map(payload.exercises.map((e) => [e.id, e]));
  const woMap = new Map(payload.workouts.map((w) => [w.id, w]));
  const headers = [
    'workoutDate',
    'workoutName',
    'exerciseName',
    'muscleGroup',
    'orderIndex',
    'weight',
    'reps',
    'rpe',
    'estimatedOneRm',
    'completedAt',
  ];
  const rows = payload.sets.map((s) => {
    const ex = exMap.get(s.exerciseId);
    const wo = woMap.get(s.workoutId);
    return [
      wo?.date ?? '',
      wo?.name ?? '',
      ex?.name ?? '',
      ex?.muscleGroup ?? '',
      s.orderIndex,
      s.weight,
      s.reps,
      s.rpe ?? '',
      s.estimatedOneRm,
      s.completedAt,
    ]
      .map(csvCell)
      .join(';');
  });
  return [headers.join(';'), ...rows].join('\n');
}

function csvCell(v: string | number): string {
  const s = String(v);
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function validateImport(json: unknown): { ok: true; data: ExportPayload } | { ok: false; reason: string } {
  if (typeof json !== 'object' || json === null) return { ok: false, reason: 'JSON musí byť objekt' };
  const obj = json as Record<string, unknown>;
  if (obj.schemaVersion !== 1) return { ok: false, reason: 'Nepodporovaná verzia schémy' };
  for (const key of ['exercises', 'workouts', 'sets', 'templates', 'prs'] as const) {
    if (!Array.isArray(obj[key])) return { ok: false, reason: `Pole "${key}" chýba` };
  }
  return { ok: true, data: obj as unknown as ExportPayload };
}

export async function applyImport(payload: ExportPayload, mode: 'merge' | 'replace' = 'merge'): Promise<void> {
  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.sets, db.templates, db.prs, db.settings],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.exercises.clear(),
          db.workouts.clear(),
          db.sets.clear(),
          db.templates.clear(),
          db.prs.clear(),
        ]);
      }
      await db.exercises.bulkPut(payload.exercises);
      await db.workouts.bulkPut(payload.workouts);
      await db.sets.bulkPut(payload.sets);
      await db.templates.bulkPut(payload.templates);
      await db.prs.bulkPut(payload.prs);
      if (payload.settings) await db.settings.put(payload.settings);
    },
  );
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
