import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryClient } from '@/state/queryClient';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeManager } from '@/components/ThemeManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { seedDatabase } from '@/db/seed';
import { Dashboard } from '@/screens/Dashboard';
import { WorkoutListScreen } from '@/screens/WorkoutListScreen';
import { NewWorkoutScreen } from '@/screens/NewWorkoutScreen';
import { ActiveWorkoutScreen } from '@/screens/ActiveWorkoutScreen';
import { WorkoutDetailScreen } from '@/screens/WorkoutDetailScreen';
import { ExerciseListScreen } from '@/screens/ExerciseListScreen';
import { ExerciseDetailScreen } from '@/screens/ExerciseDetailScreen';
import { TemplatesScreen } from '@/screens/TemplatesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seedDatabase()
      .catch((e) => console.error('seed error', e))
      .finally(() => setReady(true));
  }, []);
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-[rgb(var(--text-muted))]">
        Pripravujem dáta…
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeManager>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="workouts" element={<WorkoutListScreen />} />
                <Route path="workouts/new" element={<NewWorkoutScreen />} />
                <Route path="workouts/:id" element={<WorkoutDetailScreen />} />
                <Route path="workouts/:id/active" element={<ActiveWorkoutScreen />} />
                <Route path="exercises" element={<ExerciseListScreen />} />
                <Route path="exercises/:id" element={<ExerciseDetailScreen />} />
                <Route path="templates" element={<TemplatesScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeManager>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
