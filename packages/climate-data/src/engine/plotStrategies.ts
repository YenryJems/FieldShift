import { getFarmById } from '../farms';
import type {
  AdjustedClimateContext,
  CropStrategy,
  CultivarOption,
  FarmId,
  FarmProfile,
  FariScoreBreakdown,
  FieldConstraints,
  PriorityWeights,
  StrategyId,
} from '../types/agritech';
import { calculateFariScore, DEFAULT_FIELD_CONSTRAINTS } from './fari';
import {
  clamp,
  DEFAULT_PRIORITY_WEIGHTS,
  normalizeWeights,
  roundTo,
} from './normalization';
import { applyClimateStress } from './stress';

export type PlotStrategyKey =
  | 'baseline'
  | 'regenerator'
  | 'resilient-cash'
  | 'market-optimizer';

export const PLOT_STRATEGY_KEY_ORDER: readonly PlotStrategyKey[] = [
  'baseline',
  'regenerator',
  'resilient-cash',
  'market-optimizer',
];

export const PLOT_STRATEGY_TITLES: Record<PlotStrategyKey, string> = {
  baseline: 'Current Monocrop Baseline',
  regenerator: 'Soil & Moisture Regenerator',
  'resilient-cash': 'Climate-Resilient Cash Crop',
  'market-optimizer': 'Max Market Value Optimizer',
};

export interface PlotStrategyShocks {
  rainfallShock: boolean;
  heatShock: boolean;
  localSeedFallback: boolean;
}

export const DEFAULT_PLOT_SHOCKS: PlotStrategyShocks = {
  rainfallShock: false,
  heatShock: false,
  localSeedFallback: false,
};

/**
 * Linear scaling of STRESS_PRESETS:
 * - drought (−30% rain → wetness ×0.72, droughtDelta +0.30) ⇒ −20% rain: wetness ×0.81, droughtDelta +0.20
 * - heatwave (+2.5°C → wetness ×0.85, droughtDelta +0.15) ⇒ +2.0°C: wetness ×0.88, droughtDelta +0.12
 */
export const DASHBOARD_SHOCK_FACTORS = {
  rainfall: {
    precipMultiplier: 0.8,
    wetnessMultiplier: 0.81,
    droughtDelta: 0.2,
  },
  heat: {
    tempDeltaC: 2.0,
    wetnessMultiplier: 0.88,
    droughtDelta: 0.12,
  },
} as const;

export const applyDashboardShocks = (
  base: AdjustedClimateContext,
  shocks: Pick<PlotStrategyShocks, 'rainfallShock' | 'heatShock'>,
): AdjustedClimateContext => {
  if (!shocks.rainfallShock && !shocks.heatShock) {
    return base;
  }

  const p = shocks.rainfallShock ? DASHBOARD_SHOCK_FACTORS.rainfall.precipMultiplier : 1;
  const t = shocks.heatShock ? DASHBOARD_SHOCK_FACTORS.heat.tempDeltaC : 0;
  const w =
    (shocks.rainfallShock ? DASHBOARD_SHOCK_FACTORS.rainfall.wetnessMultiplier : 1) *
    (shocks.heatShock ? DASHBOARD_SHOCK_FACTORS.heat.wetnessMultiplier : 1);
  const dd = clamp(
    (shocks.rainfallShock ? DASHBOARD_SHOCK_FACTORS.rainfall.droughtDelta : 0) +
      (shocks.heatShock ? DASHBOARD_SHOCK_FACTORS.heat.droughtDelta : 0),
    0,
    1,
  );

  const scenarioLabel =
    shocks.rainfallShock && shocks.heatShock
      ? 'Dashboard what-if: −20% rainfall + 2°C heat'
      : shocks.rainfallShock
        ? 'Dashboard what-if: −20% rainfall'
        : 'Dashboard what-if: +2°C heat';

  return {
    ...base,
    scenarioId: shocks.rainfallShock ? 'drought' : 'heatwave',
    scenarioLabel,
    scenarioDescription:
      'Modeled what-if adjustment scaled linearly from NASA POWER 2020–2025 baseline; heat-stress and dry-day counts are not re-simulated.',
    adjustedDailyPrecipMm: roundTo(Math.max(0, base.baselineDailyPrecipMm * p), 2),
    adjustedRainBurstMm: roundTo(Math.max(0, base.baselineRainBurstMm * p), 2),
    stormDaysGe14Mm: roundTo(Math.max(0, base.stormDaysGe14Mm * p), 2),
    adjustedTempC: roundTo(base.baselineTempC + t, 2),
    adjustedMaxTempC: roundTo(base.baselineMaxTempC + t, 2),
    adjustedGwetTop: roundTo(clamp(base.baselineGwetTop * w, 0, 1), 3),
    adjustedGwetRoot: roundTo(clamp(base.baselineGwetRoot * w, 0, 1), 3),
    droughtDelta: roundTo(dd, 3),
  };
};

