import { db, DEFAULT_SETTINGS, type UserSetting } from '../schema';

export const settingsRepo = {
  get: async (): Promise<UserSetting> => {
    const found = await db.settings.get('singleton');
    return found ?? DEFAULT_SETTINGS;
  },
  update: async (patch: Partial<UserSetting>): Promise<UserSetting> => {
    const current = await settingsRepo.get();
    const next: UserSetting = { ...current, ...patch, id: 'singleton' };
    await db.settings.put(next);
    return next;
  },
};
