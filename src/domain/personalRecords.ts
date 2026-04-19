import type { PersonalRecord, PrType, SetEntry } from '@/db/schema';
import { setVolume } from './volume';

export interface PrCandidate {
  type: PrType;
  value: number;
  repsContext?: number;
}

export function detectNewPrs(
  newSet: SetEntry,
  history: ReadonlyArray<SetEntry>,
  existingPrs: ReadonlyArray<PersonalRecord>,
): PrCandidate[] {
  const candidates: PrCandidate[] = [];

  const oneRmHistory = history.filter((s) => s.id !== newSet.id);
  const bestOneRm = Math.max(0, ...oneRmHistory.map((s) => s.estimatedOneRm));
  const bestStored = Math.max(
    0,
    ...existingPrs.filter((p) => p.type === 'one_rm').map((p) => p.value),
  );
  if (newSet.estimatedOneRm > Math.max(bestOneRm, bestStored)) {
    candidates.push({ type: 'one_rm', value: newSet.estimatedOneRm });
  }

  const sameRepsHistory = oneRmHistory.filter((s) => s.reps === newSet.reps);
  const bestSetVal = Math.max(0, ...sameRepsHistory.map((s) => s.weight));
  const bestSetStored = Math.max(
    0,
    ...existingPrs
      .filter((p) => p.type === 'best_set' && p.repsContext === newSet.reps)
      .map((p) => p.value),
  );
  if (newSet.weight > Math.max(bestSetVal, bestSetStored)) {
    candidates.push({ type: 'best_set', value: newSet.weight, repsContext: newSet.reps });
  }

  const v = setVolume(newSet);
  const bestVolume = Math.max(0, ...oneRmHistory.map((s) => setVolume(s)));
  const bestVolumeStored = Math.max(
    0,
    ...existingPrs.filter((p) => p.type === 'volume').map((p) => p.value),
  );
  if (v > Math.max(bestVolume, bestVolumeStored)) {
    candidates.push({ type: 'volume', value: v });
  }
  return candidates;
}
