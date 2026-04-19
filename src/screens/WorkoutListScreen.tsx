import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { format, parseISO, startOfWeek } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useWorkouts, useAllSets } from '@/hooks/useWorkouts';
import { totalVolume } from '@/domain/volume';
import { t } from '@/i18n';
import type { Workout } from '@/db/schema';

export function WorkoutListScreen() {
  const workouts = useWorkouts();
  const sets = useAllSets();

  const grouped = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const wk = startOfWeek(parseISO(w.date), { weekStartsOn: 1 });
      const key = wk.toISOString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [workouts]);

  return (
    <div>
      <PageHeader
        title={t('workouts.title')}
        actions={
          <Link to="/workouts/new" className="btn-primary">
            <Plus size={16} />
            {t('workouts.new')}
          </Link>
        }
      />
      <div className="px-4 py-4 md:px-8">
        {grouped.length === 0 && (
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] py-10 text-center text-sm text-[rgb(var(--text-muted))]">
            {t('common.empty')}
          </div>
        )}
        {grouped.map(([wk, items]) => (
          <section key={wk} className="mb-6">
            <h2 className="kpi-label mb-2">
              {t('common.week')} · {format(parseISO(wk), 'd. MMM', { locale: sk })}
            </h2>
            <ul className="space-y-2">
              {items.map((w) => {
                const setsForW = sets.filter((s) => s.workoutId === w.id);
                const exCount = new Set(setsForW.map((s) => s.exerciseId)).size;
                const vol = totalVolume(setsForW);
                return (
                  <li key={w.id}>
                    <Link
                      to={`/workouts/${w.id}`}
                      className="card flex items-center justify-between p-4 hover:border-primary-500"
                    >
                      <div>
                        <div className="font-medium">{w.name ?? 'Tréning'}</div>
                        <div className="text-xs text-[rgb(var(--text-muted))]">
                          {format(parseISO(w.date), 'EEEE d. MMM', { locale: sk })}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[rgb(var(--text-muted))]">
                        <div>
                          {exCount} {t('workouts.exercises')} · {setsForW.length} {t('workouts.sets')}
                        </div>
                        <div>{Math.round(vol)} kg</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
