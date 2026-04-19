import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, type UserSetting } from '@/db/schema';
import { settingsRepo } from '@/db/repositories/settingsRepo';
import { useCallback } from 'react';

export function useSettings(): {
  settings: UserSetting;
  update: (patch: Partial<UserSetting>) => Promise<UserSetting>;
} {
  const settings = useLiveQuery(() => db.settings.get('singleton'));
  const update = useCallback((patch: Partial<UserSetting>) => settingsRepo.update(patch), []);
  return { settings: settings ?? DEFAULT_SETTINGS, update };
}
