import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useExercises } from '@/hooks/useExercises';
import { useSettings } from '@/hooks/useSettings';
import { useWorkout, useWorkoutSets } from '@/hooks/useWorkouts';
import { setRepo } from '@/db/repositories/setRepo';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import { prRepo } from '@/db/repositories/prRepo';
import { db, type Exercise, type SetEntry } from '@/db/schema';
import { detectNewPrs } from '@/domain/personalRecords';
import { estimateOneRm } from '@/domain/oneRm';
import { useUiStore } from '@/state/uiStore';
import { totalVolume } from '@/domain/volume';
import { t } from '@/i18n';

export function ActiveWorkoutScreen() {
  const { id } = useParams<{ id: string }>();
  const workout = useWorkout(id);
  const sets = useWorkoutSets(id);
  const exercises = useExercises();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [addedExerciseIds, setAddedExerciseIds] = useState<string[]>([]);

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const grouped = useMemo(() => {
    const map = new Map<string, SetEntry[]>();
    for (const s of sets) {
      if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
      map.get(s.exerciseId)!.push(s);
    }
    for (const eid of addedExerciseIds) {
      if (!map.has(eid)) map.set(eid, []);
    }
    return Array.from(map.entries());
  }, [sets, addedExerciseIds]);

  if (!workout) return <div className="p-4">{t('common.loading')}</div>;

  const addExercise = (ex: Exercise) => {
    setPickerOpen(false);
    setFilter('');
    setAddedExerciseIds((prev) => (prev.includes(ex.id) ? prev : [...prev, ex.id]));
    showToast(`${ex.name} pridaný`, 'info');
  };

  const finishWorkout = async () => {
    await workoutRepo.update(workout.id, { endedAt: new Date().toISOString() });
    navigate(`/workouts/${workout.id}`);
  };

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const exercisesInWorkout = grouped.map(([eid]) => eid);
  const availableExercises = filteredExercises.filter((e) => !exercisesInWorkout.includes(e.id));

  return (
    <div>
      <PageHeader
        title={workout.name ?? t('workouts.title')}
        subtitle={`${grouped.length} ${t('workouts.exercises')} · ${sets.length} ${t('workouts.sets')} · ${Math.round(totalVolume(sets))} kg`}
        actions={
          <button onClick={finishWorkout} className="btn-primary">
            {t('workouts.finish')}
          </button>
        }
      />
      <div className="px-4 py-4 md:px-8">
        {grouped.length === 0 && (
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">
            Žiadne cviky. Pridaj prvý nižšie.
          </div>
        )}
        <ul className="space-y-4">
          {grouped.map(([eid, exSets]) => {
            const ex = exerciseMap.get(eid);
            return (
              <li key={eid} className="card p-4">
                <header className="mb-3 flex items-center justify-between">
                  <Link to={`/exercises/${eid}`} className="font-semibold hover:underline">
                    {ex?.name ?? '?'}
                  </Link>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {exSets.length} {t('workouts.sets')}
                  </span>
                </header>
                <SetTable sets={exSets} />
                <SetForm
                  workoutId={workout.id}
                  exerciseId={eid}
                  defaultOrder={exSets.length}
                  onSaved={async (saved) => {
                    const allHistory = await db.sets
                      .where('exerciseId')
                      .equals(eid)
                      .toArray();
                    const existingPrs = await prRepo.byExercise(eid);
                    const candidates = detectNewPrs(saved, allHistory, existingPrs);
                    for (const c of candidates) {
                      await prRepo.add({
                        exerciseId: eid,
                        type: c.type,
                        value: c.value,
                        repsContext: c.repsContext,
                        achievedAt: saved.completedAt,
                        workoutId: workout.id,
                        setId: saved.id,
                      });
                    }
                    if (candidates.length) {
                      showToast(t('pr.new'), 'success');
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <button onClick={() => setPickerOpen(true)} className="btn-secondary">
            <Plus size={16} />
            {t('workouts.addExercise')}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="card w-full max-w-md p-4 sm:rounded-xl">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t('workouts.addExercise')}</h2>
              <button onClick={() => setPickerOpen(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </header>
            <input
              autoFocus
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('exercises.search')}
              className="input"
            />
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {availableExercises.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => addExercise(ex)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-[rgb(var(--border))]"
                  >
                    <span>{ex.name}</span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {t(`muscleGroups.${ex.muscleGroup}` as never)}
                    </span>
                  </button>
                </li>
              ))}
              {availableExercises.length === 0 && (
                <li className="py-4 text-center text-sm text-[rgb(var(--text-muted))]">
                  Žiadne cviky.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  function SetTable({ sets }: { sets: SetEntry[] }) {
    return (
      <ul className="mb-3 space-y-1">
        {sets.map((s, i) => (
          <li
            key={s.id}
            data-testid="set-row"
            className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <span className="kpi-label w-10">#{i + 1}</span>
            <span className="font-medium">
              {s.weight} kg × {s.reps}
            </span>
            <span className="text-xs text-[rgb(var(--text-muted))]">
              RPE {s.rpe ?? '–'}
            </span>
            <span className="font-medium text-primary-700" data-testid="estimated-1rm">
              ≈ {s.estimatedOneRm} kg 1RM
            </span>
            <button
              onClick={() => setRepo.remove(s.id)}
              className="btn-ghost p-1"
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    );
  }
}

function SetForm({
  workoutId,
  exerciseId,
  defaultOrder,
  onSaved,
}: {
  workoutId: string;
  exerciseId: string;
  defaultOrder: number;
  onSaved: (saved: SetEntry) => void;
}) {
  const { settings } = useSettings();
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<string>('');

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps, 10) || 0;
  const preview = estimateOneRm(w, r, settings.oneRmFormula);

  const submit = async () => {
    if (w <= 0 || r <= 0) return;
    const saved = await setRepo.create(
      {
        workoutId,
        exerciseId,
        orderIndex: defaultOrder,
        weight: w,
        reps: r,
        rpe: rpe ? parseFloat(rpe) : undefined,
      },
      settings.oneRmFormula,
    );
    onSaved(saved);
    setWeight('');
    setReps('');
    setRpe('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="grid grid-cols-12 items-end gap-2"
    >
      <div className="col-span-4">
        <label className="label">{t('workouts.weight')}</label>
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="input"
          data-testid="set-weight"
        />
      </div>
      <div className="col-span-3">
        <label className="label">{t('workouts.reps')}</label>
        <input
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="input"
          data-testid="set-reps"
        />
      </div>
      <div className="col-span-2">
        <label className="label">{t('workouts.rpe')}</label>
        <input
          inputMode="decimal"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          className="input"
          data-testid="set-rpe"
        />
      </div>
      <div className="col-span-3 text-right text-xs text-[rgb(var(--text-muted))]">
        {preview > 0 && (
          <div data-testid="preview-1rm">
            ≈ <strong className="text-primary-700">{preview} kg</strong>
            <br />
            1RM
          </div>
        )}
      </div>
      <div className="col-span-12">
        <button type="submit" className="btn-primary w-full" data-testid="add-set-btn">
          <Plus size={16} />
          {t('workouts.addSet')}
        </button>
      </div>
    </form>
  );
}
