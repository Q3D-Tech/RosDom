import { AccountMode } from '../types/contracts';

export function resolveAccountMode(
  birthYear: number,
  currentYear = new Date().getFullYear(),
): AccountMode {
  const age = currentYear - birthYear;
  if (age <= 13) {
    return 'child';
  }
  if (age <= 49) {
    return 'adult';
  }
  return 'elderly';
}
