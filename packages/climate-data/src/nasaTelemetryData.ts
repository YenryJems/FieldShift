import { PLACES_BY_ID, PlaceId } from './places';

export interface MonthlyTelemetry {
  month: string;
  monthNumber: number;
  t2m: number;
  precCorr: number;
  gwetRoot: number;
  gwetTop: number;
  relativeHumidityPct: number;
  solarRadiationMjM2Day: number;
  imergPrecipitationMmDay: number;
}

const requireTelemetryValue = (
  placeId: PlaceId,
  month: string,
  field: string,
  value: number | null,
): number => {
  if (value === null) {
    throw new Error(`Missing NASA POWER ${field} telemetry for ${placeId} in ${month}.`);
  }
  return value;
};

const buildMonthlyTelemetry = (placeId: PlaceId): MonthlyTelemetry[] =>
  PLACES_BY_ID[placeId].monthly.map((month) => ({
    month: month.label,
    monthNumber: month.month,
    t2m: requireTelemetryValue(placeId, month.label, 'T2M', month.meanTemperatureC),
    precCorr: requireTelemetryValue(
      placeId,
      month.label,
      'PRECTOTCORR',
      month.meanDailyPrecipitationMm,
    ),
    gwetRoot: requireTelemetryValue(
      placeId,
      month.label,
      'GWETROOT',
      month.meanRootWetnessIndex,
    ),
    gwetTop: requireTelemetryValue(
      placeId,
      month.label,
      'GWETTOP',
      month.meanSurfaceWetnessIndex,
    ),
    relativeHumidityPct: requireTelemetryValue(
      placeId,
      month.label,
      'RH2M',
      month.meanRelativeHumidityPct,
    ),
    solarRadiationMjM2Day: requireTelemetryValue(
      placeId,
      month.label,
      'ALLSKY_SFC_SW_DWN',
      month.meanSolarRadiationMjM2Day,
    ),
    imergPrecipitationMmDay: requireTelemetryValue(
      placeId,
      month.label,
      'IMERG_PRECTOT',
      month.meanImergPrecipitationMmDay,
    ),
  }));

export const NASA_TELEMETRY_BY_PLOT: Record<PlaceId, MonthlyTelemetry[]> = {
  'nueva-ecija': buildMonthlyTelemetry('nueva-ecija'),
  bukidnon: buildMonthlyTelemetry('bukidnon'),
  isabela: buildMonthlyTelemetry('isabela'),
  guimaras: buildMonthlyTelemetry('guimaras'),
  'usa-midwest': buildMonthlyTelemetry('usa-midwest'),
};

export const getMonthlyTelemetry = (
  placeId: PlaceId,
  monthNumber: number,
): MonthlyTelemetry => {
  const telemetry = NASA_TELEMETRY_BY_PLOT[placeId].find(
    (month) => month.monthNumber === monthNumber,
  );
  if (!telemetry) {
    throw new Error(`No NASA POWER telemetry found for ${placeId}, month ${monthNumber}.`);
  }
  return telemetry;
};
