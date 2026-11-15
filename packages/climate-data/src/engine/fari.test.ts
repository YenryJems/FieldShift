import { describe, expect, it } from 'vitest';
import { FARMS, FARMS_BY_ID } from '../farms';
import {
  calculateFariScore,
  DEFAULT_FIELD_CONSTRAINTS,
  rankFarmStrategies,
} from './fari';
import {
  clamp,
  DEFAULT_PRIORITY_WEIGHTS,
  interpolateCashScore,
  normalizeWeights,
} from './normalization';
import {
  calculateCfiSprayCalendar,
  calculateSiComparison,
  evaluateTwoTierSoilCertificate,
} from './siComparison';
import { applyClimateStress } from './stress';
import {
  calculateMangoSugarLoadingIndex,
  calculateTerroirAssessment,
  calculateUreaReductionPct,
} from './terroir';

describe('Phase 0 — Farm & Strategy Data Integrity', () => {
  it('defines exactly 5 required farms and 15 complete strategies', () => {
    const expectedIds = [
      'nueva-ecija',
      'bukidnon',
      'isabela',
      'guimaras',
      'usa-midwest',
    ];
    expect(FARMS.map((f) => f.id)).toEqual(expectedIds);

    for (const farm of FARMS) {
      expect(farm.strategies).toHaveLength(3);
      expect(farm.strategies.map((s) => s.id)).toEqual(['S1', 'S2', 'S3']);
      expect(farm.strategies[0].isBaseline).toBe(true);
      expect(farm.strategies[1].isBaseline).toBe(false);
      expect(farm.strategies[2].isBaseline).toBe(false);

      for (const strat of farm.strategies) {
        expect(strat.crops.length).toBeGreaterThan(0);
        expect(strat.rootDepthCm).toBeGreaterThanOrEqual(30);
        expect(strat.rootDepthCm).toBeLessThanOrEqual(120);
        expect(strat.nFixKgHa).toBeGreaterThanOrEqual(0);
        expect(strat.nFixKgHa).toBeLessThanOrEqual(80);
        expect(strat.canopyClosureDays).toBeGreaterThanOrEqual(20);
        expect(strat.canopyClosureDays).toBeLessThanOrEqual(90);
        expect(strat.residueMulch).toBeGreaterThanOrEqual(0);
        expect(strat.residueMulch).toBeLessThanOrEqual(1);
        expect(strat.contourFactor).toBeGreaterThanOrEqual(0);
        expect(strat.contourFactor).toBeLessThanOrEqual(1);
        expect(strat.cashTurnaroundDays).toBeGreaterThanOrEqual(50);
        expect(strat.forageValue).toBeGreaterThanOrEqual(0);
        expect(strat.forageValue).toBeLessThanOrEqual(1);
        expect(strat.waterDemand).toBeGreaterThanOrEqual(0);
        expect(strat.waterDemand).toBeLessThanOrEqual(1);
        expect(strat.priceIndex).toBeGreaterThanOrEqual(0);
        expect(strat.priceIndex).toBeLessThanOrEqual(1);
        expect(strat.monthlySchedule).toHaveLength(12);

        // All 5 rubric explanations must be non-empty
        expect(strat.explanations.whySuggested.length).toBeGreaterThan(20);
        expect(strat.explanations.supportingEvidence.length).toBeGreaterThan(20);
        expect(strat.explanations.expectedBenefits.length).toBeGreaterThan(20);
        expect(strat.explanations.dataGaps.length).toBeGreaterThan(20);
        expect(strat.explanations.localReviewAlerts.length).toBeGreaterThan(20);
      }
    }
  });
});

describe('Phase 1 — Normalization & Cash Score Interpolation', () => {
  it('normalizes positive weights to sum to 1 and falls back to 0.25 each when all zero', () => {
    const equal = normalizeWeights({ water: 0, erosion: 0, nutrients: 0, market: 0 });
    expect(equal).toEqual(DEFAULT_PRIORITY_WEIGHTS);

    const custom = normalizeWeights({ water: 50, erosion: 25, nutrients: 25, market: 0 });
    expect(custom.water).toBeCloseTo(0.5, 5);
    expect(custom.erosion).toBeCloseTo(0.25, 5);
    expect(custom.nutrients).toBeCloseTo(0.25, 5);
    expect(custom.market).toBeCloseTo(0, 5);
  });

  it('interpolates cash turnaround score between 60, 120, and 180+ days', () => {
    expect(interpolateCashScore(60)).toBeCloseTo(1.0, 5);
    expect(interpolateCashScore(90)).toBeCloseTo(0.7, 5);
    expect(interpolateCashScore(120)).toBeCloseTo(0.4, 5);
    expect(interpolateCashScore(150)).toBeCloseTo(0.25, 5);
    expect(interpolateCashScore(180)).toBeCloseTo(0.1, 5);
    expect(interpolateCashScore(220)).toBeCloseTo(0.1, 5);
    expect(clamp(1.4, 0, 1)).toBe(1);
    expect(clamp(-0.2, 0, 1)).toBe(0);
  });
});

