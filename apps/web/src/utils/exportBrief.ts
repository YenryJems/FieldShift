import type {
  AdjustedClimateContext,
  CfiMonthWindow,
  CropStrategy,
  FarmProfile,
  FariScoreBreakdown,
} from '@fieldshift/climate-data';

export const formatSmsFieldBrief = (params: {
  farm: FarmProfile;
  climate: AdjustedClimateContext;
  topScore: FariScoreBreakdown;
  topStrategy: CropStrategy;
  cfiWindow: CfiMonthWindow;
  droughtAlert?: string;
}): string => {
  const { farm, climate, topScore, topStrategy, cfiWindow, droughtAlert } = params;
  const lines = [
    `[FIELDSHIFT MAO / EXTENSION BRIEF]`,
    `Farm: ${farm.name} (${farm.locationLabel}, ${farm.latitude.toFixed(3)}N, ${farm.longitude.toFixed(3)}E, ${farm.elevationM}m, ${farm.slopePct}% slope)`,
    `Soil: ${farm.soilType} | Month: ${climate.monthLabel} | Scenario: ${climate.scenarioLabel}`,
    `NASA POWER Signals: T2M ${climate.adjustedTempC.toFixed(1)}C (Tmax ${climate.adjustedMaxTempC.toFixed(1)}C) | Rain ${climate.adjustedDailyPrecipMm.toFixed(2)} mm/day | GWETROOT ${climate.adjustedGwetRoot.toFixed(2)}`,
    `Top Ranked Strategy: ${topStrategy.shortLabel} — FARI ${topScore.fariScore.toFixed(1)}/100 (W:${Math.round(topScore.pillars.water * 100)} E:${Math.round(topScore.pillars.erosion * 100)} N:${Math.round(topScore.pillars.nutrients * 100)} M:${Math.round(topScore.pillars.market * 100)})`,
    `Crops: ${topStrategy.crops.join(' + ')} | Est. N-Fix: +${topStrategy.nFixKgHa} kg N/ha (Projected estimate)`,
    `90-Day Spray Validator (${cfiWindow.monthLabel}): ${cfiWindow.badgeText} — ${cfiWindow.farmerActionAdvisory}`,
    ...(droughtAlert ? [`Alert: ${droughtAlert}`] : []),
    `MAO Action: ${topStrategy.explanations.localReviewAlerts}`,
    `Note: Educational decision support prototype; verify with local soil lab & extension office.`,
  ];
  return lines.join('\n');
};
