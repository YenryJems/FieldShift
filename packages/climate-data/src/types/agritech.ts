import type { PlaceId } from '../places';

export type FarmId = PlaceId;
export type StrategyId = 'S1' | 'S2' | 'S3';
export type StressScenarioId = 'baseline' | 'drought' | 'heatwave' | 'deluge';

export type DataStatus =
  | 'observed'
  | 'satellite'
  | 'derived'
  | 'static-baseline'
  | 'modeled'
  | 'illustrative';

/** NASA POWER climate indicators used by FieldShift. Wetness values are
 * unitless model indices; they are not volumetric soil-moisture measurements. */
export interface NasaTelemetryIndicators {
  /** Surface soil wetness index for the top 0–5 cm; unitless, typically 0–1. */
  GWETTOP: number;
  /** Root-zone soil wetness index for the top 0–100 cm; unitless, typically 0–1. */
  GWETROOT: number;
  /** Mean air temperature at 2 m; °C in FieldShift's normalized telemetry. */
  T2M: number;
  /** Corrected daily precipitation; mm/day in FieldShift's normalized telemetry. */
  PRECTOTCORR: number;
  /** All-sky surface shortwave radiation; MJ/m²/day in normalized telemetry. */
  ALLSKY_SFC_SW_DWN: number;
  /** Relative humidity at 2 m; percent. */
  RH2M: number;
}

export interface DatasetMetadata {
  id: string;
  source: string;
  datasetName: string;
  variable: string;
  units: string;
  spatialResolution?: string;
  temporalResolution: string;
  dateRange: {
    start: string;
    end: string;
  };
  retrievalDate?: string;
  status: DataStatus;
  citationUrl: string;
  limitations: string[];
}

export interface PriorityWeights {
  water: number;
  erosion: number;
  nutrients: number;
  market: number;
}

export interface FieldConstraints {
  rainfedOnly: boolean;
  manualToolsOnly: boolean;
  fastCashNeeded: boolean;
}

export interface StressSensitivity {
  drought: number;
  heat: number;
  deluge: number;
}

export interface StrategyExplanations {
  whySuggested: string;
  supportingEvidence: string;
  expectedBenefits: string;
  dataGaps: string;
  localReviewAlerts: string;
}

export type CropStageType =
  | 'main-crop'
  | 'legume-relay'
  | 'resilient-relay'
  | 'cover-mulch'
  | 'harvest-transition'
  | 'bare-fallow';

export interface MonthlyCropStage {
  month: number;
  monthLabel: string;
  stage: CropStageType;
  cropLabel: string;
  pestBreakActive: boolean;
  groundCoverPct: number;
}

export interface CultivarOption {
  name: string;
  crop: string;
  type: 'commercial' | 'open-pollinated';
  maturityDays: number;
  traitHighlight: string;
  seedSourceNote: string;
}

export interface CropStrategy {
  id: StrategyId;
  farmId: FarmId;
  name: string;
  shortLabel: string;
  isBaseline: boolean;
  crops: string[];
  cultivars: CultivarOption[];
  rootDepthCm: number;
  nFixKgHa: number;
  canopyClosureDays: number;
  residueMulch: number;
  contourFactor: number;
  cashTurnaroundDays: number;
  forageValue: number;
  waterDemand: number;
  priceIndex: number;
  stressSensitivity: StressSensitivity;
  explanations: StrategyExplanations;
  monthlySchedule: MonthlyCropStage[];
  forageSummary: string;
}

export interface SoilNutrientProfile {
  nitrogenKgHa: number;
  phosphorusPpm: number;
  potassiumPpm: number;
  ph: number;
  organicMatterPct: number;
}

export interface FarmProfile {
  id: FarmId;
  name: string;
  locationLabel: string;
  region: string;
  country: 'Philippines' | 'United States';
  latitude: number;
  longitude: number;
  elevationM: number;
  slopePct: number;
  soilType: string;
  baselineFarmingSystem: string;
  primaryConcerns: string[];
  marketAccess: number;
  isBenchmarkPlot: boolean;
  benchmarkNote?: string;
  referencedDatasets: string[];
  soilBaseline: SoilNutrientProfile;
  targetIdealProfile: SoilNutrientProfile;
  strategies: [CropStrategy, CropStrategy, CropStrategy];
}

export interface FariPillarScores {
  water: number;
  erosion: number;
  nutrients: number;
  market: number;
}

/** Normalized FARI pillar scores, each constrained to [0, 1]. */
export interface FariScore {
  W: number;
  E: number;
  N: number;
  M: number;
}

export interface FariScoreBreakdown {
  strategyId: StrategyId;
  strategyName: string;
  isBaseline: boolean;
  fariScore: number;
  pillars: FariPillarScores;
  normalizedWeights: PriorityWeights;
  rank: number;
  deltaVsBaseline: number;
  diagnostics: {
    idealRootCm: number;
    rootMatch: number;
    droughtAnomaly: number;
    droughtPenalty: number;
    waterlogPenalty: number;
    heatExposure: number;
    heatPenalty: number;
    erosionRisk: number;
    cashScore: number;
  };
}

