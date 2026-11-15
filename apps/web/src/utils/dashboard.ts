import {
  clamp,
  getEcoCropReferencesForCrops,
  type AdjustedClimateContext,
  type CropStrategy,
  type PlotStrategyResult,
} from '@fieldshift/climate-data';

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const KPI_THRESHOLDS = {
  thermalStressC: 28.5,
  drySpellMmDay: 2,
  heavyRainMmDay: 14,
} as const;

export type Tone = 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

export const classifyTemperature = (c: number): { label: string; tone: Tone } =>
  c > KPI_THRESHOLDS.thermalStressC
    ? { label: 'Thermal stress', tone: 'rose' }
    : { label: 'Within range', tone: 'emerald' };

export const classifyRainfall = (mm: number): { label: string; tone: Tone } => {
  if (mm < KPI_THRESHOLDS.drySpellMmDay) {
    return { label: 'Dry spell', tone: 'amber' };
  }
  if (mm > KPI_THRESHOLDS.heavyRainMmDay) {
    return { label: 'Heavy-rain surge', tone: 'rose' };
  }
  return { label: 'Normal rainfall', tone: 'sky' };
};

export const rootZoneMoisturePct = (gwetRoot: number): number =>
  Math.round(clamp(gwetRoot, 0, 1) * 100);

export type TermKey = 'temp' | 'rain' | 'rootMoisture' | 'fari' | 'surfaceWetness';

export const TERM_LABELS: Record<TermKey, { plain: string; technical: string }> = {
  temp: {
    plain: 'Air Temperature',
    technical: 'T2M · 2 m air temperature',
  },
  rain: {
    plain: 'Daily Rainfall',
    technical: 'PRECTOTCORR · corrected precipitation',
  },
  rootMoisture: {
    plain: 'Root-Zone Soil Moisture (0–100 cm)',
    technical: 'GWETROOT · root-zone wetness index',
  },
  fari: {
    plain: 'Top FARI Suitability Score',
    technical: 'Top FARI score (W/E/N/M weighted)',
  },
  surfaceWetness: {
    plain: 'Topsoil moisture',
    technical: 'GWETTOP',
  },
};

export const termLabel = (key: TermKey, plainEnglish: boolean): string =>
  plainEnglish ? TERM_LABELS[key].plain : TERM_LABELS[key].technical;

export const sanitizePlainTelemetryCodes = (
  text: string,
  plainEnglish: boolean,
): string => {
  if (!plainEnglish) return text;
  return text
    .replace(/GWETROOT\/GWETTOP/g, 'root-zone and topsoil wetness')
    .replace(/GWETROOT/g, 'root-zone wetness')
    .replace(/GWETTOP/g, 'topsoil wetness')
    .replace(/PRECTOTCORR/g, 'corrected rainfall')
    .replace(/T2M_MAX/g, 'daily max air temperature')
    .replace(/T2M/g, 'air temperature');
};

export const cropDisplayName = (
  strategy: Pick<CropStrategy, 'crops'>,
  plainEnglish: boolean,
): string => {
  if (plainEnglish) {
    return strategy.crops.join(' + ');
  }

  return strategy.crops
    .map((crop) => {
      const refs = getEcoCropReferencesForCrops([crop]);
      return refs.length > 0 ? `${crop} (${refs[0].scientificName})` : crop;
    })
    .join(' + ');
};

export interface StrategyBadgeItem {
  label: string;
  value: string;
  tone: Tone;
}

