import { getFarmById } from '../farms';
import { PLACES_BY_ID } from '../places';
import type {
  CfiMonthWindow,
  CropStrategy,
  FarmId,
  GroundTruthFieldInput,
  MonthlyZScoreAnomaly,
  PriorityWeights,
  SiComparisonResult,
  SoilCertificateEvaluation,
  StressScenarioId,
} from '../types/agritech';
import { rankFarmStrategies } from './fari';
import { clamp, DEFAULT_PRIORITY_WEIGHTS, roundTo } from './normalization';
import { applyClimateStress, getExtendedMonthlyRecord } from './stress';

const classifyZScore = (
  z: number,
): MonthlyZScoreAnomaly['anomalyClass'] => {
  if (z <= -1.5) return 'extreme-low';
  if (z <= -0.8) return 'moderate-low';
  if (z >= 1.5) return 'extreme-high';
  if (z >= 0.8) return 'moderate-high';
  return 'normal';
};

export const calculateSiComparison = (
  farmId: FarmId,
  monthNumber: number,
  scenarioId: StressScenarioId = 'baseline',
  strategyId: CropStrategy['id'] = 'S2',
  rawWeights: Partial<PriorityWeights> = DEFAULT_PRIORITY_WEIGHTS,
): SiComparisonResult => {
  const m = clamp(Math.round(monthNumber), 1, 12);
  const climate = applyClimateStress(farmId, m, scenarioId);
  const ext = getExtendedMonthlyRecord(farmId, m);
  const b25 = ext.baseline2001_2025;
  const placeMonth = PLACES_BY_ID[farmId].monthly[m - 1];

  const computeZ = (val: number, meanVal: number, stdVal: number): number =>
    roundTo((val - meanVal) / Math.max(stdVal, 0.01), 2);

  const zTemp = computeZ(climate.adjustedTempC, b25.t2mMeanC, b25.t2mStdC);
  const zPrec = computeZ(climate.adjustedDailyPrecipMm, b25.precMeanMmDay, b25.precStdMmDay);
  const zRoot = computeZ(climate.adjustedGwetRoot, b25.gwetRootMean, b25.gwetRootStd);
  const zTop = computeZ(climate.adjustedGwetTop, b25.gwetTopMean, b25.gwetTopStd);
  const zSolar = computeZ(
    climate.solarRadiationMjM2Day,
    b25.solarMeanMjM2Day,
    b25.solarStdMjM2Day,
  );

  const anomalies: MonthlyZScoreAnomaly[] = [
    {
      variable: 'GWETROOT',
      label: 'Root-Zone Soil Wetness (0–100 cm)',
      unit: '0–1 index',
      currentValue: climate.adjustedGwetRoot,
      mean2001_2025: b25.gwetRootMean,
      std2001_2025: b25.gwetRootStd,
      zScore: zRoot,
      anomalyClass: classifyZScore(zRoot),
      plainInterpretation:
        zRoot <= -0.8
          ? 'Root zone is drier than the 25-year norm; favors deep-rooting legumes or sorghum over shallow rice/corn.'
          : zRoot >= 0.8
            ? 'Root zone is wetter than the 25-year norm; watch drainage and slope runoff.'
            : 'Root-zone moisture tracks near the 2001–2025 historical average.',
    },
    {
      variable: 'GWETTOP',
      label: 'Surface Soil Wetness (0–5 cm)',
      unit: '0–1 index',
      currentValue: climate.adjustedGwetTop,
      mean2001_2025: b25.gwetTopMean,
      std2001_2025: b25.gwetTopStd,
      zScore: zTop,
      anomalyClass: classifyZScore(zTop),
      plainInterpretation:
        zTop <= -0.8 || climate.adjustedGwetTop < 0.55
          ? 'Topsoil is dry and exposed to evaporative baking; surface mulch or fast-closing relay cover is critical.'
          : 'Surface moisture is adequate for seed germination and shallow root establishment.',
    },
    {
      variable: 'T2M',
      label: '2m Mean Air Temperature',
      unit: '°C',
      currentValue: climate.adjustedTempC,
      mean2001_2025: b25.t2mMeanC,
      std2001_2025: b25.t2mStdC,
      zScore: zTemp,
      anomalyClass: classifyZScore(zTemp),
      plainInterpretation:
        zTemp >= 1.0
          ? 'Elevated thermal anomaly above 25-year baseline; accelerates crop evapotranspiration.'
          : 'Temperature is within normal seasonal bounds.',
    },
    {
      variable: 'PRECTOTCORR',
      label: 'Daily Precipitation Rate',
      unit: 'mm/day',
      currentValue: climate.adjustedDailyPrecipMm,
      mean2001_2025: b25.precMeanMmDay,
      std2001_2025: b25.precStdMmDay,
      zScore: zPrec,
      anomalyClass: classifyZScore(zPrec),
      plainInterpretation:
        zPrec <= -0.8
          ? 'Rainfall deficit relative to 25-year norm; avoid high water-demand monocrops.'
          : zPrec >= 0.8
            ? 'Above-normal rainfall intensity; prioritize contour ground cover and delay foliar sprays.'
            : 'Precipitation tracks near the 25-year monthly mean.',
    },
    {
      variable: 'ALLSKY_SFC_SW_DWN',
      label: 'Surface Solar Irradiance',
      unit: 'MJ/m²/day',
      currentValue: climate.solarRadiationMjM2Day,
      mean2001_2025: b25.solarMeanMjM2Day,
      std2001_2025: b25.solarStdMjM2Day,
      zScore: zSolar,
      anomalyClass: classifyZScore(zSolar),
      plainInterpretation:
        climate.solarRadiationMjM2Day >= 20
          ? 'High solar energy supports C4 photosynthesis and mango sugar loading if soil moisture is mulched.'
          : 'Moderate cloud-attenuated solar radiation.',
    },
  ];

  // Approach B: Rule-based suitability ensemble (RF-style)
  const fariEval = rankFarmStrategies(farmId, m, scenarioId, rawWeights);
  const stratBreakdown =
    fariEval.strategies.find((item) => item.strategyId === strategyId) ??
    fariEval.topStrategy;

  const validSamples =
    placeMonth.temperatureSamples +
    placeMonth.precipitationSamples +
    placeMonth.rootWetnessSamples +
    placeMonth.surfaceWetnessSamples +
    placeMonth.relativeHumiditySamples +
    placeMonth.solarRadiationSamples +
    placeMonth.imergPrecipitationSamples;
  const expectedSamples = 6 * 7;
  const sampleCompleteness = clamp(validSamples / expectedSamples, 0, 1);

  const orbitalConfidencePct = Math.round(80 * sampleCompleteness);
  const groundTruthRequiredPct = 100 - orbitalConfidencePct;

  const moistureStabilityScore = Math.round(stratBreakdown.pillars.water * 100);
  const erosionControlScore = Math.round(stratBreakdown.pillars.erosion * 100);
  const thermalWindowScore = Math.round((1 - stratBreakdown.diagnostics.heatPenalty) * 100);
  const nutrientRegenScore = Math.round(stratBreakdown.pillars.nutrients * 100);

  // FARI applies the farmer's normalized W/E/N/M weights to the suitability pillars.
  const suitabilityScore = Math.round(stratBreakdown.fariScore);

  return {
    farmId,
    month: m,
    monthLabel: climate.monthLabel,
    approachA: {
      name: 'Monthly Z-Score Anomaly Decomposition (2001–2025 NASA POWER Baseline)',
      baselinePeriod: '2001–2025 (25-year monthly climatology)',
      sampleYears: b25.yearsSampled,
      anomalies,
      bareFieldRiskDetected: climate.adjustedGwetTop < 0.6 || zTop <= -0.8,
      droughtOnsetDetected: climate.adjustedGwetRoot < 0.62 || zRoot <= -0.8,
      thermalStressDetected: climate.adjustedMaxTempC >= 33.0 || zTemp >= 1.0,
    },
    approachB: {
      label: 'Rule-based suitability ensemble (RF-style)',
      suitabilityScore,
      orbitalConfidencePct,
      groundTruthRequiredPct,
      confidenceBanner: `Orbital Confidence ${orbitalConfidencePct}% | Ground-Truth Testing Required ${groundTruthRequiredPct}%`,
      ruleBreakdown: {
        moistureStabilityScore,
        erosionControlScore,
        thermalWindowScore,
        nutrientRegenScore,
      },
    },
  };
};

