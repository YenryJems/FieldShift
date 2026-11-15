import extendedTelemetryRaw from '../nasaExtendedTelemetry.json';
import { wetnessIndexToPct } from '../metricLabels';
import { getMonthlyTelemetry } from '../nasaTelemetryData';
import type {
  AdjustedClimateContext,
  FarmId,
  StressScenarioId,
} from '../types/agritech';
import { clamp, roundTo } from './normalization';

export interface StressPresetDefinition {
  id: StressScenarioId;
  label: string;
  shortLabel: string;
  description: string;
  precipMultiplier: number;
  tempDeltaC: number;
  wetnessMultiplier: number;
  droughtDelta: number;
}

export const STRESS_PRESETS: Record<StressScenarioId, StressPresetDefinition> = {
  baseline: {
    id: 'baseline',
    label: 'Historical Baseline (2020–2025)',
    shortLabel: 'Baseline',
    description: 'Observed 2020–2025 NASA POWER & GPM IMERG monthly averages with no artificial shock.',
    precipMultiplier: 1.0,
    tempDeltaC: 0.0,
    wetnessMultiplier: 1.0,
    droughtDelta: 0.0,
  },
  drought: {
    id: 'drought',
    label: 'Drought Shock (−30% Rain)',
    shortLabel: 'Drought (−30% Rain)',
    description: 'Reduces rainfall by 30%, lowers surface/root-zone soil wetness by 28%, and raises drought anomaly (+0.30).',
    precipMultiplier: 0.7,
    tempDeltaC: 0.8,
    wetnessMultiplier: 0.72,
    droughtDelta: 0.3,
  },
  heatwave: {
    id: 'heatwave',
    label: 'Thermal Heatwave (+2.5°C)',
    shortLabel: 'Heatwave (+2.5°C)',
    description: 'Increases mean & maximum temperatures by +2.5°C, reduces soil wetness by 15%, and amplifies evaporative & pollination stress.',
    precipMultiplier: 0.9,
    tempDeltaC: 2.5,
    wetnessMultiplier: 0.85,
    droughtDelta: 0.15,
  },
  deluge: {
    id: 'deluge',
    label: 'Monsoon Deluge (+40% Rain Burst)',
    shortLabel: 'Deluge (+40% Rain)',
    description: 'Increases extreme rain-burst intensity by +40% and raises root-zone saturation (+15%), elevating slope runoff and waterlogging exposure.',
    precipMultiplier: 1.4,
    tempDeltaC: 0.0,
    wetnessMultiplier: 1.15,
    droughtDelta: 0.0,
  },
};

interface ExtendedMonthlyRecord {
  month: number;
  label: string;
  t2mMaxC: number;
  t2mMinC: number;
  evapMmDay: number;
  p95DailyPrecipMm: number;
  meanStormDaysGe14Mm: number;
  meanDryDaysLt3Mm: number;
  meanHeatStressDaysGe33C: number;
  meanColdDaysLe2C: number;
  baseline2001_2025: {
    t2mMeanC: number;
    t2mStdC: number;
    precMeanMmDay: number;
    precStdMmDay: number;
    gwetRootMean: number;
    gwetRootStd: number;
    gwetTopMean: number;
    gwetTopStd: number;
    solarMeanMjM2Day: number;
    solarStdMjM2Day: number;
    yearsSampled: number;
  };
}

const EXTENDED_BY_FARM = extendedTelemetryRaw.farms as Record<
  FarmId,
  {
    id: FarmId;
    name: string;
    latitude: number;
    longitude: number;
    powerElevationM: number;
    sources: string[];
    monthly: ExtendedMonthlyRecord[];
  }
>;

export const getExtendedMonthlyRecord = (
  farmId: FarmId,
  monthNumber: number,
): ExtendedMonthlyRecord => {
  const m = clamp(Math.round(monthNumber), 1, 12);
  const farmExt = EXTENDED_BY_FARM[farmId];
  const rec = farmExt?.monthly.find((item) => item.month === m);
  if (!rec) {
    throw new Error(`Missing extended NASA telemetry for ${farmId}, month ${m}.`);
  }
  return rec;
};

export const applyClimateStress = (
  farmId: FarmId,
  monthNumber: number,
  scenarioId: StressScenarioId = 'baseline',
): AdjustedClimateContext => {
  const m = clamp(Math.round(monthNumber), 1, 12);
  const base = getMonthlyTelemetry(farmId, m);
  const ext = getExtendedMonthlyRecord(farmId, m);
  const preset = STRESS_PRESETS[scenarioId] ?? STRESS_PRESETS.baseline;

  const adjustedTempC = roundTo(base.airTempCelsius + preset.tempDeltaC, 2);
  const adjustedMaxTempC = roundTo(ext.t2mMaxC + preset.tempDeltaC, 2);
  const adjustedDailyRainfallMm = roundTo(
    Math.max(0, base.dailyRainfallMm * preset.precipMultiplier),
    2,
  );
  const adjustedRainBurstMm = roundTo(
    Math.max(0, ext.p95DailyPrecipMm * preset.precipMultiplier),
    2,
  );
  const adjustedSurfaceMoisturePct = wetnessIndexToPct(
    (base.surfaceSoilMoisturePct / 100) * preset.wetnessMultiplier,
  );
  const adjustedRootZoneMoisturePct = wetnessIndexToPct(
    (base.rootZoneMoisturePct / 100) * preset.wetnessMultiplier,
  );

  return {
    scenarioId: preset.id,
    scenarioLabel: preset.label,
    scenarioDescription: preset.description,
    month: m,
    monthLabel: base.month,
    baselineTempC: roundTo(base.airTempCelsius, 2),
    adjustedTempC,
    baselineMaxTempC: ext.t2mMaxC,
    adjustedMaxTempC,
    baselineMinTempC: ext.t2mMinC,
    baselineDailyRainfallMm: roundTo(base.dailyRainfallMm, 2),
    adjustedDailyRainfallMm,
    baselineRainBurstMm: ext.p95DailyPrecipMm,
    adjustedRainBurstMm,
    baselineSurfaceMoisturePct: base.surfaceSoilMoisturePct,
    adjustedSurfaceMoisturePct,
    baselineRootZoneMoisturePct: base.rootZoneMoisturePct,
    adjustedRootZoneMoisturePct,
    solarRadiationMj: roundTo(base.solarRadiationMj, 2),
    relativeHumidityPct: roundTo(base.relativeHumidityPct, 1),
    evapMmDay: ext.evapMmDay,
    stormDaysGe14Mm: roundTo(ext.meanStormDaysGe14Mm * preset.precipMultiplier, 2),
    dryDaysLt3Mm: ext.meanDryDaysLt3Mm,
    heatStressDaysGe33C: ext.meanHeatStressDaysGe33C,
    coldDaysLe2C: ext.meanColdDaysLe2C,
    droughtDelta: preset.droughtDelta,
  };
};
