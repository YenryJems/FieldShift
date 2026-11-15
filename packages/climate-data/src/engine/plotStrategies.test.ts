import { describe, expect, it } from 'vitest';
import { FARMS } from '../farms';
import { applyClimateStress } from './stress';
import { rankFarmStrategies } from './fari';
import { DEFAULT_PRIORITY_WEIGHTS, roundTo } from './normalization';
import {
  applyDashboardShocks,
  applyLocalSeedFallback,
  classifyApplicationWindow,
  computeGainPct,
  deriveMarketOptimizerStrategy,
  evaluatePlotStrategies,
  PLOT_STRATEGY_KEY_ORDER,
  rankPlotResults,
} from './plotStrategies';

describe('plotStrategies engine wrapper', () => {
  it('evaluates all 5 farms across all 12 months with valid structure and bounds', () => {
    expect(FARMS).toHaveLength(5);

    for (const farm of FARMS) {
      for (let month = 1; month <= 12; month += 1) {
        const evaluation = evaluatePlotStrategies({ farmId: farm.id, month });
        expect(evaluation.results).toHaveLength(4);
        expect(evaluation.results.map((r) => r.key)).toEqual([...PLOT_STRATEGY_KEY_ORDER]);
        expect(evaluation.ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
        expect(evaluation.top).toBe(evaluation.ranked[0]);
        expect(evaluation.baseline.gainVsBaselinePct).toBe(0);

        for (const res of evaluation.results) {
          expect(res.fariScore).toBeGreaterThanOrEqual(0);
          expect(res.fariScore).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('matches applyClimateStress and rankFarmStrategies when no shocks are active', () => {
    for (const farm of FARMS) {
      for (const month of [1, 4, 7, 10]) {
        const evaluation = evaluatePlotStrategies({ farmId: farm.id, month });
        const expectedClimate = applyClimateStress(farm.id, month, 'baseline');
        const expectedFari = rankFarmStrategies(farm.id, month, 'baseline');

        expect(evaluation.climate).toEqual(expectedClimate);

        const s1 = evaluation.results.find((r) => r.key === 'baseline')!;
        const s2 = evaluation.results.find((r) => r.key === 'regenerator')!;
        const s3 = evaluation.results.find((r) => r.key === 'resilient-cash')!;

        expect(s1.fariScore).toBe(
          expectedFari.strategies.find((s) => s.strategyId === 'S1')!.fariScore,
        );
        expect(s2.fariScore).toBe(
          expectedFari.strategies.find((s) => s.strategyId === 'S2')!.fariScore,
        );
        expect(s3.fariScore).toBe(
          expectedFari.strategies.find((s) => s.strategyId === 'S3')!.fariScore,
        );
      }
    }
  });

  it('applies linear dashboard shock factors accurately and combinably', () => {
    const base = applyClimateStress('nueva-ecija', 4, 'baseline');

    const rainOnly = applyDashboardShocks(base, { rainfallShock: true, heatShock: false });
    expect(rainOnly.adjustedDailyRainfallMm).toBe(roundTo(base.baselineDailyRainfallMm * 0.8, 2));
    expect(rainOnly.stormDaysGe14Mm).toBe(roundTo(base.stormDaysGe14Mm * 0.8, 2));
    expect(rainOnly.adjustedRootZoneMoisturePct).toBe(Math.round(base.baselineRootZoneMoisturePct * 0.81));
    expect(rainOnly.droughtDelta).toBe(0.2);

    const heatOnly = applyDashboardShocks(base, { rainfallShock: false, heatShock: true });
    expect(heatOnly.adjustedTempC).toBe(roundTo(base.baselineTempC + 2, 2));
    expect(heatOnly.adjustedMaxTempC).toBe(roundTo(base.baselineMaxTempC + 2, 2));
    expect(heatOnly.adjustedRootZoneMoisturePct).toBe(Math.round(base.baselineRootZoneMoisturePct * 0.88));
    expect(heatOnly.droughtDelta).toBe(0.12);

    const combined = applyDashboardShocks(base, { rainfallShock: true, heatShock: true });
    expect(combined.droughtDelta).toBe(0.32);
    expect(combined.adjustedRootZoneMoisturePct).toBe(Math.round(base.baselineRootZoneMoisturePct * 0.7128));

    const unshockedEval = evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 4 });
    const shockedEval = evaluatePlotStrategies({
      farmId: 'nueva-ecija',
      month: 4,
      shocks: { rainfallShock: true },
    });
    expect(shockedEval.baseline.fariScore).toBeLessThanOrEqual(unshockedEval.baseline.fariScore);
  });

  it('clamps invalid months and falls back to equal weights when all weights are zero', () => {
    expect(evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 0 }).month).toBe(1);
    expect(evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 13 }).month).toBe(12);
    expect(evaluatePlotStrategies({ farmId: 'nueva-ecija', month: Number.NaN }).month).toBe(1);

    const zeroWeightsEval = evaluatePlotStrategies({
      farmId: 'nueva-ecija',
      month: 1,
      weights: { water: 0, erosion: 0, nutrients: 0, market: 0 },
    });
    expect(zeroWeightsEval.normalizedWeights).toEqual(DEFAULT_PRIORITY_WEIGHTS);
  });

  it('derives the market optimizer strategy without mutating FARMS', () => {
    const farm = FARMS.find((f) => f.id === 'nueva-ecija')!;
    const snapshot = JSON.stringify(farm);
    const derived = deriveMarketOptimizerStrategy(farm);
    const source = farm.strategies.find((s) => s.id === derived.sourceStrategyId)!;

    expect(derived.strategy.residueMulch).toBe(roundTo(source.residueMulch * 0.5, 2));
    expect(JSON.stringify(farm)).toBe(snapshot);

    const evalRes = evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 1 });
    const optimizer = evalRes.results.find((r) => r.key === 'market-optimizer')!;
    const sourceRes = evalRes.results.find(
      (r) => r.sourceStrategyId === derived.sourceStrategyId && !r.isDerivedVariant,
    )!;

    expect(optimizer.breakdown.pillars.market).toBeGreaterThanOrEqual(
      sourceRes.breakdown.pillars.market,
    );
    expect(optimizer.breakdown.pillars.nutrients).toBeLessThanOrEqual(
      sourceRes.breakdown.pillars.nutrients,
    );
  });

  it('applies local OPV seed fallback for Philippine farms and avoids PH OPV names for US farms', () => {
    const neEval = evaluatePlotStrategies({
      farmId: 'nueva-ecija',
      month: 1,
      shocks: { localSeedFallback: true },
    });
    for (const res of neEval.results) {
      expect(res.displayCultivars.every((c) => c.type !== 'commercial')).toBe(true);
    }

    const neFarm = FARMS.find((f) => f.id === 'nueva-ecija')!;
    const s3 = neFarm.strategies.find((s) => s.id === 'S3')!;
    const swapped = applyLocalSeedFallback(s3, 'Philippines');
    if (swapped.swapped) {
      expect(swapped.strategy.priceIndex).toBe(roundTo(s3.priceIndex * 0.95, 3));
    }

    const usEval = evaluatePlotStrategies({
      farmId: 'usa-midwest',
      month: 6,
      shocks: { localSeedFallback: true },
    });
    const phOpvNames = ['Pag-asa 7 Mungbean', 'Tiniguib White Corn', 'Super Bureau Camote'];
    for (const res of usEval.results) {
      for (const c of res.displayCultivars) {
        expect(phOpvNames).not.toContain(c.name);
      }
    }
  });

  it('classifies fertilizer application windows across red, amber, green, and legume N-fix cases', () => {
    const base = applyClimateStress('nueva-ecija', 1, 'baseline');
    const benign = {
      ...base,
      adjustedDailyRainfallMm: 3,
      stormDaysGe14Mm: 0,
      adjustedRootZoneMoisturePct: 65,
      adjustedMaxTempC: 30,
    };

    const redRain = classifyApplicationWindow({ ...benign, adjustedDailyRainfallMm: 15 }, { nFixKgHa: 0 });
    expect(redRain.level).toBe('red');
    expect(redRain.title).toContain('Forecasted');

    const redStorm = classifyApplicationWindow({ ...benign, stormDaysGe14Mm: 4 }, { nFixKgHa: 0 });
    expect(redStorm.level).toBe('red');

    const amberRain = classifyApplicationWindow({ ...benign, adjustedDailyRainfallMm: 9 }, { nFixKgHa: 0 });
    expect(amberRain.level).toBe('amber');

    const amberDry = classifyApplicationWindow({ ...benign, adjustedRootZoneMoisturePct: 40 }, { nFixKgHa: 0 });
    expect(amberDry.level).toBe('amber');

    const green = classifyApplicationWindow(benign, { nFixKgHa: 0 });
    expect(green.level).toBe('green');

    const legume = classifyApplicationWindow(benign, { nFixKgHa: 45 });
    expect(legume.advice.toLowerCase()).toContain('test soil');
  });

  it('breaks rank ties in favor of baseline and computes gain percentage safely', () => {
    const evalRes = evaluatePlotStrategies({ farmId: 'nueva-ecija', month: 1 });
    const tied = evalRes.results.map((r) => ({ ...r, fariScore: 70 }));
    const ranked = rankPlotResults(tied);
    expect(ranked[0].key).toBe('baseline');
    expect(ranked[0].rank).toBe(1);

    expect(computeGainPct(50, 0)).toBeNull();
    expect(computeGainPct(55, 50)).toBe(10);
  });
});
