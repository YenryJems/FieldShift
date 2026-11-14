import bukidnonData from './POWER_Point_Monthly_20200101_20251231_008d15N_125d12E_UTC.json';
import bukidnonDataUrl from './POWER_Point_Monthly_20200101_20251231_008d15N_125d12E_UTC.json?url';
import nuevaEcijaData from './POWER_Point_Monthly_20200101_20251231_015d68N_120d89E_UTC.json';
import nuevaEcijaDataUrl from './POWER_Point_Monthly_20200101_20251231_015d68N_120d89E_UTC.json?url';
import isabelaData from './POWER_Point_Monthly_20200101_20251231_016d98N_121d81E_UTC.json';
import isabelaDataUrl from './POWER_Point_Monthly_20200101_20251231_016d98N_121d81E_UTC.json?url';

export type PlaceId = 'nueva-ecija' | 'bukidnon' | 'isabela';

type PowerPointData = {
  geometry: { coordinates: number[] };
  properties: {
    parameter: {
      ALLSKY_SFC_SW_DWN: Record<string, number>;
      T2M: Record<string, number>;
      PRECTOTCORR: Record<string, number>;
      GWETROOT: Record<string, number>;
      GWETTOP: Record<string, number>;
      IMERG_PRECTOT: Record<string, number>;
      RH2M: Record<string, number>;
    };
  };
  header: {
    start: string;
    end: string;
    fill_value: number;
    sources: string[];
  };
};

interface MapExtent {
  center: [number, number];
  bbox: [number, number, number, number];
  bounds: [[number, number], [number, number]];
  zoom: number;
}

interface PlaceSource {
  id: PlaceId;
  name: string;
  region: string;
  fileName: string;
  dataUrl: string;
  extent: MapExtent;
  data: PowerPointData;
}

export interface MonthlyClimate {
  month: number;
  label: string;
  meanTemperatureC: number | null;
  meanDailyPrecipitationMm: number | null;
  meanPrecipitationMm: number | null;
  meanRootWetnessIndex: number | null;
  meanSurfaceWetnessIndex: number | null;
  meanRelativeHumidityPct: number | null;
  meanSolarRadiationMjM2Day: number | null;
  meanImergPrecipitationMmDay: number | null;
  temperatureSamples: number;
  precipitationSamples: number;
  rootWetnessSamples: number;
  surfaceWetnessSamples: number;
  relativeHumiditySamples: number;
  solarRadiationSamples: number;
  imergPrecipitationSamples: number;
}

export interface PlaceClimate extends Omit<PlaceSource, 'data'> {
  latitude: number;
  longitude: number;
  elevationM: number;
  years: number[];
  monthly: MonthlyClimate[];
  meanTemperatureC: number | null;
  meanAnnualPrecipitationMm: number | null;
  meanRootWetnessIndex: number | null;
  dataSources: string[];
}

export const PLOT_MAP_EXTENTS: Record<PlaceId, MapExtent> = {
  'nueva-ecija': {
    center: [15.68, 120.89],
    bbox: [120.82, 15.6, 120.96, 15.76],
    bounds: [[15.6, 120.82], [15.76, 120.96]],
    zoom: 12,
  },
  bukidnon: {
    center: [8.15, 125.12],
    bbox: [125.05, 8.08, 125.19, 8.22],
    bounds: [[8.08, 125.05], [8.22, 125.19]],
    zoom: 12,
  },
  isabela: {
    center: [16.975, 121.81],
    bbox: [121.74, 16.9, 121.88, 17.05],
    bounds: [[16.9, 121.74], [17.05, 121.88]],
    zoom: 12,
  },
};

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PLACE_SOURCES: Record<PlaceId, PlaceSource> = {
  'nueva-ecija': {
    id: 'nueva-ecija',
    name: 'Nueva Ecija',
    region: 'Central Luzon, Philippines',
    fileName: 'POWER_Point_Monthly_20200101_20251231_015d68N_120d89E_UTC.json',
    dataUrl: nuevaEcijaDataUrl,
    extent: PLOT_MAP_EXTENTS['nueva-ecija'],
    data: nuevaEcijaData,
  },
  bukidnon: {
    id: 'bukidnon',
    name: 'Bukidnon',
    region: 'Northern Mindanao, Philippines',
    fileName: 'POWER_Point_Monthly_20200101_20251231_008d15N_125d12E_UTC.json',
    dataUrl: bukidnonDataUrl,
    extent: PLOT_MAP_EXTENTS.bukidnon,
    data: bukidnonData,
  },
  isabela: {
    id: 'isabela',
    name: 'Isabela',
    region: 'Cagayan Valley, Philippines',
    fileName: 'POWER_Point_Monthly_20200101_20251231_016d98N_121d81E_UTC.json',
    dataUrl: isabelaDataUrl,
    extent: PLOT_MAP_EXTENTS.isabela,
    data: isabelaData,
  },
};

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;

