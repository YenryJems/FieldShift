import { describe, expect, it } from 'vitest';
import {
  ECOCROP_CLIMATE_PROFILES,
  getEcoCropReferencesForCrops,
} from './ecocrop';

describe('EcoCrop climate reference integration', () => {
  it('matches strategy crop names to curated species climate envelopes including Adlai', () => {
    const profiles = getEcoCropReferencesForCrops([
      'Carabao Mango',
      'Mungbean (NSIC Mg-19)',
      'Sweet Potato (Camote)',
      'Adlai',
    ]);

    expect(profiles.map((profile) => profile.rawEcoPortCode)).toEqual([1265, 1416, 2150, 745]);
    const adlai = profiles.find((p) => p.rawEcoPortCode === 745);
    expect(adlai?.scientificName).toBe('Coix lacryma-jobi');
  });

  it('provides 14 enriched camelCase profiles without fabricating measurements', () => {
    expect(ECOCROP_CLIMATE_PROFILES).toHaveLength(14);

    const corn = ECOCROP_CLIMATE_PROFILES.find((p) => p.scientificName === 'Zea mays');
    expect(corn?.rootDepthCm).toBe(90);
    expect(corn?.plantFamilyGroup).toBe('Poaceae');

    const camote = ECOCROP_CLIMATE_PROFILES.find((p) => p.scientificName === 'Ipomoea batatas');
    expect(camote?.rootDepthCm).toBe(75);
    expect(camote?.plantFamilyGroup).toBe('Convolvulaceae');

    for (const profile of ECOCROP_CLIMATE_PROFILES) {
      expect(profile.scientificName.length).toBeGreaterThan(0);
      expect(profile.cropAliases.length).toBeGreaterThan(0);
      expect(profile.rootDepthCm).toBeGreaterThan(0);
      expect(profile.plantFamilyGroup.length).toBeGreaterThan(0);
      expect(profile.soilTextureType.length).toBeGreaterThan(0);
      expect(profile.soilDrainageClass.length).toBeGreaterThan(0);
      expect(profile.soilNutrientDemand.length).toBeGreaterThan(0);
      for (const value of [
        profile.optimalTempRangeC.min,
        profile.optimalTempRangeC.max,
        profile.temperatureToleranceC.min,
        profile.temperatureToleranceC.max,
        profile.optimalSeasonalRainMm.min,
        profile.optimalSeasonalRainMm.max,
        profile.idealSoilPhRange.min,
        profile.idealSoilPhRange.max,
      ]) {
        expect(value === null || Number.isFinite(value)).toBe(true);
      }
    }
  });
});
