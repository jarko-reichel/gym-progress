import { brzycki, epley, estimateOneRm, lesuer } from '../../src/domain/oneRm';

describe('1RM formulas', () => {
  test('Epley 100kg × 5 ≈ 116.67', () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 1);
  });
  test('Brzycki 100kg × 5 = 112.5', () => {
    expect(brzycki(100, 5)).toBeCloseTo(112.5, 1);
  });
  test('LeSuer 100kg × 5 ≈ 88.89', () => {
    expect(lesuer(100, 5)).toBeCloseTo(88.89, 1);
  });
});

describe('estimateOneRm', () => {
  test('1 rep returns weight', () => {
    expect(estimateOneRm(100, 1, 'epley')).toBe(100);
  });
  test('zero weight returns 0', () => {
    expect(estimateOneRm(0, 5, 'epley')).toBe(0);
  });
  test('zero reps returns 0', () => {
    expect(estimateOneRm(100, 0, 'epley')).toBe(0);
  });
  test('cap at >15 reps', () => {
    expect(estimateOneRm(100, 20, 'epley')).toBe(150);
  });
  test('rounded to 1 decimal', () => {
    const v = estimateOneRm(102.5, 5, 'epley');
    expect(Number.isInteger(v * 10)).toBe(true);
  });
  test('Epley vs Brzycki at 5 reps differ', () => {
    expect(estimateOneRm(100, 5, 'epley')).not.toBe(estimateOneRm(100, 5, 'brzycki'));
  });
});