const getValidValue = (
  values: Record<string, number>,
  key: string,
  fillValue: number,
): number | null => {
  const value = values[key];
  return Number.isFinite(value) && value !== fillValue ? value : null;
};

const buildMonthlyClimate = (source: PlaceSource): { years: number[]; monthly: MonthlyClimate[] } => {
  const { start, end, fill_value: fillValue } = source.data.header;
  const firstYear = Number(start.slice(0, 4));
  const lastYear = Number(end.slice(0, 4));
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  const {
    ALLSKY_SFC_SW_DWN,
    T2M,
    PRECTOTCORR,
    GWETROOT,
    GWETTOP,
    IMERG_PRECTOT,
    RH2M,
  } = source.data.properties.parameter;

  const monthly = MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const temperatures: number[] = [];
    const dailyPrecipitationRates: number[] = [];
    const precipitationTotals: number[] = [];
    const rootWetness: number[] = [];
    const surfaceWetness: number[] = [];
    const relativeHumidity: number[] = [];
    const solarRadiation: number[] = [];
    const imergPrecipitation: number[] = [];

    for (const year of years) {
      const key = `${year}${String(month).padStart(2, '0')}`;
      const temperature = getValidValue(T2M, key, fillValue);
      const dailyPrecipitation = getValidValue(PRECTOTCORR, key, fillValue);
      const wetness = getValidValue(GWETROOT, key, fillValue);
      const topWetness = getValidValue(GWETTOP, key, fillValue);
      const humidity = getValidValue(RH2M, key, fillValue);
      const radiation = getValidValue(ALLSKY_SFC_SW_DWN, key, fillValue);
      const imergRain = getValidValue(IMERG_PRECTOT, key, fillValue);

      if (temperature !== null) temperatures.push(temperature);
      if (dailyPrecipitation !== null) {
        dailyPrecipitationRates.push(dailyPrecipitation);
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        precipitationTotals.push(dailyPrecipitation * daysInMonth);
      }
      if (wetness !== null) rootWetness.push(wetness);
      if (topWetness !== null) surfaceWetness.push(topWetness);
      if (humidity !== null) relativeHumidity.push(humidity);
      if (radiation !== null) solarRadiation.push(radiation);
      if (imergRain !== null) imergPrecipitation.push(imergRain);
    }

    return {
      month,
      label,
      meanTemperatureC: mean(temperatures),
      meanDailyPrecipitationMm: mean(dailyPrecipitationRates),
      meanPrecipitationMm: mean(precipitationTotals),
      meanRootWetnessIndex: mean(rootWetness),
      meanSurfaceWetnessIndex: mean(surfaceWetness),
      meanRelativeHumidityPct: mean(relativeHumidity),
      meanSolarRadiationMjM2Day: mean(solarRadiation),
      meanImergPrecipitationMmDay: mean(imergPrecipitation),
      temperatureSamples: temperatures.length,
      precipitationSamples: precipitationTotals.length,
      rootWetnessSamples: rootWetness.length,
      surfaceWetnessSamples: surfaceWetness.length,
      relativeHumiditySamples: relativeHumidity.length,
      solarRadiationSamples: solarRadiation.length,
      imergPrecipitationSamples: imergPrecipitation.length,
    };
  });

  return { years, monthly };
};

const createPlaceClimate = (source: PlaceSource): PlaceClimate => {
  const { years, monthly } = buildMonthlyClimate(source);
  const coordinates = source.data.geometry.coordinates;
  const precipitationValues = monthly.flatMap((item) =>
    item.meanPrecipitationMm === null ? [] : [item.meanPrecipitationMm],
  );
  const meanAcrossDays = (key: 'meanTemperatureC' | 'meanRootWetnessIndex'): number | null => {
    if (monthly.some((month) => month[key] === null)) return null;

    let weightedTotal = 0;
    let totalDays = 0;

    for (const month of monthly) {
      const value = month[key];
      if (value === null) continue;

      const averageDaysInMonth =
        mean(
          years.map((year) =>
            new Date(Date.UTC(year, month.month, 0)).getUTCDate(),
          ),
        ) ?? 0;
      weightedTotal += value * averageDaysInMonth;
      totalDays += averageDaysInMonth;
    }

    return totalDays ? weightedTotal / totalDays : null;
  };

  return {
    id: source.id,
    name: source.name,
    region: source.region,
    fileName: source.fileName,
    dataUrl: source.dataUrl,
    extent: source.extent,
    latitude: coordinates[1],
    longitude: coordinates[0],
    elevationM: coordinates[2],
    years,
    monthly,
    meanTemperatureC: meanAcrossDays('meanTemperatureC'),
    meanAnnualPrecipitationMm: precipitationValues.length === 12
      ? precipitationValues.reduce((total, value) => total + value, 0)
      : null,
    meanRootWetnessIndex: meanAcrossDays('meanRootWetnessIndex'),
    dataSources: source.data.header.sources,
  };
};

