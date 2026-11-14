import { describe, expect, it } from 'vitest';
import {
  ECOCROP_CLIMATE_PROFILES,
  getEcoCropReferencesForCrops,
} from './ecocrop';

describe('EcoCrop climate reference integration', () => {
  it('matches strategy crop names to curated species climate envelopes', () => {
    const profiles = getEcoCropReferencesForCrops([
      'Carabao Mango',
      'Mungbean (NSIC Mg-19)',
      'Sweet Potato (Camote)',
    ]);

    expect(profiles.map((profile) => profile.ecoPortCode)).toEqual([1265, 1416, 2150]);
  });

  it('provides numeric or explicitly missing reference values without fabricating measurements', () => {
    expect(ECOCROP_CLIMATE_PROFILES).toHaveLength(13);
    for (const profile of ECOCROP_CLIMATE_PROFILES) {
      expect(profile.scientificName.length).toBeGreaterThan(0);
      expect(profile.cropAliases.length).toBeGreaterThan(0);
      for (const value of [
        profile.optimumTemperatureMinC,
        profile.optimumTemperatureMaxC,
        profile.temperatureToleranceMinC,
        profile.temperatureToleranceMaxC,
        profile.optimumRainfallMinMmYr,
        profile.optimumRainfallMaxMmYr,
        profile.soilPhMin,
        profile.soilPhMax,
      ]) {
        expect(value === null || Number.isFinite(value)).toBe(true);
      }
    }
  });
});
