import rawProfiles from './ecocropReference.json';

export interface EcoCropClimateProfile {
  rawEcoPortCode: number;
  scientificName: string;
  commonNames: string;
  optimalTempRangeC: { min: number | null; max: number | null };
  temperatureToleranceC: { min: number | null; max: number | null };
  optimalSeasonalRainMm: { min: number | null; max: number | null };
  rainfallToleranceMm: { min: number | null; max: number | null };
  idealSoilPhRange: { min: number | null; max: number | null };
  daysToHarvestRange: { min: number | null; max: number | null };
  rootDepthCm: number;
  plantFamilyGroup: string;
  maxElevationMeters: number | null;
  soilTextureType: string;
  soilDrainageClass: string;
  soilNutrientDemand: string;
  cropAliases: readonly string[];
}

interface RawEcoCropProfile {
  EcoPortCode: number;
  ScientificName: string;
  COMNAME: string;
  TOPMN: number | null;
  TOPMX: number | null;
  TMIN: number | null;
  TMAX: number | null;
  ROPMN: number | null;
  ROPMX: number | null;
  RMIN: number | null;
  RMAX: number | null;
  PHMIN: number | null;
  PHMAX: number | null;
  ALTMX: number | null;
  GMIN: number | null;
  GMAX: number | null;
  rootDepthCm: number;
  plantFamilyGroup: string;
  soilTextureType: string;
  soilDrainageClass: string;
  soilNutrientDemand: string;
}

const CROP_ALIASES: Record<number, readonly string[]> = {
  481: ['oat', 'oats'],
  745: ['adlai', "job's tears", 'adlay'],
  1150: ['soy', 'soybean'],
  1265: ['sweet potato', 'camote'],
  1416: ['mango'],
  1574: ['rice', 'palay'],
  1929: ['rye'],
  1982: ['sorghum'],
  2114: ['wheat'],
  2150: ['mungbean', 'mung bean', 'munggo', 'green gram'],
  2175: ['corn', 'maize'],
  2199: ['peanut', 'groundnut', 'mani'],
  10534: ['crimson clover'],
  238009: ['hairy vetch', 'vetch'],
};

const sourceProfiles = rawProfiles as RawEcoCropProfile[];

export const ECOCROP_CLIMATE_PROFILES: EcoCropClimateProfile[] = sourceProfiles.map(
  (profile) => ({
    rawEcoPortCode: profile.EcoPortCode,
    scientificName: profile.ScientificName,
    commonNames: profile.COMNAME,
    optimalTempRangeC: { min: profile.TOPMN, max: profile.TOPMX },
    temperatureToleranceC: { min: profile.TMIN, max: profile.TMAX },
    optimalSeasonalRainMm: { min: profile.ROPMN, max: profile.ROPMX },
    rainfallToleranceMm: { min: profile.RMIN, max: profile.RMAX },
    idealSoilPhRange: { min: profile.PHMIN, max: profile.PHMAX },
    daysToHarvestRange: { min: profile.GMIN, max: profile.GMAX },
    rootDepthCm: profile.rootDepthCm,
    plantFamilyGroup: profile.plantFamilyGroup,
    maxElevationMeters: profile.ALTMX,
    soilTextureType: profile.soilTextureType,
    soilDrainageClass: profile.soilDrainageClass,
    soilNutrientDemand: profile.soilNutrientDemand,
    cropAliases: CROP_ALIASES[profile.EcoPortCode] ?? [],
  }),
);

/** Match strategy crop names to species-level EcoCrop reference records. */
export const getEcoCropReferencesForCrops = (
  cropNames: readonly string[],
): EcoCropClimateProfile[] => {
  const normalizedCrops = cropNames.map((crop) => crop.toLocaleLowerCase());
  return ECOCROP_CLIMATE_PROFILES.filter((profile) =>
    profile.cropAliases.some((alias) =>
      normalizedCrops.some((crop) => crop.includes(alias)),
    ),
  );
};
