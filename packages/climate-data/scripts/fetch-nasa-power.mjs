// Downloads NASA POWER (https://power.larc.nasa.gov/) point data for all five
// FieldShift farms. No API key is required. Usage (from repo root):
//   node packages/climate-data/scripts/fetch-nasa-power.mjs
//
// Outputs (raw, unmodified API responses):
//   raw/nasa-power/monthly-2001-2025/<farm>.json   16 parameters, 25-year monthly series (z-score baselines)
//   raw/nasa-power/daily-2020-2025/<farm>.json     11 parameters, daily series (rain bursts, dry spells, heat/cold days)
//   raw/nasa-power/climatology/<farm>.json         Long-term monthly climatology normals
//   src/POWER_Point_Monthly_20200101_20251231_<lat>_<lon>_UTC.json  Same 7-parameter format as the
//     existing Philippine files, generated for any farm that does not yet have one.

import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FARMS, fetchJsonWithRetry, sleep } from './farms.config.mjs';

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(PACKAGE_DIR, 'raw', 'nasa-power');
const BASE = 'https://power.larc.nasa.gov/api/temporal';

const MONTHLY_PARAMS = [
  'T2M', 'T2M_MAX', 'T2M_MIN', 'T2MDEW', 'QV2M', 'RH2M', 'WS2M',
  'PRECTOTCORR', 'IMERG_PRECTOT',
  'GWETTOP', 'GWETROOT', 'GWETPROF',
  'ALLSKY_SFC_SW_DWN', 'CLRSKY_SFC_SW_DWN',
  'EVPTRNS', 'FROST_DAYS',
];
const DAILY_PARAMS = [
  'T2M', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'WS2M',
  'PRECTOTCORR', 'IMERG_PRECTOT',
  'GWETTOP', 'GWETROOT',
  'ALLSKY_SFC_SW_DWN', 'EVPTRNS',
];
const LEGACY_PARAMS = ['ALLSKY_SFC_SW_DWN', 'T2M', 'PRECTOTCORR', 'GWETROOT', 'GWETTOP', 'IMERG_PRECTOT', 'RH2M'];

const coordTag = (value, positive, negative) => {
  const hemisphere = value >= 0 ? positive : negative;
  const [whole, fraction] = Math.abs(value).toFixed(2).split('.');
  return `${whole.padStart(3, '0')}d${fraction}${hemisphere}`;
};

const pointQuery = (farm, params) =>
  `parameters=${params.join(',')}&community=AG&longitude=${farm.longitude}&latitude=${farm.latitude}&time-standard=UTC&format=JSON`;

const exists = async (file) => access(file).then(() => true, () => false);

async function save(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data)}\n`, 'utf8');
  console.log(`saved ${path.relative(PACKAGE_DIR, file)}`);
}

const manifest = { retrievedAt: new Date().toISOString(), source: 'NASA POWER API v2', requests: [] };

for (const farm of FARMS) {
  const jobs = [
    {
      kind: 'monthly-2001-2025',
      url: `${BASE}/monthly/point?${pointQuery(farm, MONTHLY_PARAMS)}&start=2001&end=2025`,
      file: path.join(RAW_DIR, 'monthly-2001-2025', `${farm.id}.json`),
    },
    {
      kind: 'daily-2020-2025',
      // time-standard=UTC is required for daily GPM IMERG values (IMERG is not offered in Local Solar Time).
      url: `${BASE}/daily/point?${pointQuery(farm, DAILY_PARAMS)}&start=20200101&end=20251231&time-standard=UTC`,
      file: path.join(RAW_DIR, 'daily-2020-2025', `${farm.id}.json`),
    },
    {
      kind: 'climatology',
      url: `${BASE}/climatology/point?${pointQuery(farm, MONTHLY_PARAMS.filter((p) => p !== 'IMERG_PRECTOT'))}`,
      file: path.join(RAW_DIR, 'climatology', `${farm.id}.json`),
    },
  ];

  const legacyName = `POWER_Point_Monthly_20200101_20251231_${coordTag(farm.latitude, 'N', 'S')}_${coordTag(farm.longitude, 'E', 'W')}_UTC.json`;
  const legacyFile = path.join(PACKAGE_DIR, 'src', legacyName);
  // The three Philippine basins already ship legacy-format files; always write UTC legacy files for guimaras and usa-midwest.
  const needsLegacyFile = farm.id === 'guimaras' || farm.id === 'usa-midwest';
  if (needsLegacyFile) {
    jobs.push({
      kind: 'legacy-monthly-2020-2025',
      url: `${BASE}/monthly/point?${pointQuery(farm, LEGACY_PARAMS)}&start=2020&end=2025`,
      file: legacyFile,
    });
  }

  for (const job of jobs) {
    const data = await fetchJsonWithRetry(job.url, { label: `${farm.id} ${job.kind}` });
    if (data?.messages?.length) console.warn(`${farm.id} ${job.kind} messages:`, data.messages);
    await save(job.file, data);
    manifest.requests.push({ farmId: farm.id, kind: job.kind, url: job.url, file: path.relative(PACKAGE_DIR, job.file).replaceAll('\\', '/') });
    await sleep(1_000);
  }
}

await save(path.join(RAW_DIR, 'manifest.json'), manifest);
console.log('NASA POWER download complete.');
