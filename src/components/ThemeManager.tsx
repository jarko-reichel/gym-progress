import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

export function ThemeManager({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const theme = settings.theme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && prefersDark);
      root.classList.toggle('dark', dark);
    };
    apply();
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [settings.theme]);
  return <>{children}</>;
}