/**
 * 90-Day (3 consecutive calendar months starting at startMonth) Climatological
 * Chemical Flower Induction (CFI) & Foliar Spray Risk Validator.
 * Uses real 2020-2025 daily event counts from nasaExtendedTelemetry.json.
 */
export const calculateCfiSprayCalendar = (
  farmId: FarmId,
  startMonth: number,
  scenarioId: StressScenarioId = 'baseline',
): CfiMonthWindow[] => {
  const start = clamp(Math.round(startMonth), 1, 12);
  const months = [start, ((start) % 12) + 1, ((start + 1) % 12) + 1];

  return months.map((m) => {
    const climate = applyClimateStress(farmId, m, scenarioId);

    const isRedWashout =
      climate.stormDaysGe14Mm >= 4.0 || climate.adjustedDailyPrecipMm >= 8.0;
    const isAmberStress =
      !isRedWashout &&
      (climate.heatStressDaysGe33C >= 8.0 ||
        climate.adjustedMaxTempC >= 33.0 ||
        climate.coldDaysLe2C >= 2.0 ||
        climate.adjustedGwetRoot < 0.45);

    if (isRedWashout) {
      return {
        month: m,
        monthLabel: climate.monthLabel,
        riskLevel: 'red',
        badgeText: 'Red · High Storm Washout Risk',
        stormDaysGe14Mm: climate.stormDaysGe14Mm,
        heatStressDaysGe33C: climate.heatStressDaysGe33C,
        coldDaysLe2C: climate.coldDaysLe2C,
        dryDaysLt3Mm: climate.dryDaysLt3Mm,
        t2mMaxC: climate.adjustedMaxTempC,
        t2mMinC: climate.baselineMinTempC,
        gwetRoot: climate.adjustedGwetRoot,
        farmerActionAdvisory: `Delay KNO₃ flower induction and foliar sprays: historical 2020–2025 records average ${climate.stormDaysGe14Mm.toFixed(1)} heavy storm days (≥14 mm/day) in ${climate.monthLabel}. Prioritize contour ground cover and drainage.`,
      };
    }

    if (isAmberStress) {
      const reason =
        climate.coldDaysLe2C >= 2.0
          ? `freeze/cold shock risk (${climate.coldDaysLe2C.toFixed(1)} days ≤2°C; Tmin ${climate.baselineMinTempC.toFixed(1)}°C)`
          : `elevated canopy thermal stress (${climate.heatStressDaysGe33C.toFixed(1)} days ≥33°C; Tmax ${climate.adjustedMaxTempC.toFixed(1)}°C)`;
      return {
        month: m,
        monthLabel: climate.monthLabel,
        riskLevel: 'amber',
        badgeText: 'Amber · Thermal / Cold / Moisture Caution',
        stormDaysGe14Mm: climate.stormDaysGe14Mm,
        heatStressDaysGe33C: climate.heatStressDaysGe33C,
        coldDaysLe2C: climate.coldDaysLe2C,
        dryDaysLt3Mm: climate.dryDaysLt3Mm,
        t2mMaxC: climate.adjustedMaxTempC,
        t2mMinC: climate.baselineMinTempC,
        gwetRoot: climate.adjustedGwetRoot,
        farmerActionAdvisory: `Caution for ${climate.monthLabel}: ${reason}. Apply organic ring-mulch or relay legume cover first, and spray only in cool early-morning hours (5:30–8:00 AM).`,
      };
    }

    return {
      month: m,
      monthLabel: climate.monthLabel,
      riskLevel: 'green',
      badgeText: 'Green · Optimal Induction & Spray Window',
      stormDaysGe14Mm: climate.stormDaysGe14Mm,
      heatStressDaysGe33C: climate.heatStressDaysGe33C,
      coldDaysLe2C: climate.coldDaysLe2C,
      dryDaysLt3Mm: climate.dryDaysLt3Mm,
      t2mMaxC: climate.adjustedMaxTempC,
      t2mMinC: climate.baselineMinTempC,
      gwetRoot: climate.adjustedGwetRoot,
      farmerActionAdvisory: `Favorable climatological window in ${climate.monthLabel} (${climate.dryDaysLt3Mm.toFixed(1)} dry days <3 mm/day, only ${climate.stormDaysGe14Mm.toFixed(1)} storm days ≥14 mm/day). Confirm 24-hour local weather forecast before spraying.`,
    };
  });
};

