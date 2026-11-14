import { getFarmById } from '../farms';
import type {
  AdjustedClimateContext,
  CropStrategy,
  FarmId,
  FarmProfile,
  FariScoreBreakdown,
  FieldConstraints,
  PriorityWeights,
  StressScenarioId,
} from '../types/agritech';
import {
  clamp,
  DEFAULT_PRIORITY_WEIGHTS,
  interpolateCashScore,
  normalizeWeights,
  roundTo,
} from './normalization';
import { applyClimateStress } from './stress';

export const DEFAULT_FIELD_CONSTRAINTS: FieldConstraints = {
  rainfedOnly: false,
  manualToolsOnly: false,
  fastCashNeeded: false,
};

export interface WaterPillarResult {
  score: number;
  idealRootCm: number;
  rootMatch: number;
  droughtAnomaly: number;
  droughtPenalty: number;
  waterlogPenalty: number;
  heatExposure: number;
  heatPenalty: number;
}

export const calculateWaterPillar = (
  strategy: CropStrategy,
  climate: AdjustedClimateContext,
  constraints: FieldConstraints = DEFAULT_FIELD_CONSTRAINTS,
): WaterPillarResult => {
  const gwetTopNorm = clamp(climate.adjustedGwetTop, 0, 1);
  const gwetRootNorm = clamp(climate.adjustedGwetRoot, 0, 1);

  const idealRootCm = 30 + 70 * (1 - gwetTopNorm);
  const rootMatch = clamp(1 - Math.abs(strategy.rootDepthCm - idealRootCm) / 100, 0, 1);

  const heatExposure = clamp((climate.adjustedMaxTempC - 30.0) / 10.0, 0, 1);
  const heatPenalty = clamp(heatExposure * clamp(strategy.stressSensitivity.heat, 0, 1), 0, 1);

  const baseMoistureDeficit = clamp(1 - gwetRootNorm, 0, 1);
  const sDrought = clamp(strategy.stressSensitivity.drought, 0, 1);
  const droughtAnomaly = clamp(
    baseMoistureDeficit +
      climate.droughtDelta * (0.5 + 0.5 * sDrought) +
      0.25 * heatPenalty,
    0,
    1,
  );

  const rainfedMultiplier =
    constraints.rainfedOnly && strategy.waterDemand > 0.65 ? 1.25 : 1.0;
  const droughtPenalty = clamp(
    clamp(strategy.waterDemand, 0, 1) * droughtAnomaly * rainfedMultiplier,
    0,
    1,
  );

  const sDeluge = clamp(strategy.stressSensitivity.deluge, 0, 1);
  const waterlogPenalty = clamp(
    Math.max(0, gwetRootNorm - 0.8) * 2.0 * sDeluge,
    0,
    0.35,
  );

  const score = clamp(
    0.5 * rootMatch + 0.5 * (1 - droughtPenalty) - waterlogPenalty,
    0,
    1,
  );

  return {
    score,
    idealRootCm: roundTo(idealRootCm, 1),
    rootMatch: roundTo(rootMatch, 3),
    droughtAnomaly: roundTo(droughtAnomaly, 3),
    droughtPenalty: roundTo(droughtPenalty, 3),
    waterlogPenalty: roundTo(waterlogPenalty, 3),
    heatExposure: roundTo(heatExposure, 3),
    heatPenalty: roundTo(heatPenalty, 3),
  };
};

export interface ErosionPillarResult {
  score: number;
  erosionRisk: number;
  slopeFactor: number;
  rainBurstFactor: number;
  canopyCover: number;
  rootBinding: number;
  contourCover: number;
}

export const calculateErosionPillar = (
  strategy: CropStrategy,
  farm: Pick<FarmProfile, 'slopePct'>,
  climate: AdjustedClimateContext,
): ErosionPillarResult => {
  const slopeFactor = clamp(farm.slopePct / 15.0, 0.1, 1.0);
  const sDeluge = clamp(strategy.stressSensitivity.deluge, 0, 1);
  const rainBurstFactor = clamp(
    (climate.adjustedRainBurstMm / 60.0) * (1 + 0.35 * sDeluge),
    0.15,
    1.0,
  );

  const canopyCover = clamp(1 - strategy.canopyClosureDays / 90.0, 0, 1);
  const rootBinding = clamp(strategy.rootDepthCm / 120.0, 0, 1);
  const contourCover = clamp(strategy.contourFactor, 0, 1);

  const protectiveCover = clamp(
    0.6 * canopyCover + 0.3 * rootBinding + 0.1 * contourCover,
    0,
    1,
  );
  const erosionRisk = clamp(
    slopeFactor * rainBurstFactor * (1 - protectiveCover),
    0,
    1,
  );
  const score = clamp(1 - erosionRisk, 0, 1);

  return {
    score,
    erosionRisk: roundTo(erosionRisk, 3),
    slopeFactor: roundTo(slopeFactor, 3),
    rainBurstFactor: roundTo(rainBurstFactor, 3),
    canopyCover: roundTo(canopyCover, 3),
    rootBinding: roundTo(rootBinding, 3),
    contourCover: roundTo(contourCover, 3),
  };
};

export const calculateNutrientPillar = (strategy: CropStrategy): number => {
  const nFixNorm = clamp(strategy.nFixKgHa / 80.0, 0, 1);
  const mulchNorm = clamp(strategy.residueMulch, 0, 1);
  return clamp(0.7 * nFixNorm + 0.3 * mulchNorm, 0, 1);
};

export interface MarketPillarResult {
  score: number;
  cashScore: number;
}

