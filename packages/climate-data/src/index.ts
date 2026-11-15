export {
  buildMonthlySummaryCsv,
  MONTHLY_SUMMARY_CSV_FILE_NAME,
  PLACES,
  PLACES_BY_ID,
  PLOT_MAP_EXTENTS,
} from './places';
export type { MonthlyClimate, PlaceClimate, PlaceId } from './places';

export { getMonthlyTelemetry, NASA_TELEMETRY_BY_PLOT } from './nasaTelemetryData';
export type { MonthlyTelemetry } from './nasaTelemetryData';

export { default as plotLocations } from './plotLocations.json';
export { default as nasaExtendedTelemetry } from './nasaExtendedTelemetry.json';

export { FARMS, FARMS_BY_ID, getFarmById } from './farms';
export { ECOCROP_CLIMATE_PROFILES, getEcoCropReferencesForCrops } from './ecocrop';
export type { EcoCropClimateProfile } from './ecocrop';

export type {
  AdjustedClimateContext,
  CfiMonthWindow,
  CfiRiskCalendar90Day,
  CfiWindowRiskLevel,
  CropStageType,
  CropStrategy,
  CultivarOption,
  DatasetMetadata,
  DataStatus,
  FarmId,
  FarmProfile,
  FariScore,
  FariPillarScores,
  FariScoreBreakdown,
  FieldConstraints,
  GroundTruthFieldInput,
  MonthlyCropStage,
  MonthlyZScoreAnomaly,
  NutrientGapItem,
  NasaTelemetryIndicators,
  OrbitalSoilCertificationTier,
  GroundTruthSoilCertificationTier,
  PriorityWeights,
  SiComparisonResult,
  SoilCertificateEvaluation,
  SoilNutrientProfile,
  SoilTextureClass,
  StrategyExplanations,
  StrategyId,
  StressScenarioId,
  StressSensitivity,
  TerroirAssessment,
} from './types/agritech';

export {
  clamp,
  DEFAULT_PRIORITY_WEIGHTS,
  interpolateCashScore,
  normalizeWeights,
  roundTo,
} from './engine/normalization';

export {
  applyClimateStress,
  getExtendedMonthlyRecord,
  STRESS_PRESETS,
} from './engine/stress';
export type { StressPresetDefinition } from './engine/stress';

export {
  calculateErosionPillar,
  calculateFariScore,
  calculateMarketPillar,
  calculateNutrientPillar,
  calculateWaterPillar,
  DEFAULT_FIELD_CONSTRAINTS,
  rankFarmStrategies,
} from './engine/fari';
export type {
  ErosionPillarResult,
  FarmFariEvaluation,
  MarketPillarResult,
  WaterPillarResult,
} from './engine/fari';

export {
  calculateMangoSugarLoadingIndex,
  calculateTerroirAssessment,
  calculateUreaReductionPct,
} from './engine/terroir';

export { METRIC_LABELS, wetnessIndexToPct } from './metricLabels';
export type { MetricCategory, MetricDefinition } from './metricLabels';

export {
  calculateCfiSprayCalendar,
  calculateSiComparison,
  evaluateTwoTierSoilCertificate,
} from './engine/siComparison';

export {
  applyDashboardShocks,
  applyLocalSeedFallback,
  APPLICATION_WINDOW_THRESHOLDS,
  classifyApplicationWindow,
  computeGainPct,
  DASHBOARD_SHOCK_FACTORS,
  DEFAULT_PLOT_SHOCKS,
  deriveMarketOptimizerStrategy,
  evaluatePlotStrategies,
  LOCAL_OPV_FALLBACKS,
  PLOT_STRATEGY_KEY_ORDER,
  PLOT_STRATEGY_TITLES,
  rankPlotResults,
} from './engine/plotStrategies';
export type {
  ApplicationWindow,
  ApplicationWindowLevel,
  PlotStrategyEvaluation,
  PlotStrategyEvaluationInput,
  PlotStrategyKey,
  PlotStrategyResult,
  PlotStrategyShocks,
} from './engine/plotStrategies';