export const strategyBadges = (
  result: PlotStrategyResult,
  plainEnglish: boolean,
): StrategyBadgeItem[] => {
  const { waterDemand, monthlySchedule } = result.strategy;
  const { nutrients, market } = result.breakdown.pillars;

  const waterBase =
    waterDemand >= 0.7
      ? { text: 'High', tone: 'rose' as Tone }
      : waterDemand >= 0.45
        ? { text: 'Medium', tone: 'amber' as Tone }
        : { text: 'Low', tone: 'emerald' as Tone };

  const soilBase =
    nutrients >= 0.5
      ? { text: 'Builds soil', tone: 'emerald' as Tone }
      : nutrients >= 0.25
        ? { text: 'Maintains', tone: 'amber' as Tone }
        : { text: 'Depletes', tone: 'rose' as Tone };

  const pestBreakMonths = monthlySchedule.filter((s) => s.pestBreakActive).length;
  const pestBase =
    pestBreakMonths >= 4
      ? { text: 'Breaks cycle', tone: 'emerald' as Tone }
      : pestBreakMonths >= 1
        ? { text: 'Partial break', tone: 'amber' as Tone }
        : { text: 'No break (continuous host)', tone: 'rose' as Tone };

  const marketBase =
    market >= 0.6
      ? { text: 'Strong', tone: 'emerald' as Tone }
      : market >= 0.4
        ? { text: 'Moderate', tone: 'amber' as Tone }
        : { text: 'Limited', tone: 'rose' as Tone };

  const seedSuffix = result.seedFallbackApplied ? ' · local seed' : '';

  return [
    {
      label: 'Water Demand',
      value: plainEnglish
        ? waterBase.text
        : `${waterBase.text} (${waterDemand.toFixed(2)})`,
      tone: waterBase.tone,
    },
    {
      label: 'Soil Health Impact',
      value: plainEnglish
        ? soilBase.text
        : `${soilBase.text} (${nutrients.toFixed(2)})`,
      tone: soilBase.tone,
    },
    {
      label: 'Pest & Disease Cycle Impact',
      value: plainEnglish
        ? pestBase.text
        : `${pestBase.text} (${pestBreakMonths} mo)`,
      tone: pestBase.tone,
    },
    {
      label: 'Market/Seed Viability',
      value: plainEnglish
        ? `${marketBase.text}${seedSuffix}`
        : `${marketBase.text} (${market.toFixed(2)})${seedSuffix}`,
      tone: marketBase.tone,
    },
  ];
};

export const formatGain = (result: PlotStrategyResult): string => {
  if (result.key === 'baseline') return 'Baseline';
  if (result.gainVsBaselinePct === null) return 'n/a (baseline scores 0)';
  if (result.gainVsBaselinePct > 0) return `+${result.gainVsBaselinePct}% vs baseline`;
  if (result.gainVsBaselinePct < 0) {
    return `−${Math.abs(result.gainVsBaselinePct)}% vs baseline`;
  }
  return '±0% vs baseline';
};

export const SMS_MAX_CHARS = 480;

export interface FieldBriefScriptInput {
  farmName: string;
  monthLabel: string;
  climate: AdjustedClimateContext;
  top: PlotStrategyResult;
  plainEnglish: boolean;
}

export const buildSmsFieldBrief = ({
  farmName,
  monthLabel,
  climate,
  top,
  plainEnglish,
}: FieldBriefScriptInput): string => {
  const lines = [
    `FieldShift brief – ${farmName}, ${monthLabel}`,
    `Weather: ${climate.adjustedTempC.toFixed(1)}°C, rain ${climate.adjustedDailyRainfallMm.toFixed(1)} mm/day, root-zone moisture ${Math.round(climate.adjustedRootZoneMoisturePct)}%`,
    `Top rotation: ${top.title} – ${cropDisplayName(top.strategy, plainEnglish)} (FARI ${top.fariScore.toFixed(1)}%)`,
    `Fertilizer window: ${top.applicationWindow.title}`,
    'Before acting: test soil pH/NPK (BSWM) & check with your Municipal Agriculture Office.',
    'Advisory only – based on NASA historical data.',
  ];

  const text = lines.join('\n');
  if (text.length <= SMS_MAX_CHARS) {
    return text;
  }
  return `${text.slice(0, SMS_MAX_CHARS - 1)}…`;
};

export const buildReadAloudScript = ({
  farmName,
  monthLabel,
  top,
  plainEnglish,
}: Pick<FieldBriefScriptInput, 'farmName' | 'monthLabel' | 'top' | 'plainEnglish'>): string =>
  `For ${farmName} in ${monthLabel}, the top suggested rotation is ${top.title}: ${cropDisplayName(top.strategy, plainEnglish)}, scoring ${top.fariScore.toFixed(1)} out of 100. Field action: ${top.applicationWindow.title}. ${top.applicationWindow.advice} Please confirm with a soil test and your Municipal Agriculture Office.`;
