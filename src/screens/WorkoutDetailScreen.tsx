import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/PageHeader';
import { useExercises } from '@/hooks/useExercises';
import { useWorkout, useWorkoutSets } from '@/hooks/useWorkouts';
import { workoutRepo } from '@/db/repositories/workoutRepo';
import type { SetEntry } from '@/db/schema';
import { totalVolume } from '@/domain/volume';
import { t } from '@/i18n';

export function WorkoutDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const workout = useWorkout(id);
  const sets = useWorkoutSets(id);
  const exercises = useExercises();
  const navigate = useNavigate();

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const grouped = useMemo(() => {
    const map = new Map<string, SetEntry[]>();
    for (const s of sets) {
      if (!map.has(s.exerciseId)) map.set(s.exerciseId, []);
      map.get(s.exerciseId)!.push(s);
    }
    return Array.from(map.entries());
  }, [sets]);

  if (!workout) return <div className="p-4">{t('common.loading')}</div>;

  const duplicate = async () => {
    const copy = await workoutRepo.create({
      date: format(new Date(), 'yyyy-MM-dd'),
      startedAt: new Date().toISOString(),
      name: workout.name ? `${workout.name} (kópia)` : undefined,
      templateId: workout.templateId,
    });
    navigate(`/workouts/${copy.id}/active`);
  };

  const remove = async () => {
    if (!confirm(t('workouts.confirmDelete'))) return;
    await workoutRepo.remove(workout.id);
    navigate('/workouts');
  };

  return (
    <div>
      <PageHeader
        title={workout.name ?? 'Tréning'}
        subtitle={format(parseISO(workout.date), 'EEEE d. MMMM yyyy', { locale: sk })}
        actions={
          <>
            <Link to="/workouts" className="btn-ghost">
              <ArrowLeft size={16} /> {t('common.back')}
            </Link>
            {!workout.endedAt && (
              <Link to={`/workouts/${workout.id}/active`} className="btn-secondary">
                Pokračovať
              </Link>
            )}
            <button onClick={duplicate} className="btn-secondary">
              <Copy size={16} /> {t('workouts.duplicate')}
            </button>
            <button onClick={remove} className="btn-danger">
              <Trash2 size={16} /> {t('common.delete')}
            </button>
          </>
        }
      />
      <div className="px-4 py-4 md:px-8">
        <div className="card mb-4 grid grid-cols-3 gap-2 p-4 text-center">
          <div>
            <div className="kpi-label">{t('workouts.exercises')}</div>
            <div className="text-lg font-semibold">{grouped.length}</div>
          </div>
          <div>
            <div className="kpi-label">{t('workouts.sets')}</div>
            <div className="text-lg font-semibold">{sets.length}</div>
          </div>
          <div>
            <div className="kpi-label">{t('workouts.totalVolume')}</div>
            <div className="text-lg font-semibold">{Math.round(totalVolume(sets))} kg</div>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">
            {t('common.empty')}
          </div>
        ) : (
          <ul className="space-y-3">
            {grouped.map(([eid, exSets]) => {
              const ex = exerciseMap.get(eid);
              return (
                <li key={eid} className="card p-4">
                  <Link to={`/exercises/${eid}`} className="font-semibold hover:underline">
                    {ex?.name ?? '?'}
                  </Link>
                  <ul className="mt-2 space-y-1 text-sm">
                    {exSets.map((s, i) => (
                      <li key={s.id} className="flex justify-between">
                        <span className="text-[rgb(var(--text-muted))]">#{i + 1}</span>
                        <span>
                          {s.weight} kg × {s.reps} reps · RPE {s.rpe ?? '–'}
                        </span>
                        <span className="text-primary-700">≈ {s.estimatedOneRm} kg</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
