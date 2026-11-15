import { clamp } from './engine/normalization';

export type MetricCategory = 'weather' | 'soil' | 'crop' | 'score';

export interface MetricDefinition {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  category: MetricCategory;
  rawCode: string;
  description: string;
}

/**
 * Convert a unitless [0, 1] NASA POWER wetness index into a 0-100% display scale.
 */
export const wetnessIndexToPct = (index: number): number =>
  Math.round(clamp(index, 0, 1) * 100);

export const METRIC_LABELS: Record<string, MetricDefinition> = {
  // Weather
  airTempCelsius: {
    key: 'airTempCelsius',
    label: 'Air Temperature',
    shortLabel: 'Air Temp',
    unit: '°C',
    category: 'weather',
    rawCode: 'T2M',
    description: 'Mean air temperature measured at 2 meters above the field surface.',
  },
  dailyRainfallMm: {
    key: 'dailyRainfallMm',
    label: 'Daily Rainfall',
    shortLabel: 'Rainfall',
    unit: 'mm/day',
    category: 'weather',
    rawCode: 'PRECTOTCORR',
    description: 'Bias-corrected average daily precipitation rate from satellite and gauge data.',
  },
  relativeHumidityPct: {
    key: 'relativeHumidityPct',
    label: 'Relative Humidity',
    shortLabel: 'Humidity',
    unit: '%',
    category: 'weather',
    rawCode: 'RH2M',
    description: 'Atmospheric moisture relative to saturation at 2 meters above ground.',
  },
  solarRadiationMj: {
    key: 'solarRadiationMj',
    label: 'Solar Radiation',
    shortLabel: 'Solar',
    unit: 'MJ/m²/day',
    category: 'weather',
    rawCode: 'ALLSKY_SFC_SW_DWN',
    description: 'All-sky downward shortwave solar energy reaching the crop canopy.',
  },

  // Soil
  surfaceSoilMoisturePct: {
    key: 'surfaceSoilMoisturePct',
    label: 'Surface Moisture',
    shortLabel: 'Topsoil',
    unit: '%',
    category: 'soil',
    rawCode: 'GWETTOP',
    description: 'Topsoil moisture (0–5 cm) scaled from NASA POWER surface wetness index (0–100%).',
  },
  rootZoneMoisturePct: {
    key: 'rootZoneMoisturePct',
    label: 'Root-Zone Moisture',
    shortLabel: 'Root Moisture',
    unit: '%',
    category: 'soil',
    rawCode: 'GWETROOT',
    description: 'Deep soil moisture (0–100 cm) scaled from NASA POWER root-zone wetness index (0–100%).',
  },
  idealSoilPhRange: {
    key: 'idealSoilPhRange',
    label: 'Ideal Soil pH Range',
    shortLabel: 'Soil pH',
    unit: 'pH',
    category: 'soil',
    rawCode: 'PHMIN–PHMAX',
    description: 'FAO EcoCrop target soil acidity/alkalinity window for healthy nutrient uptake.',
  },
  soilTextureType: {
    key: 'soilTextureType',
    label: 'Soil Texture Type',
    shortLabel: 'Texture',
    unit: 'texture',
    category: 'soil',
    rawCode: 'SoilTextureClass',
    description: 'Preferred soil particle composition (e.g., loam, clay loam, sandy loam).',
  },
  soilDrainageClass: {
    key: 'soilDrainageClass',
    label: 'Soil Drainage Class',
    shortLabel: 'Drainage',
    unit: 'class',
    category: 'soil',
    rawCode: 'Drainage',
    description: 'Expected water percolation and aeration requirement in the root zone.',
  },
  soilNutrientDemand: {
    key: 'soilNutrientDemand',
    label: 'Soil Nutrient Demand',
    shortLabel: 'NPK Demand',
    unit: 'tier',
    category: 'soil',
    rawCode: 'NPK Demand',
    description: 'Relative nitrogen, phosphorus, and potassium demand tier for the crop.',
  },

  // Crop
  optimalTempRangeC: {
    key: 'optimalTempRangeC',
    label: 'Optimal Temperature Range',
    shortLabel: 'Opt. Temp',
    unit: '°C',
    category: 'crop',
    rawCode: 'TOPMN–TOPMX',
    description: 'FAO EcoCrop optimal daytime/seasonal temperature band for peak growth.',
  },
  optimalSeasonalRainMm: {
    key: 'optimalSeasonalRainMm',
    label: 'Optimal Seasonal Rain',
    shortLabel: 'Opt. Rain',
    unit: 'mm/yr',
    category: 'crop',
    rawCode: 'ROPMN–ROPMX',
    description: 'FAO EcoCrop optimal annual or seasonal rainfall envelope.',
  },
  daysToHarvestRange: {
    key: 'daysToHarvestRange',
    label: 'Days to Harvest',
    shortLabel: 'Cycle Days',
    unit: 'days',
    category: 'crop',
    rawCode: 'GMIN–GMAX',
    description: 'Typical crop growth cycle duration from planting to harvest maturity.',
  },
  rootDepthCm: {
    key: 'rootDepthCm',
    label: 'Root Depth',
    shortLabel: 'Root Depth',
    unit: 'cm',
    category: 'crop',
    rawCode: 'Root Depth',
    description: 'Effective rooting depth used to match crop water access against soil moisture.',
  },
  plantFamilyGroup: {
    key: 'plantFamilyGroup',
    label: 'Plant Family',
    shortLabel: 'Family',
    unit: 'family',
    category: 'crop',
    rawCode: 'Taxonomy',
    description: 'Botanical family classification used to plan pest-break crop rotations.',
  },
  maxElevationMeters: {
    key: 'maxElevationMeters',
    label: 'Max Elevation',
    shortLabel: 'Max Elev.',
    unit: 'm',
    category: 'crop',
    rawCode: 'ALTMX',
    description: 'Upper elevation limit above sea level in FAO EcoCrop species records.',
  },

  // Score
  fariScore: {
    key: 'fariScore',
    label: 'Active FARI Score',
    shortLabel: 'FARI Score',
    unit: '%',
    category: 'score',
    rawCode: 'FARI',
    description: 'FieldShift Agro-Resilience Index combining water, erosion, nutrients, and market pillars.',
  },
};
