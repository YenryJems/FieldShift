import { describe, expect, it } from 'vitest';
import { METRIC_LABELS, wetnessIndexToPct } from './metricLabels';

describe('metricLabels & wetnessIndexToPct', () => {
  it('clamps and converts [0, 1] wetness indices to 0–100% integers', () => {
    expect(wetnessIndexToPct(0)).toBe(0);
    expect(wetnessIndexToPct(0.556)).toBe(56);
    expect(wetnessIndexToPct(1)).toBe(100);
    expect(wetnessIndexToPct(-0.25)).toBe(0);
    expect(wetnessIndexToPct(1.4)).toBe(100);
    expect(wetnessIndexToPct(Number.NaN)).toBe(0);
  });

  it('defines plain-English labels and raw parameter codes for all 17 critical metrics', () => {
    const expectedKeys = [
      'airTempCelsius',
      'dailyRainfallMm',
      'relativeHumidityPct',
      'solarRadiationMj',
      'surfaceSoilMoisturePct',
      'rootZoneMoisturePct',
      'idealSoilPhRange',
      'soilTextureType',
      'soilDrainageClass',
      'soilNutrientDemand',
      'optimalTempRangeC',
      'optimalSeasonalRainMm',
      'daysToHarvestRange',
      'rootDepthCm',
      'plantFamilyGroup',
      'maxElevationMeters',
      'fariScore',
    ];

    for (const key of expectedKeys) {
      const def = METRIC_LABELS[key];
      expect(def).toBeDefined();
      expect(def.key).toBe(key);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.rawCode.length).toBeGreaterThan(0);
      expect(def.unit.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(10);
    }
  });
});