describe('Phase 1 — FARI Scoring Engine & Worked Examples Across All 5 Farms', () => {
  it('computes deterministic worked examples for all 5 farms in April (dry/heat transition) and July (monsoon/summer)', () => {
    for (const farm of FARMS) {
      const aprilEval = rankFarmStrategies(farm.id, 4, 'baseline');
      const julyEval = rankFarmStrategies(farm.id, 7, 'baseline');

      expect(aprilEval.strategies).toHaveLength(3);
      expect(julyEval.strategies).toHaveLength(3);

      for (const s of aprilEval.strategies) {
        expect(s.fariScore).toBeGreaterThanOrEqual(0);
        expect(s.fariScore).toBeLessThanOrEqual(100);
        expect(s.pillars.water).toBeGreaterThanOrEqual(0);
        expect(s.pillars.water).toBeLessThanOrEqual(1);
        expect(s.pillars.erosion).toBeGreaterThanOrEqual(0);
        expect(s.pillars.erosion).toBeLessThanOrEqual(1);
        expect(s.pillars.nutrients).toBeGreaterThanOrEqual(0);
        expect(s.pillars.nutrients).toBeLessThanOrEqual(1);
        expect(s.pillars.market).toBeGreaterThanOrEqual(0);
        expect(s.pillars.market).toBeLessThanOrEqual(1);
      }
    }

    // Worked check 1: Nueva Ecija in April under Drought favors S2/S3 over water-hungry S1 paddy rice
    const neDrought = rankFarmStrategies('nueva-ecija', 4, 'drought');
    const neS1 = neDrought.strategies.find((s) => s.strategyId === 'S1')!;
    const neS2 = neDrought.strategies.find((s) => s.strategyId === 'S2')!;
    const neS3 = neDrought.strategies.find((s) => s.strategyId === 'S3')!;
    expect(neS2.fariScore).toBeGreaterThan(neS1.fariScore);
    expect(neS3.fariScore).toBeGreaterThan(neS1.fariScore);

    // Worked check 2: Bukidnon (11% slope) in July under Deluge differentiates Erosion pillar strongly
    const bukDeluge = rankFarmStrategies('bukidnon', 7, 'deluge');
    const bukS1 = bukDeluge.strategies.find((s) => s.strategyId === 'S1')!;
    const bukS3 = bukDeluge.strategies.find((s) => s.strategyId === 'S3')!;
    expect(bukS3.pillars.erosion).toBeGreaterThan(bukS1.pillars.erosion);
    expect(bukS3.fariScore).toBeGreaterThan(bukS1.fariScore);

    // Worked check 3: Isabela in May under Heatwave (+2.5°C) penalizes heat-sensitive S1 corn more than S3 sorghum+camote
    const isaHeat = rankFarmStrategies('isabela', 5, 'heatwave');
    const isaS1 = isaHeat.strategies.find((s) => s.strategyId === 'S1')!;
    const isaS3 = isaHeat.strategies.find((s) => s.strategyId === 'S3')!;
    expect(isaS1.diagnostics.heatPenalty).toBeGreaterThan(isaS3.diagnostics.heatPenalty);
    expect(isaS3.fariScore).toBeGreaterThan(isaS1.fariScore);
  });

  it('applies field constraints (rainfedOnly, manualToolsOnly, fastCashNeeded) deterministically', () => {
    const farm = FARMS_BY_ID['nueva-ecija'];
    const climate = applyClimateStress('nueva-ecija', 4, 'drought');
    const s1Base = calculateFariScore(
      farm.strategies[0],
      farm,
      climate,
      DEFAULT_PRIORITY_WEIGHTS,
      DEFAULT_FIELD_CONSTRAINTS,
    );
    const s1Constrained = calculateFariScore(
      farm.strategies[0],
      farm,
      climate,
      DEFAULT_PRIORITY_WEIGHTS,
      { rainfedOnly: true, manualToolsOnly: true, fastCashNeeded: true },
    );

    expect(s1Constrained.fariScore).toBeLessThan(s1Base.fariScore);
  });
});