export interface AdjustedClimateContext {
  scenarioId: StressScenarioId;
  scenarioLabel: string;
  scenarioDescription: string;
  month: number;
  monthLabel: string;
  baselineTempC: number;
  adjustedTempC: number;
  baselineMaxTempC: number;
  adjustedMaxTempC: number;
  baselineMinTempC: number;
  baselineDailyPrecipMm: number;
  adjustedDailyPrecipMm: number;
  baselineRainBurstMm: number;
  adjustedRainBurstMm: number;
  baselineGwetTop: number;
  adjustedGwetTop: number;
  baselineGwetRoot: number;
  adjustedGwetRoot: number;
  solarRadiationMjM2Day: number;
  relativeHumidityPct: number;
  evapMmDay: number;
  stormDaysGe14Mm: number;
  dryDaysLt3Mm: number;
  heatStressDaysGe33C: number;
  coldDaysLe2C: number;
  droughtDelta: number;
}

export interface NutrientGapItem {
  nutrient: 'Nitrogen (kg N/ha eq.)' | 'Phosphorus (ppm)' | 'Potassium (ppm)' | 'Organic Matter (%)' | 'Soil pH (target delta)';
  unit: string;
  soilBaseline: number;
  coverCropContribution: number;
  targetIdeal: number;
  adjustmentGap: number;
  advisoryNote: string;
}

export interface TerroirAssessment {
  farmId: FarmId;
  strategyId: StrategyId;
  month: number;
  nutrientGaps: NutrientGapItem[];
  mangoSugarLoadingIndex: number;
  targetBrixRange: string;
  estimatedUreaReductionPct: number;
  solarIndex: number;
  drySpellIndex: number;
  drainageIndex: number;
  dataStatus: DataStatus;
}

export interface MonthlyZScoreAnomaly {
  variable: 'T2M' | 'PRECTOTCORR' | 'GWETROOT' | 'GWETTOP' | 'ALLSKY_SFC_SW_DWN';
  label: string;
  unit: string;
  currentValue: number;
  mean2001_2025: number;
  std2001_2025: number;
  zScore: number;
  anomalyClass: 'normal' | 'moderate-low' | 'extreme-low' | 'moderate-high' | 'extreme-high';
  plainInterpretation: string;
}

export interface SiComparisonResult {
  farmId: FarmId;
  month: number;
  monthLabel: string;
  approachA: {
    name: string;
    baselinePeriod: string;
    sampleYears: number;
    anomalies: MonthlyZScoreAnomaly[];
    bareFieldRiskDetected: boolean;
    droughtOnsetDetected: boolean;
    thermalStressDetected: boolean;
  };
  approachB: {
    label: 'Rule-based suitability ensemble (RF-style)';
    suitabilityScore: number;
    orbitalConfidencePct: number;
    groundTruthRequiredPct: number;
    confidenceBanner: string;
    ruleBreakdown: {
      moistureStabilityScore: number;
      erosionControlScore: number;
      thermalWindowScore: number;
      nutrientRegenScore: number;
    };
  };
}

export type CfiWindowRiskLevel = 'green' | 'amber' | 'red';

export interface CfiMonthWindow {
  month: number;
  monthLabel: string;
  riskLevel: CfiWindowRiskLevel;
  badgeText: string;
  stormDaysGe14Mm: number;
  heatStressDaysGe33C: number;
  coldDaysLe2C: number;
  dryDaysLt3Mm: number;
  t2mMaxC: number;
  t2mMinC: number;
  gwetRoot: number;
  farmerActionAdvisory: string;
}

/** Three-month / 90-day spray-risk calendar; each monthly window is color-coded. */
export interface CfiRiskCalendar90Day {
  farmId: FarmId;
  startMonth: number;
  windows: [CfiMonthWindow, CfiMonthWindow, CfiMonthWindow];
  dataStatus: DataStatus;
}

export interface OrbitalSoilCertificationTier {
  tier: 'orbital';
  score: number;
  weightPct: 80;
  dataStatus: DataStatus;
  limitations: string[];
}

export interface GroundTruthSoilCertificationTier {
  tier: 'ground-truth';
  score: number | null;
  weightPct: 20;
  verified: boolean;
  inputs: GroundTruthFieldInput;
}

export interface GroundTruthFieldInput {
  measuredPh: number | null;
  measuredNitrogenKgHa: number | null;
  measuredPhosphorusPpm: number | null;
  measuredPotassiumPpm: number | null;
  measuredOrganicMatterPct: number | null;
  soilTextureClass: SoilTextureClass | null;
  soilTextureVerified: boolean;
}

export type SoilTextureClass =
  | 'sand'
  | 'loamy-sand'
  | 'sandy-loam'
  | 'loam'
  | 'silt-loam'
  | 'clay-loam'
  | 'clay';

export interface SoilCertificateEvaluation {
  farmId: FarmId;
  strategyId: StrategyId;
  tier1OrbitalScore: number;
  tier1WeightPct: 80;
  tier2GroundTruthScore: number;
  tier2WeightPct: 20;
  combinedCertificateScore: number;
  groundTruthVerified: boolean;
  badgeStatus: 'Preliminary Orbital Tier (80% Max)' | 'Verified Soil Health & Terroir Badge (Orbital + Ground-Truth)';
}
