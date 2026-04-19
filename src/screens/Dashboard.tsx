import { Link } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useWorkouts, useAllSets } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { calculateStreak, workoutsInLastDays } from '@/domain/streak';
import { totalVolume, weeklyVolume } from '@/domain/volume';
import { t } from '@/i18n';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#0f766e',
  back: '#0ea5e9',
  legs: '#f97316',
  shoulders: '#a855f7',
  arms: '#dc2626',
  core: '#16a34a',
  full_body: '#94a3b8',
  other: '#64748b',
};

export function Dashboard() {
  const workouts = useWorkouts();
  const sets = useAllSets();
  const exercises = useExercises();

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const w7 = workoutsInLastDays(workouts, 7);
  const w30 = workoutsInLastDays(workouts, 30);
  const last7Sets = sets.filter((s) => parseISO(s.completedAt) >= subDays(new Date(), 7));
  const v7 = totalVolume(last7Sets);
  const streak = calculateStreak(workouts);

  const weekly = useMemo(() => weeklyVolume(sets, exerciseMap, 4), [sets, exerciseMap]);
  const weeklyChartData = weekly.map((b) => ({
    week: b.weekLabel,
    ...b.byMuscleGroup,
  }));
  const muscleGroupsInChart = Array.from(
    new Set(weekly.flatMap((b) => Object.keys(b.byMuscleGroup))),
  );

  const recent = workouts.slice(0, 3);

  return (
    <div className="relative">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={format(new Date(), "EEEE, d. MMMM yyyy", { locale: sk })}
      />

      <div className="px-4 py-4 md:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label={t('dashboard.workouts7d')} value={w7} />
          <Kpi label={t('dashboard.workouts30d')} value={w30} />
          <Kpi label={t('dashboard.volume7d')} value={Math.round(v7).toLocaleString('sk-SK')} />
          <Kpi label={t('dashboard.streak')} value={streak} suffix="d" />
        </section>

        <section className="card mt-6 p-4 md:p-6">
          <header className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-700" />
            <h2 className="text-base font-semibold">{t('dashboard.weeklyVolume')}</h2>
          </header>
          <div className="h-64">
            {weeklyChartData.every((row) => Object.keys(row).length === 1) ? (
              <EmptyState message="Nahraj nejaký tréning a uvidíš tu progres." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.3} />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {muscleGroupsInChart.map((mg) => (
                    <Bar
                      key={mg}
                      dataKey={mg}
                      stackId="vol"
                      fill={MUSCLE_COLORS[mg] ?? '#64748b'}
                      name={t(`muscleGroups.${mg}` as never)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">{t('dashboard.recentWorkouts')}</h2>
          {recent.length === 0 ? (
            <EmptyState message="Zatiaľ nemáš žiadne tréningy. Pridaj prvý!" />
          ) : (
            <ul className="space-y-2">
              {recent.map((w) => {
                const setsForW = sets.filter((s) => s.workoutId === w.id);
                const vol = totalVolume(setsForW);
                const exCount = new Set(setsForW.map((s) => s.exerciseId)).size;
                return (
                  <li key={w.id}>
                    <Link
                      to={`/workouts/${w.id}`}
                      className="card flex flex-col gap-1 p-4 hover:border-primary-500"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{w.name ?? 'Tréning'}</span>
                        <span className="text-xs text-[rgb(var(--text-muted))]">
                          {format(parseISO(w.date), 'EEE d. MMM', { locale: sk })}
                        </span>
                      </div>
                      <div className="text-xs text-[rgb(var(--text-muted))]">
                        {exCount} {t('workouts.exercises')} · {setsForW.length} {t('workouts.sets')} · {Math.round(vol)} kg
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <Link
        to="/workouts/new"
        aria-label={t('dashboard.newWorkout')}
        className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-primary-700 px-5 py-3 font-semibold text-white shadow-lg hover:bg-primary-800 md:bottom-8 md:right-8"
      >
        <Plus size={20} />
        <span className="hidden sm:inline">{t('dashboard.newWorkout')}</span>
      </Link>
    </div>
  );
}

function Kpi({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="card p-4">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {suffix && <span className="text-base font-medium text-[rgb(var(--text-muted))]">{suffix}</span>}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[rgb(var(--border))] py-10 text-center text-sm text-[rgb(var(--text-muted))]">
      {message}
    </div>
  );
}
