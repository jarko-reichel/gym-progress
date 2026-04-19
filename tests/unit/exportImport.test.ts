import { exportToCsv, exportToJsonString, validateImport, type ExportPayload } from '../../src/domain/exportImport';

const payload: ExportPayload = {
  schemaVersion: 1,
  exportedAt: '2026-04-19T10:00:00.000Z',
  exercises: [
    {
      id: 'e1',
      name: 'Drep s činkou',
      muscleGroup: 'legs',
      category: 'compound',
      isCustom: false,
      createdAt: '2026-04-01T00:00:00.000Z',
    },
  ],
  workouts: [
    {
      id: 'w1',
      date: '2026-04-19',
      startedAt: '2026-04-19T10:00:00.000Z',
      name: 'Push A',
    },
  ],
  sets: [
    {
      id: 's1',
      workoutId: 'w1',
      exerciseId: 'e1',
      orderIndex: 0,
      weight: 100,
      reps: 5,
      estimatedOneRm: 116.7,
      completedAt: '2026-04-19T10:01:00.000Z',
      rpe: 7,
    },
  ],
  templates: [],
  prs: [],
  settings: null,
};

describe('export/import', () => {
  test('JSON export round-trips', () => {
    const json = exportToJsonString(payload);
    const parsed = JSON.parse(json);
    const v = validateImport(parsed);
    expect(v.ok).toBe(true);
  });

  test('CSV uses ; separator and includes header', () => {
    const csv = exportToCsv(payload);
    const [header, row] = csv.split('\n');
    expect(header.split(';')).toContain('weight');
    expect(row).toContain('100');
    expect(row).toContain('Drep s činkou');
  });

  test('rejects invalid schema version', () => {
    const v = validateImport({ schemaVersion: 99 });
    expect(v.ok).toBe(false);
  });

  test('rejects non-object', () => {
    expect(validateImport(null).ok).toBe(false);
    expect(validateImport('foo').ok).toBe(false);
  });

  test('rejects when sets array missing', () => {
    const v = validateImport({
      schemaVersion: 1,
      exercises: [],
      workouts: [],
      templates: [],
      prs: [],
    });
    expect(v.ok).toBe(false);
  });
});