describe('Phase 5 & 4 — Terroir, SI Comparison, CFI Spray Validator & Soil Certificate', () => {
  it('computes Guimaras Mango Sugar-Loading Index and urea reduction accurately', () => {
    // Guimaras in March (dry, high solar radiation) vs July (wet monsoon)
    const marTerroir = calculateTerroirAssessment('guimaras', 'S3', 3, 'baseline');
    const julTerroir = calculateTerroirAssessment('guimaras', 'S3', 7, 'baseline');

    expect(marTerroir.mangoSugarLoadingIndex).toBeGreaterThan(julTerroir.mangoSugarLoadingIndex);
    expect(marTerroir.estimatedUreaReductionPct).toBeGreaterThanOrEqual(25);
    expect(marTerroir.estimatedUreaReductionPct).toBeLessThanOrEqual(40);
    expect(calculateUreaReductionPct(0)).toBe(0);
    expect(calculateUreaReductionPct(20)).toBe(25);
    expect(calculateUreaReductionPct(80)).toBe(40);
    const guimaras = FARMS_BY_ID.guimaras;
    const s3NitrogenGap = marTerroir.nutrientGaps.find(
      (gap) => gap.nutrient === 'Nitrogen (kg N/ha eq.)',
    );
    expect(s3NitrogenGap?.adjustmentGap).toBe(
      guimaras.targetIdealProfile.nitrogenKgHa -
        (guimaras.soilBaseline.nitrogenKgHa + guimaras.strategies[2].nFixKgHa),
    );
    expect(calculateMangoSugarLoadingIndex(22, 24, 6).sugarLoadingIndex).toBeGreaterThan(80);
  });

  it('computes SI Comparison (Approach A z-scores & Approach B 80% Orbital / 20% Ground-Truth)', () => {
    const si = calculateSiComparison('guimaras', 3, 'baseline', 'S3');
    expect(si.approachA.sampleYears).toBe(25);
    expect(si.approachA.anomalies).toHaveLength(5);
    const rootAnomaly = si.approachA.anomalies.find((a) => a.rawCode === 'GWETROOT');
    expect(rootAnomaly?.unit).toBe('%');
    expect(rootAnomaly?.currentValue).toBeGreaterThanOrEqual(0);
    expect(rootAnomaly?.currentValue).toBeLessThanOrEqual(100);
    expect(si.approachB.label).toBe('Rule-based suitability ensemble (RF-style)');
    expect(si.approachB.orbitalConfidencePct).toBe(80);
    expect(si.approachB.groundTruthRequiredPct).toBe(20);
    expect(si.approachB.confidenceBanner).toBe(
      'Orbital Confidence 80% | Ground-Truth Testing Required 20%',
    );

    const waterPrioritySi = calculateSiComparison('guimaras', 3, 'baseline', 'S3', {
      water: 1,
      erosion: 0,
      nutrients: 0,
      market: 0,
    });
    expect(waterPrioritySi.approachB.suitabilityScore).toBe(
      Math.round(waterPrioritySi.approachB.ruleBreakdown.moistureStabilityScore),
    );
  });

  it('classifies 90-day CFI spray windows into Green/Amber (dry season) and Red (monsoon storm season)', () => {
    const drySeasonWindows = calculateCfiSprayCalendar('guimaras', 1, 'baseline');
    const wetSeasonWindows = calculateCfiSprayCalendar('guimaras', 7, 'baseline');

    expect(drySeasonWindows).toHaveLength(3);
    expect(drySeasonWindows[0].riskLevel).toBe('green');
    expect(drySeasonWindows[0].rootZoneMoisturePct).toBeGreaterThanOrEqual(0);
    expect(drySeasonWindows[0].rootZoneMoisturePct).toBeLessThanOrEqual(100);
    expect(drySeasonWindows[0].maxTempC).toBeGreaterThan(drySeasonWindows[0].minTempC);
    expect(wetSeasonWindows[0].riskLevel).toBe('red');
  });

  it('evaluates Two-Tier Soil Resilience Certificate (80% Orbital + 20% Ground-Truth)', () => {
    const prelim = evaluateTwoTierSoilCertificate('bukidnon', 'S3', 7, 'baseline');
    expect(prelim.groundTruthVerified).toBe(false);
    expect(prelim.badgeStatus).toBe('Preliminary Orbital Tier (80% Max)');

    const incomplete = evaluateTwoTierSoilCertificate('bukidnon', 'S3', 7, 'baseline', {
      measuredPh: 6.0,
      measuredNitrogenKgHa: 85,
      measuredOrganicMatterPct: 3.2,
      soilTextureClass: 'loam',
      soilTextureVerified: true,
    });
    expect(incomplete.groundTruthVerified).toBe(false);
    expect(incomplete.tier2GroundTruthScore).toBe(0);

    const verified = evaluateTwoTierSoilCertificate('bukidnon', 'S3', 7, 'baseline', {
      measuredPh: 6.0,
      measuredNitrogenKgHa: 85,
      measuredPhosphorusPpm: 28,
      measuredPotassiumPpm: 165,
      measuredOrganicMatterPct: 3.2,
      soilTextureClass: 'loam',
      soilTextureVerified: true,
    });
    expect(verified.groundTruthVerified).toBe(true);
    expect(verified.combinedCertificateScore).toBeGreaterThan(prelim.combinedCertificateScore);
    expect(verified.badgeStatus).toBe(
      'Verified Soil Health & Terroir Badge (Orbital + Ground-Truth)',
    );
  });
});