export const calculateMarketPillar = (
  strategy: CropStrategy,
  farm: Pick<FarmProfile, 'marketAccess'>,
  heatPenalty: number,
  constraints: FieldConstraints = DEFAULT_FIELD_CONSTRAINTS,
): MarketPillarResult => {
  const cashScore = interpolateCashScore(strategy.cashTurnaroundDays);
  const priceNorm = clamp(strategy.priceIndex, 0, 1);
  const forageNorm = clamp(strategy.forageValue, 0, 1);
  const accessNorm = clamp(farm.marketAccess, 0, 1);

  const baseMarket = constraints.fastCashNeeded
    ? 0.25 * priceNorm + 0.55 * cashScore + 0.1 * forageNorm + 0.1 * accessNorm
    : 0.4 * priceNorm + 0.3 * cashScore + 0.2 * forageNorm + 0.1 * accessNorm;

  const manualMultiplier =
    constraints.manualToolsOnly && strategy.cashTurnaroundDays >= 110 && strategy.isBaseline
      ? 0.9
      : 1.0;

  const score = clamp(
    baseMarket * (1 - 0.3 * clamp(heatPenalty, 0, 1)) * manualMultiplier,
    0,
    1,
  );

  return {
    score,
    cashScore: roundTo(cashScore, 3),
  };
};

export const calculateFariScore = (
  strategy: CropStrategy,
  farm: Pick<FarmProfile, 'slopePct' | 'marketAccess'>,
  climate: AdjustedClimateContext,
  rawWeights: Partial<PriorityWeights> = DEFAULT_PRIORITY_WEIGHTS,
  constraints: FieldConstraints = DEFAULT_FIELD_CONSTRAINTS,
): Omit<FariScoreBreakdown, 'rank' | 'deltaVsBaseline'> => {
  const normalizedWeights = normalizeWeights(rawWeights);
  const waterRes = calculateWaterPillar(strategy, climate, constraints);
  const erosionRes = calculateErosionPillar(strategy, farm, climate);
  const nutrientScore = calculateNutrientPillar(strategy);
  const marketRes = calculateMarketPillar(
    strategy,
    farm,
    waterRes.heatPenalty,
    constraints,
  );

  const weightedSum =
    normalizedWeights.water * waterRes.score +
    normalizedWeights.erosion * erosionRes.score +
    normalizedWeights.nutrients * nutrientScore +
    normalizedWeights.market * marketRes.score;

  const fariScore = roundTo(clamp(100 * weightedSum, 0, 100), 1);

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    isBaseline: strategy.isBaseline,
    fariScore,
    pillars: {
      water: roundTo(waterRes.score, 3),
      erosion: roundTo(erosionRes.score, 3),
      nutrients: roundTo(nutrientScore, 3),
      market: roundTo(marketRes.score, 3),
    },
    normalizedWeights: {
      water: roundTo(normalizedWeights.water, 4),
      erosion: roundTo(normalizedWeights.erosion, 4),
      nutrients: roundTo(normalizedWeights.nutrients, 4),
      market: roundTo(normalizedWeights.market, 4),
    },
    diagnostics: {
      idealRootCm: waterRes.idealRootCm,
      rootMatch: waterRes.rootMatch,
      droughtAnomaly: waterRes.droughtAnomaly,
      droughtPenalty: waterRes.droughtPenalty,
      waterlogPenalty: waterRes.waterlogPenalty,
      heatExposure: waterRes.heatExposure,
      heatPenalty: waterRes.heatPenalty,
      erosionRisk: erosionRes.erosionRisk,
      cashScore: marketRes.cashScore,
    },
  };
};

export interface FarmFariEvaluation {
  farmId: FarmId;
  climate: AdjustedClimateContext;
  normalizedWeights: PriorityWeights;
  constraints: FieldConstraints;
  strategies: FariScoreBreakdown[];
  rankedStrategies: FariScoreBreakdown[];
  topStrategy: FariScoreBreakdown;
}

export const rankFarmStrategies = (
  farmId: FarmId,
  monthNumber: number,
  scenarioId: StressScenarioId = 'baseline',
  rawWeights: Partial<PriorityWeights> = DEFAULT_PRIORITY_WEIGHTS,
  constraints: FieldConstraints = DEFAULT_FIELD_CONSTRAINTS,
): FarmFariEvaluation => {
  const farm = getFarmById(farmId);
  const climate = applyClimateStress(farmId, monthNumber, scenarioId);
  const normalizedWeights = normalizeWeights(rawWeights);

  const rawBreakdowns = farm.strategies.map((strategy) =>
    calculateFariScore(strategy, farm, climate, normalizedWeights, constraints),
  );

  const baselineScore =
    rawBreakdowns.find((item) => item.isBaseline)?.fariScore ??
    rawBreakdowns[0].fariScore;

  const sortedByScore = [...rawBreakdowns].sort((a, b) => b.fariScore - a.fariScore);

  const strategiesWithRank: FariScoreBreakdown[] = rawBreakdowns.map((item) => {
    const rank =
      sortedByScore.findIndex((candidate) => candidate.strategyId === item.strategyId) + 1;
    return {
      ...item,
      rank,
      deltaVsBaseline: roundTo(item.fariScore - baselineScore, 1),
    };
  });

  const rankedStrategies = [...strategiesWithRank].sort((a, b) => a.rank - b.rank);

  return {
    farmId,
    climate,
    normalizedWeights,
    constraints,
    strategies: strategiesWithRank,
    rankedStrategies,
    topStrategy: rankedStrategies[0],
  };
};
