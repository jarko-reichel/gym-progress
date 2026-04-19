import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useExercises } from '@/hooks/useExercises';
import { exerciseRepo } from '@/db/repositories/exerciseRepo';
import type { Exercise, MuscleGroup, ExerciseCategory } from '@/db/schema';
import { t } from '@/i18n';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'full_body', 'other',
];

export function ExerciseListScreen() {
  const exercises = useExercises();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | 'all'>('all');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchQ = !query || e.name.toLowerCase().includes(query.toLowerCase());
      const matchF = filter === 'all' || e.muscleGroup === filter;
      return matchQ && matchF;
    });
  }, [exercises, query, filter]);

  return (
    <div>
      <PageHeader
        title={t('exercises.title')}
        actions={
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={16} />
            {t('exercises.custom')}
          </button>
        }
      />
      <div className="px-4 py-4 md:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('exercises.search')}
              className="input pl-9"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as MuscleGroup | 'all')}
            className="input sm:w-48"
          >
            <option value="all">{t('exercises.filterAll')}</option>
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {t(`muscleGroups.${mg}` as never)}
              </option>
            ))}
          </select>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Link
                to={`/exercises/${ex.id}`}
                className="card flex flex-col gap-1 p-3 hover:border-primary-500"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ex.name}</span>
                  {ex.isCustom && (
                    <span className="rounded bg-accent-500/20 px-2 py-0.5 text-[10px] uppercase text-accent-600">
                      vlastný
                    </span>
                  )}
                </div>
                <div className="text-xs text-[rgb(var(--text-muted))]">
                  {t(`muscleGroups.${ex.muscleGroup}` as never)} · {t(`category.${ex.category}` as never)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {creating && (
        <CreateExerciseModal
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            await exerciseRepo.create(data);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CreateExerciseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Pick<Exercise, 'name' | 'muscleGroup' | 'category'>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [category, setCategory] = useState<ExerciseCategory>('compound');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="card w-full max-w-md p-4 sm:rounded-xl">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('exercises.custom')}</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={18} />
          </button>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            void onCreate({ name: name.trim(), muscleGroup, category });
          }}
          className="space-y-3"
        >
          <div>
            <label className="label">{t('exercises.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="input" />
          </div>
          <div>
            <label className="label">{t('exercises.muscleGroup')}</label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              className="input"
            >
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {t(`muscleGroups.${mg}` as never)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('exercises.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              className="input"
            >
              <option value="compound">{t('category.compound')}</option>
              <option value="isolation">{t('category.isolation')}</option>
              <option value="activation">{t('category.activation')}</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary">{t('common.save')}</button>
            <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