export const LOCAL_OPV_FALLBACKS: ReadonlyArray<{
  match: readonly string[];
  cultivar: CultivarOption;
}> = [
  {
    match: ['mungbean', 'munggo', 'mung bean'],
    cultivar: {
      name: 'Pag-asa 7 Mungbean',
      crop: 'Mungbean',
      type: 'open-pollinated',
      maturityDays: 60,
      traitHighlight: 'Farmer-reproducible local OPV',
      seedSourceNote: 'Confirm availability with BPI / MAO community seed bank',
    },
  },
  {
    match: ['corn', 'maize'],
    cultivar: {
      name: 'Tiniguib White Corn',
      crop: 'Corn',
      type: 'open-pollinated',
      maturityDays: 105,
      traitHighlight: 'Farmer-reproducible local OPV',
      seedSourceNote: 'Confirm availability with BPI / MAO community seed bank',
    },
  },
  {
    match: ['sweet potato', 'camote'],
    cultivar: {
      name: 'Super Bureau Camote',
      crop: 'Sweet Potato',
      type: 'open-pollinated',
      maturityDays: 90,
      traitHighlight: 'Farmer-reproducible local OPV',
      seedSourceNote: 'Confirm availability with BPI / MAO community seed bank',
    },
  },
];

/**
 * Replaces commercial cultivars with local open-pollinated (OPV) alternatives when available.
 * When any cultivar is swapped, applies an illustrative 0.95 OPV yield-potential discount to `priceIndex`.
 */
export const applyLocalSeedFallback = (
  strategy: CropStrategy,
  country: FarmProfile['country'],
): { strategy: CropStrategy; displayCultivars: CultivarOption[]; swapped: boolean } => {
  const existingOpv = strategy.cultivars.find((c) => c.type === 'open-pollinated');
  let swapped = false;

  const displayCultivars = strategy.cultivars.map((cultivar) => {
    if (cultivar.type !== 'commercial') {
      return cultivar;
    }

    if (country === 'Philippines') {
      const cropLower = cultivar.crop.toLowerCase();
      const matchEntry = LOCAL_OPV_FALLBACKS.find((entry) =>
        entry.match.some((term) => cropLower.includes(term)),
      );
      if (matchEntry) {
        swapped = true;
        return matchEntry.cultivar;
      }
    }

    if (existingOpv) {
      swapped = true;
      return existingOpv;
    }

    return cultivar;
  });

  if (!swapped) {
    return {
      strategy,
      displayCultivars: strategy.cultivars,
      swapped: false,
    };
  }

  return {
    strategy: {
      ...strategy,
      cultivars: displayCultivars,
      priceIndex: roundTo(strategy.priceIndex * 0.95, 3),
    },
    displayCultivars,
    swapped: true,
  };
};

/**
 * Derived, illustrative variant — no new crop data.
 * Selects the highest-priceIndex non-baseline strategy and models selling crop residue as fodder
 * instead of mulching it (halving `residueMulch` and increasing `forageValue` by 0.15, capped at 1).
 */
export const deriveMarketOptimizerStrategy = (
  farm: FarmProfile,
): { strategy: CropStrategy; sourceStrategyId: StrategyId } => {
  const nonBaseline = farm.strategies.filter((s) => !s.isBaseline);
  const pool = nonBaseline.length > 0 ? nonBaseline : [...farm.strategies];

  const sorted = [...pool].sort((a, b) => {
    if (b.priceIndex !== a.priceIndex) return b.priceIndex - a.priceIndex;
    if (a.cashTurnaroundDays !== b.cashTurnaroundDays) {
      return a.cashTurnaroundDays - b.cashTurnaroundDays;
    }
    return a.id.localeCompare(b.id);
  });

  const src = sorted[0];

  return {
    sourceStrategyId: src.id,
    strategy: {
      ...src,
      name: `${src.name} — market-value variant`,
      shortLabel: 'Market-value variant',
      residueMulch: roundTo(src.residueMulch * 0.5, 2),
      forageValue: roundTo(Math.min(1, src.forageValue + 0.15), 2),
    },
  };
};

export type ApplicationWindowLevel = 'green' | 'amber' | 'red';

export const APPLICATION_WINDOW_THRESHOLDS = {
  heavyRainMmDay: 14,
  stormDaysRed: 4,
  splitRainMmDay: 8,
  stormDaysAmber: 2,
  dryRootIndex: 0.45,
  hotTmaxC: 35,
} as const;

export interface ApplicationWindow {
  level: ApplicationWindowLevel;
  title: string;
  advice: string;
  reasons: string[];
}

