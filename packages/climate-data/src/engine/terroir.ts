import { getFarmById } from '../farms';
import type {
  CropStrategy,
  FarmId,
  NutrientGapItem,
  StressScenarioId,
  TerroirAssessment,
} from '../types/agritech';
import { clamp, roundTo } from './normalization';
import { applyClimateStress } from './stress';

/**
 * Estimates synthetic urea reduction percentage (0% for non-legumes, 25-40% for legumes).
 * Labeled as a literature-range "Projected estimate" in the UI.
 */
export const calculateUreaReductionPct = (nFixKgHa: number): number => {
  if (!Number.isFinite(nFixKgHa) || nFixKgHa <= 0) return 0;
  return Math.round(clamp(25 + 15 * ((nFixKgHa - 35) / 45), 25, 40));
};

export const calculateMangoSugarLoadingIndex = (
  solarRadiationMjM2Day: number,
  dryDaysLt3Mm: number,
  slopePct: number,
): {
  sugarLoadingIndex: number;
  solarIndex: number;
  drySpellIndex: number;
  drainageIndex: number;
} => {
  const solarIndex = clamp((solarRadiationMjM2Day - 14.0) / 10.0, 0, 1);
  const drySpellIndex = clamp(dryDaysLt3Mm / 25.0, 0, 1);
  const drainageIndex = clamp(1 - Math.abs(slopePct - 6.0) / 10.0, 0.3, 1.0);

  const sugarLoadingIndex = Math.round(
    clamp(100 * (0.45 * solarIndex + 0.4 * drySpellIndex + 0.15 * drainageIndex), 0, 100),
  );

  return {
    sugarLoadingIndex,
    solarIndex: roundTo(solarIndex, 3),
    drySpellIndex: roundTo(drySpellIndex, 3),
    drainageIndex: roundTo(drainageIndex, 3),
  };
};

export const calculateTerroirAssessment = (
  farmId: FarmId,
  strategyId: CropStrategy['id'],
  monthNumber: number,
  scenarioId: StressScenarioId = 'baseline',
): TerroirAssessment => {
  const farm = getFarmById(farmId);
  const strategy =
    farm.strategies.find((item) => item.id === strategyId) ?? farm.strategies[0];
  const climate = applyClimateStress(farmId, monthNumber, scenarioId);

  const base = farm.soilBaseline;
  const target = farm.targetIdealProfile;

  // Cover-crop / residue biological contributions
  const nContribution = strategy.nFixKgHa;
  const pContribution = roundTo(strategy.residueMulch * 5.0, 1);
  const kContribution = roundTo(strategy.residueMulch * 22.0, 1);
  const omContribution = roundTo(strategy.residueMulch * 0.65, 2);
  const phBufferContribution = roundTo(strategy.residueMulch * 0.2, 2);

  const nGap = roundTo(target.nitrogenKgHa - (base.nitrogenKgHa + nContribution), 1);
  const pGap = roundTo(target.phosphorusPpm - (base.phosphorusPpm + pContribution), 1);
  const kGap = roundTo(target.potassiumPpm - (base.potassiumPpm + kContribution), 1);
  const omGap = roundTo(target.organicMatterPct - (base.organicMatterPct + omContribution), 2);
  const phDelta = roundTo(target.ph - (base.ph + phBufferContribution), 2);

  const nutrientGaps: NutrientGapItem[] = [
    {
      nutrient: 'Nitrogen (kg N/ha eq.)',
      unit: 'kg N/ha',
      soilBaseline: base.nitrogenKgHa,
      coverCropContribution: nContribution,
      targetIdeal: target.nitrogenKgHa,
      adjustmentGap: nGap,
      advisoryNote:
        nContribution > 0
          ? `Biological legume fixation (+${nContribution} kg N/ha projected) narrows the seasonal N gap.`
          : 'Zero biological N fixation in baseline monoculture; relies on external N inputs.',
    },
    {
      nutrient: 'Phosphorus (ppm)',
      unit: 'ppm P',
      soilBaseline: base.phosphorusPpm,
      coverCropContribution: pContribution,
      targetIdeal: target.phosphorusPpm,
      adjustmentGap: pGap,
      advisoryNote:
        'Root exudates and organic mulch aid phosphorus cycling, especially needed for legume nodulation.',
    },
    {
      nutrient: 'Potassium (ppm)',
      unit: 'ppm K',
      soilBaseline: base.potassiumPpm,
      coverCropContribution: kContribution,
      targetIdeal: target.potassiumPpm,
      adjustmentGap: kGap,
      advisoryNote:
        'Returned crop haulms and vine mulch recycle potassium critical for grain fill and mango Brix.',
    },
    {
      nutrient: 'Organic Matter (%)',
      unit: '% OM',
      soilBaseline: base.organicMatterPct,
      coverCropContribution: omContribution,
      targetIdeal: target.organicMatterPct,
      adjustmentGap: omGap,
      advisoryNote:
        'High residue mulch and continuous root biomass build water-holding soil organic matter.',
    },
    {
      nutrient: 'Soil pH (target delta)',
      unit: 'pH units',
      soilBaseline: base.ph,
      coverCropContribution: phBufferContribution,
      targetIdeal: target.ph,
      adjustmentGap: phDelta,
      advisoryNote:
        'pH delta indicates acidity buffering need (verify with local lab test for lime rate; not a fertilizer mass).',
    },
  ];

  const sugarRes = calculateMangoSugarLoadingIndex(
    climate.solarRadiationMj,
    climate.dryDaysLt3Mm,
    farm.slopePct,
  );

  return {
    farmId,
    strategyId: strategy.id,
    month: climate.month,
    nutrientGaps,
    mangoSugarLoadingIndex: sugarRes.sugarLoadingIndex,
    targetBrixRange: '18–22° Brix',
    estimatedUreaReductionPct: calculateUreaReductionPct(strategy.nFixKgHa),
    solarIndex: sugarRes.solarIndex,
    drySpellIndex: sugarRes.drySpellIndex,
    drainageIndex: sugarRes.drainageIndex,
    dataStatus: 'modeled',
  };
};
