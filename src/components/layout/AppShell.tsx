import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, ListChecks, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { t } from '@/i18n';
import { ToastHost } from '@/components/ui/Toast';

const NAV = [
  { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
  { to: '/workouts', label: t('nav.workouts'), icon: ListChecks },
  { to: '/exercises', label: t('nav.exercises'), icon: Dumbbell },
  { to: '/templates', label: t('nav.templates'), icon: BarChart2 },
  { to: '/settings', label: t('nav.settings'), icon: SettingsIcon },
];

export function AppShell() {
  return (
    <div className="min-h-full md:flex">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-[rgb(var(--border))] md:bg-[rgb(var(--surface))]">
        <div className="px-6 py-5">
          <h1 className="text-lg font-semibold text-primary-700">{t('app.title')}</h1>
          <p className="text-xs text-[rgb(var(--text-muted))]">{t('app.tagline')}</p>
        </div>
        <nav className="flex-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]',
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-[10px] text-[rgb(var(--text-muted))]">v0.1.0 · PWA</div>
      </aside>

      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] md:hidden"
        aria-label="primary"
      >
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium',
                isActive ? 'text-primary-700' : 'text-[rgb(var(--text-muted))]',
              )
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <ToastHost />
    </div>
  );
}