export const classifyApplicationWindow = (
  climate: AdjustedClimateContext,
  strategy: Pick<CropStrategy, 'nFixKgHa'>,
): ApplicationWindow => {
  const legumeNote =
    strategy.nFixKgHa >= 20
      ? ' Legume phase supplies modeled biological N — test soil before topping up urea.'
      : '';

  const {
    heavyRainMmDay,
    stormDaysRed,
    splitRainMmDay,
    stormDaysAmber,
    dryRootIndex,
    hotTmaxC,
  } = APPLICATION_WINDOW_THRESHOLDS;

  if (
    climate.adjustedDailyPrecipMm > heavyRainMmDay ||
    climate.stormDaysGe14Mm >= stormDaysRed
  ) {
    const reasons: string[] = [];
    if (climate.adjustedDailyPrecipMm > heavyRainMmDay) {
      reasons.push(
        `Modeled daily rainfall is ${climate.adjustedDailyPrecipMm.toFixed(1)} mm/day (> ${heavyRainMmDay} mm/day).`,
      );
    }
    if (climate.stormDaysGe14Mm >= stormDaysRed) {
      reasons.push(
        `Heavy-rain days (>= 14 mm) reach ${climate.stormDaysGe14Mm.toFixed(1)} days/month (>= ${stormDaysRed}).`,
      );
    }
    reasons.push(
      'Signal is NASA 2020–2025 historical climatology for this month (and any what-if shock), not a live forecast — confirm with PAGASA/local forecast.',
    );

    return {
      level: 'red',
      title: 'Hold Urea — Heavy Rain >14 mm/day Forecasted',
      advice: `Hold urea top-dressing; heavy-rain days risk washout and runoff. Keep ground cover and drains clear.${legumeNote}`,
      reasons,
    };
  }

  if (
    climate.adjustedDailyPrecipMm >= splitRainMmDay ||
    climate.stormDaysGe14Mm >= stormDaysAmber ||
    climate.adjustedGwetRoot < dryRootIndex ||
    climate.adjustedMaxTempC >= hotTmaxC
  ) {
    const reasons: string[] = [];
    if (climate.adjustedDailyPrecipMm >= splitRainMmDay) {
      reasons.push(
        `Modeled daily rainfall is ${climate.adjustedDailyPrecipMm.toFixed(1)} mm/day (>= ${splitRainMmDay} mm/day).`,
      );
    }
    if (climate.stormDaysGe14Mm >= stormDaysAmber) {
      reasons.push(
        `Heavy-rain days (>= 14 mm) reach ${climate.stormDaysGe14Mm.toFixed(1)} days/month (>= ${stormDaysAmber}).`,
      );
    }
    if (climate.adjustedGwetRoot < dryRootIndex) {
      reasons.push(
        `Root-zone wetness index is ${climate.adjustedGwetRoot.toFixed(1)} (< ${dryRootIndex}).`,
      );
    }
    if (climate.adjustedMaxTempC >= hotTmaxC) {
      reasons.push(
        `Mean daily max temperature is ${climate.adjustedMaxTempC.toFixed(1)}°C (>= ${hotTmaxC}°C).`,
      );
    }

    return {
      level: 'amber',
      title: 'Split Application / Caution',
      advice: `Split N into 2–3 smaller doses; apply into moist soil in cool early morning and incorporate.${legumeNote}`,
      reasons,
    };
  }

  return {
    level: 'green',
    title: 'Optimal Window',
    advice: `Conditions are historically favorable for planned fertilizer application; still confirm the 24-hour local forecast.${legumeNote}`,
    reasons: [
      `Rainfall (${climate.adjustedDailyPrecipMm.toFixed(1)} mm/day), storm days (${climate.stormDaysGe14Mm.toFixed(1)}), root-zone wetness (${climate.adjustedGwetRoot.toFixed(1)}), and max temp (${climate.adjustedMaxTempC.toFixed(1)}°C) are within favorable historical bounds.`,
    ],
  };
};

export interface PlotStrategyEvaluationInput {
  farmId: FarmId;
  month: number;
  weights?: Partial<PriorityWeights>;
  shocks?: Partial<PlotStrategyShocks>;
  constraints?: FieldConstraints;
}

export interface PlotStrategyResult {
  key: PlotStrategyKey;
  title: string;
  sourceStrategyId: StrategyId;
  strategy: CropStrategy;
  displayCultivars: CultivarOption[];
  isDerivedVariant: boolean;
  seedFallbackApplied: boolean;
  breakdown: Omit<FariScoreBreakdown, 'rank' | 'deltaVsBaseline'>;
  fariScore: number;
  rank: number;
  deltaVsBaseline: number;
  gainVsBaselinePct: number | null;
  applicationWindow: ApplicationWindow;
}

