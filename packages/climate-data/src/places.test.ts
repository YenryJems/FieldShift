import { describe, expect, it } from 'vitest';
import {
  buildMonthlySummaryCsv,
  PLACES,
  PLACES_BY_ID,
  PLOT_MAP_EXTENTS,
} from './places';
import { getMonthlyTelemetry, NASA_TELEMETRY_BY_PLOT } from './nasaTelemetryData';
import plotLocations from './plotLocations.json';

describe('NASA POWER historical monthly summaries', () => {
  it('uses the supplied place center and bounding box for Nueva Ecija', () => {
    const place = PLACES_BY_ID['nueva-ecija'];

    expect(place.latitude).toBe(15.68);
    expect(place.longitude).toBe(120.89);
    expect(place.extent.center).toEqual([place.latitude, place.longitude]);
    expect(place.extent).toEqual(PLOT_MAP_EXTENTS['nueva-ecija']);
    expect(place.monthly).toHaveLength(12);
    expect(place.monthly.every((month) => month.temperatureSamples === 6)).toBe(true);
  });

  it('aligns every source point with its configured extent and excludes annual summary rows', () => {
    for (const place of PLACES) {
      expect(place.extent.center).toEqual([place.latitude, place.longitude]);
      const [minLongitude, minLatitude, maxLongitude, maxLatitude] = place.extent.bbox;
      expect(place.extent.bounds).toEqual([
        [minLatitude, minLongitude],
        [maxLatitude, maxLongitude],
      ]);
      expect(place.monthly).toHaveLength(12);
      expect(place.monthly.every((month) => month.temperatureSamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.precipitationSamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.rootWetnessSamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.surfaceWetnessSamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.relativeHumiditySamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.solarRadiationSamples === 6)).toBe(true);
      expect(place.monthly.every((month) => month.imergPrecipitationSamples === 6)).toBe(true);
    }
  });

  it('aligns map plot metadata and monthly map telemetry with the NASA POWER summaries', () => {
    for (const plot of plotLocations.plots) {
      const place = PLACES.find((item) => item.id === plot.id);
      expect(place).toBeDefined();
      if (!place) throw new Error(`Missing climate data for plot "${plot.id}".`);
      expect(place?.latitude).toBe(plot.center.lat);
      expect(place?.longitude).toBe(plot.center.lon);
      expect(place?.extent.bounds).toEqual(plot.bounds);
      expect(NASA_TELEMETRY_BY_PLOT[place.id]).toHaveLength(12);
    }

    const january = getMonthlyTelemetry('nueva-ecija', 1);
    expect(january.month).toBe('January');
    expect(january.airTempCelsius).toBeCloseTo(PLACES_BY_ID['nueva-ecija'].monthly[0].meanTemperatureC ?? 0);
    expect(january.dailyRainfallMm).toBeCloseTo((0.59 + 3.16 + 2.47 + 2.53 + 0.57 + 1.02) / 6);
    expect(january.rootZoneMoisturePct).toBe(
      Math.round((PLACES_BY_ID['nueva-ecija'].monthly[0].meanRootWetnessIndex ?? 0) * 100),
    );
    expect(january.relativeHumidityPct).toBeCloseTo(
      PLACES_BY_ID['nueva-ecija'].monthly[0].meanRelativeHumidityPct ?? 0,
    );
    expect(january.solarRadiationMj).toBeCloseTo(
      PLACES_BY_ID['nueva-ecija'].monthly[0].meanSolarRadiationMjM2Day ?? 0,
    );
    expect(january.surfaceSoilMoisturePct).toBe(
      Math.round((PLACES_BY_ID['nueva-ecija'].monthly[0].meanSurfaceWetnessIndex ?? 0) * 100),
    );
    expect(january.imergRainfallMmDay).toBeCloseTo(
      PLACES_BY_ID['nueva-ecija'].monthly[0].meanImergPrecipitationMmDay ?? 0,
    );
  });

  it('averages monthly values across six years and converts daily rain to monthly totals', () => {
    const january = PLACES_BY_ID['nueva-ecija'].monthly[0];
    const february = PLACES_BY_ID['nueva-ecija'].monthly[1];
    const expectedJanuaryRain = ((0.59 + 3.16 + 2.47 + 2.53 + 0.57 + 1.02) / 6) * 31;
    const expectedFebruaryRain =
      (1.61 * 29 + 1.48 * 28 + 1.07 * 28 + 1.06 * 28 + 0.23 * 29 + 1.92 * 28) / 6;

    expect(january.meanTemperatureC).toBeCloseTo(
      (25.09 + 24.01 + 24.72 + 24.21 + 25.48 + 25.05) / 6,
      5,
    );
    expect(january.meanPrecipitationMm).toBeCloseTo(expectedJanuaryRain, 5);
    expect(january.meanDailyPrecipitationMm).toBeCloseTo(
      (0.59 + 3.16 + 2.47 + 2.53 + 0.57 + 1.02) / 6,
      5,
    );
    expect(january.meanRelativeHumidityPct).not.toBeNull();
    expect(january.meanSolarRadiationMjM2Day).not.toBeNull();
    expect(january.meanSurfaceWetnessIndex).not.toBeNull();
    expect(january.meanImergPrecipitationMmDay).not.toBeNull();
    expect(february.meanPrecipitationMm).toBeCloseTo(expectedFebruaryRain, 5);
    expect(january.temperatureSamples).toBe(6);
    expect(january.precipitationSamples).toBe(6);
    expect(january.rootWetnessSamples).toBe(6);
  });

  it('exports all locations with units, derivation notes, and citation', () => {
    const csv = buildMonthlySummaryCsv();
    const dataRows = csv.split('\r\n').filter(Boolean);

    expect(dataRows).toHaveLength(1 + PLACES.length * 12);
    expect(dataRows[0]).toContain('"citation_url"');
    expect(csv).not.toContain('\r\n#');
    expect(csv).toContain('NASA Langley Research Center POWER Project');
    expect(csv).toContain('mean_monthly_precipitation_mm');
    expect(csv).toContain('mean_relative_humidity_2m_pct');
    expect(csv).toContain('mean_allsky_sfc_sw_dwn_mj_m2_day');
    expect(csv).toContain('mean_imerge_precipitation_mm_day');
    expect(csv).toContain('source_json_file');
    expect(csv).toContain('NASA Langley Research Center POWER Project');
    expect(csv).toContain('Nueva Ecija');
    expect(csv).toContain('Bukidnon');
    expect(csv).toContain('Isabela');
    expect(csv).toContain('2020-2025');
  });
});
