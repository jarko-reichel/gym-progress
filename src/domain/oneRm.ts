// Pure functions for estimating one-rep maximum (1RM) from a working set.
// Vzorce vychádzajú z odporúčaní v silovej a kondičnej príprave.
// References:
//  - Epley B. (1985) Poundage Chart, Boyd Epley Workout
//  - Brzycki M. (1993) "Strength Testing — Predicting a One-Rep Max from Reps-to-Fatigue"
//  - LeSuer D. et al. (1997) "The accuracy of prediction equations for estimating 1RM..."

export type OneRmFormulaName = 'epley' | 'brzycki' | 'lesuer';

export const epley = (weight: number, reps: number): number => weight * (1 + reps / 30);

export const brzycki = (weight: number, reps: number): number => (weight * 36) / (37 - reps);

export const lesuer = (weight: number, reps: number): number =>
  weight * (1.0278 - 0.0278 * reps);

const FORMULAS: Record<OneRmFormulaName, (w: number, r: number) => number> = {
  epley,
  brzycki,
  lesuer,
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

export const estimateOneRm = (
  weight: number,
  reps: number,
  formula: OneRmFormulaName,
): number => {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return round1(weight);
  if (reps > 15) return round1(weight * 1.5);
  const fn = FORMULAS[formula];
  return round1(fn(weight, reps));
};

export const formulaLabel = (formula: OneRmFormulaName): string => {
  switch (formula) {
    case 'epley':
      return 'Epley (1985) — najpoužívanejší, presný do ~10 opakovaní';
    case 'brzycki':
      return 'Brzycki (1993) — divergentný pri vysokých reps (>10)';
    case 'lesuer':
      return 'LeSuer (1997) — konzervatívnejší pri vyššom rep range';
  }
};