export interface PlotStrategyEvaluation {
  farmId: FarmId;
  month: number;
  climate: AdjustedClimateContext;
  normalizedWeights: PriorityWeights;
  shocks: PlotStrategyShocks;
  results: PlotStrategyResult[];
  ranked: PlotStrategyResult[];
  top: PlotStrategyResult;
  baseline: PlotStrategyResult;
}

export const computeGainPct = (score: number, baseline: number): number | null =>
  baseline > 0 ? roundTo(((score - baseline) / baseline) * 100, 1) : null;

export const rankPlotResults = (results: PlotStrategyResult[]): PlotStrategyResult[] => {
  const baselineItem = results.find((item) => item.key === 'baseline') ?? results[0];
  const baselineScore = baselineItem ? baselineItem.fariScore : 0;

  const sorted = [...results].sort((a, b) => {
    if (b.fariScore !== a.fariScore) return b.fariScore - a.fariScore;
    return (
      PLOT_STRATEGY_KEY_ORDER.indexOf(a.key) - PLOT_STRATEGY_KEY_ORDER.indexOf(b.key)
    );
  });

  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    deltaVsBaseline: roundTo(item.fariScore - baselineScore, 1),
    gainVsBaselinePct:
      item.key === 'baseline' ? 0 : computeGainPct(item.fariScore, baselineScore),
  }));
};

export const evaluatePlotStrategies = (
  input: PlotStrategyEvaluationInput,
): PlotStrategyEvaluation => {
  const m = clamp(Math.round(input.month), 1, 12);
  const shocks: PlotStrategyShocks = {
    ...DEFAULT_PLOT_SHOCKS,
    ...input.shocks,
  };
  const constraints = input.constraints ?? DEFAULT_FIELD_CONSTRAINTS;
  const farm = getFarmById(input.farmId);
  const baseClimate = applyClimateStress(input.farmId, m, 'baseline');
  const climate = applyDashboardShocks(baseClimate, shocks);
  const normalizedWeights = normalizeWeights(input.weights ?? DEFAULT_PRIORITY_WEIGHTS);

  const baselineStrategy =
    farm.strategies.find((s) => s.isBaseline) ?? farm.strategies[0];
  const regeneratorStrategy =
    farm.strategies.find((s) => s.id === 'S2') ?? farm.strategies[1];
  const resilientCashStrategy =
    farm.strategies.find((s) => s.id === 'S3') ?? farm.strategies[2];
  const marketOptimizer = deriveMarketOptimizerStrategy(farm);

  const candidates: Array<{
    key: PlotStrategyKey;
    sourceStrategyId: StrategyId;
    strategy: CropStrategy;
    isDerivedVariant: boolean;
  }> = [
    {
      key: 'baseline',
      sourceStrategyId: baselineStrategy.id,
      strategy: baselineStrategy,
      isDerivedVariant: false,
    },
    {
      key: 'regenerator',
      sourceStrategyId: regeneratorStrategy.id,
      strategy: regeneratorStrategy,
      isDerivedVariant: false,
    },
    {
      key: 'resilient-cash',
      sourceStrategyId: resilientCashStrategy.id,
      strategy: resilientCashStrategy,
      isDerivedVariant: false,
    },
    {
      key: 'market-optimizer',
      sourceStrategyId: marketOptimizer.sourceStrategyId,
      strategy: marketOptimizer.strategy,
      isDerivedVariant: true,
    },
  ];

  const unranked: PlotStrategyResult[] = candidates.map((candidate) => {
    const seedResult = shocks.localSeedFallback
      ? applyLocalSeedFallback(candidate.strategy, farm.country)
      : {
          strategy: candidate.strategy,
          displayCultivars: candidate.strategy.cultivars,
          swapped: false,
        };

    const breakdown = calculateFariScore(
      seedResult.strategy,
      farm,
      climate,
      normalizedWeights,
      constraints,
    );

    return {
      key: candidate.key,
      title: PLOT_STRATEGY_TITLES[candidate.key],
      sourceStrategyId: candidate.sourceStrategyId,
      strategy: seedResult.strategy,
      displayCultivars: seedResult.displayCultivars,
      isDerivedVariant: candidate.isDerivedVariant,
      seedFallbackApplied: seedResult.swapped,
      breakdown,
      fariScore: breakdown.fariScore,
      rank: 0,
      deltaVsBaseline: 0,
      gainVsBaselinePct: 0,
      applicationWindow: classifyApplicationWindow(climate, seedResult.strategy),
    };
  });

  const ranked = rankPlotResults(unranked);
  const byKey = new Map(ranked.map((r) => [r.key, r]));
  const results = PLOT_STRATEGY_KEY_ORDER.map((k) => byKey.get(k)!);

  return {
    farmId: input.farmId,
    month: m,
    climate,
    normalizedWeights,
    shocks,
    results,
    ranked,
    top: ranked[0],
    baseline: byKey.get('baseline')!,
  };
};