export const evaluateTwoTierSoilCertificate = (
  farmId: FarmId,
  strategyId: CropStrategy['id'],
  monthNumber: number,
  scenarioId: StressScenarioId = 'baseline',
  groundTruth?: Partial<GroundTruthFieldInput>,
): SoilCertificateEvaluation => {
  const farm = getFarmById(farmId);
  const fariEval = rankFarmStrategies(farmId, monthNumber, scenarioId);
  const stratScore =
    fariEval.strategies.find((s) => s.strategyId === strategyId) ??
    fariEval.topStrategy;

  const tier1OrbitalScore = Math.round(stratScore.fariScore);

  const hasPh =
    typeof groundTruth?.measuredPh === 'number' &&
    groundTruth.measuredPh >= 3.5 &&
    groundTruth.measuredPh <= 9.0;
  const hasN =
    typeof groundTruth?.measuredNitrogenKgHa === 'number' &&
    groundTruth.measuredNitrogenKgHa >= 0 &&
    groundTruth.measuredNitrogenKgHa <= 1000;
  const hasP =
    typeof groundTruth?.measuredPhosphorusPpm === 'number' &&
    groundTruth.measuredPhosphorusPpm >= 0 &&
    groundTruth.measuredPhosphorusPpm <= 5000;
  const hasK =
    typeof groundTruth?.measuredPotassiumPpm === 'number' &&
    groundTruth.measuredPotassiumPpm >= 0 &&
    groundTruth.measuredPotassiumPpm <= 5000;
  const hasOm =
    typeof groundTruth?.measuredOrganicMatterPct === 'number' &&
    groundTruth.measuredOrganicMatterPct >= 0 &&
    groundTruth.measuredOrganicMatterPct <= 15;
  const hasTexture =
    groundTruth?.soilTextureVerified === true &&
    typeof groundTruth.soilTextureClass === 'string';

  const groundTruthVerified = hasPh && hasN && hasP && hasK && hasOm && hasTexture;

  let tier2GroundTruthScore = 0;
  if (groundTruthVerified && groundTruth) {
    const phScore = clamp(
      1 - Math.abs((groundTruth.measuredPh as number) - farm.targetIdealProfile.ph) / 2.5,
      0.3,
      1,
    );
    const nScore = clamp(
      (groundTruth.measuredNitrogenKgHa as number) / farm.targetIdealProfile.nitrogenKgHa,
      0.3,
      1,
    );
    const pScore = clamp(
      (groundTruth.measuredPhosphorusPpm as number) / farm.targetIdealProfile.phosphorusPpm,
      0.3,
      1,
    );
    const kScore = clamp(
      (groundTruth.measuredPotassiumPpm as number) / farm.targetIdealProfile.potassiumPpm,
      0.3,
      1,
    );
    const omScore = clamp(
      (groundTruth.measuredOrganicMatterPct as number) /
        farm.targetIdealProfile.organicMatterPct,
      0.3,
      1,
    );
    tier2GroundTruthScore = Math.round(
      100 * (0.2 * phScore + 0.2 * nScore + 0.2 * pScore + 0.2 * kScore + 0.2 * omScore),
    );
  }

  const combinedCertificateScore = Math.round(
    0.8 * tier1OrbitalScore + 0.2 * tier2GroundTruthScore,
  );

  return {
    farmId,
    strategyId,
    tier1OrbitalScore,
    tier1WeightPct: 80,
    tier2GroundTruthScore,
    tier2WeightPct: 20,
    combinedCertificateScore,
    groundTruthVerified,
    badgeStatus: groundTruthVerified
      ? 'Verified Soil Health & Terroir Badge (Orbital + Ground-Truth)'
      : 'Preliminary Orbital Tier (80% Max)',
  };
};
