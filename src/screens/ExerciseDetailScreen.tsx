import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useExercise } from '@/hooks/useExercises';
import { useExerciseSets } from '@/hooks/useWorkouts';
import { useExercisePrs } from '@/hooks/usePrs';
import { setVolume } from '@/domain/volume';
import { t } from '@/i18n';

type Tab = 'progress' | 'volume' | 'records';

export function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const ex = useExercise(id);
  const sets = useExerciseSets(id);
  const prs = useExercisePrs(id);
  const [tab, setTab] = useState<Tab>('progress');

  const progressData = useMemo(
    () =>
      sets
        .slice()
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
        .map((s) => ({
          date: format(parseISO(s.completedAt), 'd. MMM', { locale: sk }),
          oneRm: s.estimatedOneRm,
          weight: s.weight,
          reps: s.reps,
        })),
    [sets],
  );

  const volumeData = useMemo(() => {
    const buckets: { weekLabel: string; volume: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ref = subWeeks(new Date(), i);
      const ws = startOfWeek(ref, { weekStartsOn: 1 });
      const we = endOfWeek(ref, { weekStartsOn: 1 });
      const sum = sets
        .filter((s) => isWithinInterval(parseISO(s.completedAt), { start: ws, end: we }))
        .reduce((acc, s) => acc + setVolume(s), 0);
      buckets.push({ weekLabel: format(ws, 'd. MMM', { locale: sk }), volume: sum });
    }
    return buckets;
  }, [sets]);

  if (!ex) return <div className="p-4">{t('common.loading')}</div>;

  return (
    <div>
      <PageHeader
        title={ex.name}
        subtitle={`${t(`muscleGroups.${ex.muscleGroup}` as never)} · ${t(`category.${ex.category}` as never)}`}
      />
      <div className="border-b border-[rgb(var(--border))] px-4 md:px-8">
        <nav className="flex gap-2" role="tablist">
          {(['progress', 'volume', 'records'] as Tab[]).map((tk) => (
            <button
              key={tk}
              role="tab"
              aria-selected={tab === tk}
              onClick={() => setTab(tk)}
              className={
                tab === tk
                  ? 'border-b-2 border-primary-700 px-3 py-2 text-sm font-medium text-primary-700'
                  : 'border-b-2 border-transparent px-3 py-2 text-sm text-[rgb(var(--text-muted))]'
              }
            >
              {t(`exercises.${tk}` as never)}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4 py-4 md:px-8">
        {sets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">
            {t('exercises.noHistory')}
          </div>
        ) : tab === 'progress' ? (
          <div className="card p-4">
            <h2 className="kpi-label mb-3">Odhadované 1RM v čase</h2>
            <div className="h-72" data-testid="progress-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} unit=" kg" />
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v} kg`, name === 'oneRm' ? '1RM' : name]}
                  />
                  <Line
                    type="monotone"
                    dataKey="oneRm"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="1RM"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : tab === 'volume' ? (
          <div className="card p-4">
            <h2 className="kpi-label mb-3">Týždenný objem (kg)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                  <XAxis dataKey="weekLabel" fontSize={12} />
                  <YAxis fontSize={12} unit=" kg" />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {prs.length === 0 && (
              <li className="rounded-xl border border-dashed border-[rgb(var(--border))] p-6 text-center text-sm text-[rgb(var(--text-muted))]">
                Zatiaľ žiadne osobné rekordy.
              </li>
            )}
            {prs
              .slice()
              .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
              .map((pr) => (
                <li key={pr.id} className="card flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium">{t(`pr.${pr.type}` as never)}</div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">
                      {format(parseISO(pr.achievedAt), 'd. MMMM yyyy', { locale: sk })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-700">
                      {pr.value} {pr.type === 'volume' ? 'kg×reps' : 'kg'}
                    </div>
                    {pr.repsContext && (
                      <div className="text-xs text-[rgb(var(--text-muted))]">×{pr.repsContext} reps</div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
