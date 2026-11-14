import type { PriorityWeights } from '../types/agritech';

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  water: 0.25,
  erosion: 0.25,
  nutrients: 0.25,
  market: 0.25,
};

export const clamp = (value: number, min = 0, max = 1): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

export const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const normalizeWeights = (raw: Partial<PriorityWeights>): PriorityWeights => {
  const w = Math.max(0, Number.isFinite(raw.water) ? (raw.water as number) : 0);
  const e = Math.max(0, Number.isFinite(raw.erosion) ? (raw.erosion as number) : 0);
  const n = Math.max(0, Number.isFinite(raw.nutrients) ? (raw.nutrients as number) : 0);
  const m = Math.max(0, Number.isFinite(raw.market) ? (raw.market as number) : 0);

  const sum = w + e + n + m;
  if (sum <= 0) {
    return { ...DEFAULT_PRIORITY_WEIGHTS };
  }

  return {
    water: w / sum,
    erosion: e / sum,
    nutrients: n / sum,
    market: m / sum,
  };
};

/**
 * Piecewise linear interpolation for cash turnaround days:
 * - <= 60 days: 1.0
 * - 120 days: 0.4
 * - >= 180 days: 0.1
 */
export const interpolateCashScore = (cashTurnaroundDays: number): number => {
  if (!Number.isFinite(cashTurnaroundDays)) return 0.1;
  if (cashTurnaroundDays <= 60) return 1.0;
  if (cashTurnaroundDays <= 120) {
    return clamp(1.0 - 0.6 * ((cashTurnaroundDays - 60) / 60), 0.1, 1.0);
  }
  if (cashTurnaroundDays < 180) {
    return clamp(0.4 - 0.3 * ((cashTurnaroundDays - 120) / 60), 0.1, 1.0);
  }
  return 0.1;
};
