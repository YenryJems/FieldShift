// Builds compact, committed NASA telemetry summaries from the raw NASA POWER
// monthly (2001-2025) and daily (2020-2025) downloads for all 5 FieldShift farms.
// Usage: node packages/climate-data/scripts/build-nasa-summaries.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FARMS } from './farms.config.mjs';

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(PACKAGE_DIR, 'raw', 'nasa-power');
const OUT_FILE = path.join(PACKAGE_DIR, 'src', 'nasaExtendedTelemetry.json');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const round = (val, digits = 3) =>
  val === null || Number.isNaN(val) ? null : Number(val.toFixed(digits));

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

const stdDev = (arr) => {
  if (arr.length < 2) return null;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
};

const percentile = (arr, p) => {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

const validVal = (rec, key, fill = -999) => {
  const v = rec?.[key];
  return typeof v === 'number' && Number.isFinite(v) && v !== fill ? v : null;
};

const output = {
  generatedAt: new Date().toISOString(),
  source: 'NASA Langley Research Center POWER Project (MERRA-2, CERES SYN1deg, GPM IMERG)',
  citationUrl: 'https://power.larc.nasa.gov/',
  periodMonthlyBaseline: '2001-2025',
  periodRecentWindow: '2020-2025',
  farms: {},
};

for (const farm of FARMS) {
  const monthlyRaw = JSON.parse(
    await readFile(path.join(RAW_DIR, 'monthly-2001-2025', `${farm.id}.json`), 'utf8'),
  );
  const dailyRaw = JSON.parse(
    await readFile(path.join(RAW_DIR, 'daily-2020-2025', `${farm.id}.json`), 'utf8'),
  );

  const fillM = monthlyRaw.header?.fill_value ?? -999;
  const fillD = dailyRaw.header?.fill_value ?? -999;
  const mParams = monthlyRaw.properties.parameter;
  const dParams = dailyRaw.properties.parameter;
  const [lon, lat, elev] = monthlyRaw.geometry.coordinates;

  const monthlySummaries = [];

  for (let m = 1; m <= 12; m += 1) {
    const mm = String(m).padStart(2, '0');

    // 2020-2025 monthly values
    const recentYears = [2020, 2021, 2022, 2023, 2024, 2025];
    const allYears = Array.from({ length: 25 }, (_, i) => 2001 + i);

    const collectMonthly = (param, years) =>
      years
        .map((yr) => validVal(mParams[param], `${yr}${mm}`, fillM))
        .filter((v) => v !== null);

    // Daily values in 2020-2025 for calendar month m
    const dailyKeys = Object.keys(dParams.T2M).filter((k) => k.slice(4, 6) === mm);
    const dailyPrec = dailyKeys
      .map((k) => validVal(dParams.PRECTOTCORR, k, fillD))
      .filter((v) => v !== null);
    const dailyImerg = dailyKeys
      .map((k) => validVal(dParams.IMERG_PRECTOT, k, fillD))
      .filter((v) => v !== null);
    const dailyTmax = dailyKeys
      .map((k) => validVal(dParams.T2M_MAX, k, fillD))
      .filter((v) => v !== null);
    const dailyTmin = dailyKeys
      .map((k) => validVal(dParams.T2M_MIN, k, fillD))
      .filter((v) => v !== null);

    const yearsCount = 6;
    const stormDaysPerMonth = dailyPrec.filter((v) => v >= 14).length / yearsCount;
    const dryDaysPerMonth = dailyPrec.filter((v) => v < 3).length / yearsCount;
    const heatDaysPerMonth = dailyTmax.filter((v) => v >= 33).length / yearsCount;
    const frostDaysPerMonth = dailyTmin.filter((v) => v <= 2).length / yearsCount;

    const t2m25 = collectMonthly('T2M', allYears);
    const prec25 = collectMonthly('PRECTOTCORR', allYears);
    const gwetRoot25 = collectMonthly('GWETROOT', allYears);
    const gwetTop25 = collectMonthly('GWETTOP', allYears);
    const sw25 = collectMonthly('ALLSKY_SFC_SW_DWN', allYears);

    const evptrnsRecent = mean(collectMonthly('EVPTRNS', recentYears));

    monthlySummaries.push({
      month: m,
      label: MONTHS[m - 1],
      // 2020-2025 extended monthly means
      t2mMaxC: round(mean(collectMonthly('T2M_MAX', recentYears)), 2),
      t2mMinC: round(mean(collectMonthly('T2M_MIN', recentYears)), 2),
      t2mDewC: round(mean(collectMonthly('T2MDEW', recentYears)), 2),
      ws2mMs: round(mean(collectMonthly('WS2M', recentYears)), 2),
      gwetProfIndex: round(mean(collectMonthly('GWETPROF', recentYears)), 3),
      evptrnsMjM2Day: round(evptrnsRecent, 2),
      evapMmDay: round(evptrnsRecent !== null ? evptrnsRecent / 2.45 : null, 2),
      frostDaysMonthly: round(mean(collectMonthly('FROST_DAYS', recentYears)), 2),
      clrskySwMjM2Day: round(mean(collectMonthly('CLRSKY_SFC_SW_DWN', recentYears)), 2),
      // 2020-2025 daily empirical event metrics (6-year mean per month)
      p95DailyPrecipMm: round(percentile(dailyPrec, 0.95), 2),
      maxDailyPrecipMm: round(dailyPrec.length ? Math.max(...dailyPrec) : null, 2),
      meanStormDaysGe14Mm: round(stormDaysPerMonth, 2),
      meanDryDaysLt3Mm: round(dryDaysPerMonth, 2),
      meanHeatStressDaysGe33C: round(heatDaysPerMonth, 2),
      meanColdDaysLe2C: round(frostDaysPerMonth, 2),
      dailySampleCount: dailyPrec.length,
      dailyImergSampleCount: dailyImerg.length,
      // 2001-2025 25-year reference baseline (mean & stdDev for z-score anomaly decomposition)
      baseline2001_2025: {
        t2mMeanC: round(mean(t2m25), 2),
        t2mStdC: round(stdDev(t2m25), 3),
        precMeanMmDay: round(mean(prec25), 2),
        precStdMmDay: round(stdDev(prec25), 3),
        gwetRootMean: round(mean(gwetRoot25), 3),
        gwetRootStd: round(stdDev(gwetRoot25), 3),
        gwetTopMean: round(mean(gwetTop25), 3),
        gwetTopStd: round(stdDev(gwetTop25), 3),
        solarMeanMjM2Day: round(mean(sw25), 2),
        solarStdMjM2Day: round(stdDev(sw25), 3),
        yearsSampled: t2m25.length,
      },
    });
  }

  output.farms[farm.id] = {
    id: farm.id,
    name: farm.name,
    latitude: lat,
    longitude: lon,
    powerElevationM: elev,
    sources: monthlyRaw.header.sources,
    monthly: monthlySummaries,
  };
}

await writeFile(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(PACKAGE_DIR, OUT_FILE)}`);
for (const [id, f] of Object.entries(output.farms)) {
  const jan = f.monthly[0];
  const apr = f.monthly[3];
  const jul = f.monthly[6];
  console.log(
    `${id} (elev ${f.powerElevationM}m): Jan Tmax=${jan.t2mMaxC}C Tmin=${jan.t2mMinC}C dryDays=${jan.meanDryDaysLt3Mm} | Apr Tmax=${apr.t2mMaxC}C heatDays>=33C=${apr.meanHeatStressDaysGe33C} | Jul p95Rain=${jul.p95DailyPrecipMm}mm stormDays>=14mm=${jul.meanStormDaysGe14Mm}`,
  );
}
