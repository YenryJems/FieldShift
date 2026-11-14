import rawProfiles from './ecocropReference.json';

export interface EcoCropClimateProfile {
  ecoPortCode: number;
  scientificName: string;
  commonNames: string;
  optimumTemperatureMinC: number | null;
  optimumTemperatureMaxC: number | null;
  temperatureToleranceMinC: number | null;
  temperatureToleranceMaxC: number | null;
  optimumRainfallMinMmYr: number | null;
  optimumRainfallMaxMmYr: number | null;
  rainfallToleranceMinMmYr: number | null;
  rainfallToleranceMaxMmYr: number | null;
  soilPhMin: number | null;
  soilPhMax: number | null;
  maxElevationM: number | null;
  cycleDaysMin: number | null;
  cycleDaysMax: number | null;
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
}

const CROP_ALIASES: Record<number, readonly string[]> = {
  481: ['oat', 'oats'],
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
    ecoPortCode: profile.EcoPortCode,
    scientificName: profile.ScientificName,
    commonNames: profile.COMNAME,
    optimumTemperatureMinC: profile.TOPMN,
    optimumTemperatureMaxC: profile.TOPMX,
    temperatureToleranceMinC: profile.TMIN,
    temperatureToleranceMaxC: profile.TMAX,
    optimumRainfallMinMmYr: profile.ROPMN,
    optimumRainfallMaxMmYr: profile.ROPMX,
    rainfallToleranceMinMmYr: profile.RMIN,
    rainfallToleranceMaxMmYr: profile.RMAX,
    soilPhMin: profile.PHMIN,
    soilPhMax: profile.PHMAX,
    maxElevationM: profile.ALTMX,
    cycleDaysMin: profile.GMIN,
    cycleDaysMax: profile.GMAX,
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