export const PLACES_BY_ID: Record<PlaceId, PlaceClimate> = {
  'nueva-ecija': createPlaceClimate(PLACE_SOURCES['nueva-ecija']),
  bukidnon: createPlaceClimate(PLACE_SOURCES.bukidnon),
  isabela: createPlaceClimate(PLACE_SOURCES.isabela),
};

export const PLACES: PlaceClimate[] = Object.values(PLACES_BY_ID);

export const MONTHLY_SUMMARY_CSV_FILE_NAME = 'fieldshift-nasa-power-monthly-summary-2020-2025.csv';

const csvCell = (value: string | number): string =>
  `"${String(value).replaceAll('"', '""')}"`;

export const buildMonthlySummaryCsv = (places: PlaceClimate[] = PLACES): string => {
  const rows = [
    [
      'place',
      'region',
      'source_json_file',
      'source_products',
      'years_summarized',
      'citation',
      'citation_url',
      'precipitation_calculation',
      'root_wetness_note',
      'latitude',
      'longitude',
      'elevation_m',
      'bbox_min_lon',
      'bbox_min_lat',
      'bbox_max_lon',
      'bbox_max_lat',
      'month',
      'mean_temperature_2m_c',
      'mean_daily_precipitation_corrected_mm_day',
      'mean_monthly_precipitation_mm',
      'mean_imerge_precipitation_mm_day',
      'mean_relative_humidity_2m_pct',
      'mean_allsky_sfc_sw_dwn_mj_m2_day',
      'mean_surface_soil_wetness_index',
      'mean_root_zone_wetness_index',
      'temperature_year_count',
      'precipitation_year_count',
      'root_wetness_year_count',
      'surface_wetness_year_count',
      'relative_humidity_year_count',
      'solar_radiation_year_count',
      'imerge_precipitation_year_count',
    ].map(csvCell).join(','),
  ];
  const citation =
    'NASA Langley Research Center POWER Project. Monthly and Annual API, point data, 2020-2025.';
  const precipitationCalculation =
    'PRECTOTCORR monthly mean daily precipitation (mm/day) times calendar days in each year-month, averaged across valid years';
  const rootWetnessNote =
    'GWETROOT and GWETTOP are unitless wetness indices, not volumetric soil moisture or field sensor measurements';

  for (const place of places) {
    for (const month of place.monthly) {
      rows.push(
        [
          place.name,
          place.region,
          place.fileName,
          place.dataSources.join('|'),
          `${place.years[0]}-${place.years.at(-1)}`,
          citation,
          'https://power.larc.nasa.gov/docs/services/api/temporal/monthly/',
          precipitationCalculation,
          rootWetnessNote,
          place.latitude.toFixed(3),
          place.longitude.toFixed(3),
          place.elevationM.toFixed(1),
          ...place.extent.bbox.map((coordinate) => coordinate.toFixed(3)),
          month.label,
          month.meanTemperatureC?.toFixed(2) ?? '',
          month.meanDailyPrecipitationMm?.toFixed(2) ?? '',
          month.meanPrecipitationMm?.toFixed(2) ?? '',
          month.meanImergPrecipitationMmDay?.toFixed(2) ?? '',
          month.meanRelativeHumidityPct?.toFixed(2) ?? '',
          month.meanSolarRadiationMjM2Day?.toFixed(2) ?? '',
          month.meanSurfaceWetnessIndex?.toFixed(3) ?? '',
          month.meanRootWetnessIndex?.toFixed(3) ?? '',
          month.temperatureSamples,
          month.precipitationSamples,
          month.rootWetnessSamples,
          month.surfaceWetnessSamples,
          month.relativeHumiditySamples,
          month.solarRadiationSamples,
          month.imergPrecipitationSamples,
        ].map(csvCell).join(','),
      );
    }
  }

  return `${rows.join('\r\n')}\r\n`;
};
