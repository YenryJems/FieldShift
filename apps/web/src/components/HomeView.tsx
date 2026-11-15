import React from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Compass, Database, ExternalLink, Leaf } from 'lucide-react';

interface HomeViewProps {
  onEnterWorkspace: () => void;
}

const overviewStats = [
  { value: '05', label: 'study locations' },
  { value: '15', label: 'crop rotation strategies' },
  { value: '04', label: 'decision dimensions' },
];

const planningSteps = [
  { number: '01', title: 'Choose a field', description: 'Start with a study location, its soil context, and the farming system already in place.' },
  { number: '02', title: 'Read the season', description: 'Explore historical NASA climate signals and the seasonal conditions that shape risk.' },
  { number: '03', title: 'Compare and review', description: 'Set priorities, compare rotations, and prepare a plan to discuss locally.' },
];

const connectedDatasets = [
  {
    name: 'NASA POWER · historical climate',
    status: 'Decision model input',
    detail: 'Real gridded point series for all five study locations. Monthly 2001–2025 climate normals and 2020–2025 historical baselines, plus daily 2020–2025 event summaries. Variables include 2 m temperature, corrected precipitation, root/surface wetness indices, humidity, solar radiation, and heat/rain-event counts. NASA POWER meteorology is based on MERRA-2; the configured solar source is CERES/SYN1deg.',
    limit: 'These gridded values describe a broad area around the study point. They are not readings from sensors in the field, a day-by-day weather forecast, or a soil test.',
    href: 'https://power.larc.nasa.gov/',
  },
  {
    name: 'NASA GPM IMERG · precipitation',
    status: 'Decision input + map layer',
    detail: 'IMERG precipitation (IMERG_PRECTOT) is included in the NASA POWER point files and daily summaries. A separate NASA GIBS IMERG layer provides precipitation-rate imagery in the field map.',
    limit: 'The map shows satellite-estimated rain over a broad area. It does not predict upcoming rain or replace a rain gauge at the farm.',
    href: 'https://gpm.nasa.gov/data/imerg',
  },
  {
    name: 'NASA SMAP L4 · surface soil moisture',
    status: 'Map context only',
    detail: 'NASA GIBS displays the SMAP L4 analyzed surface soil-moisture product. Each map pixel covers about 9 km, so it can show broad moisture patterns around the study location.',
    limit: 'A pixel this large cannot tell you the soil moisture in a specific field. This map layer is not used in the rotation score.',
    href: 'https://nsidc.org/data/spl4smau/versions/8',
  },
  {
    name: 'NASA Terra MODIS · 8-day NDVI',
    status: 'Map context only',
    detail: 'NASA GIBS displays rolling 8-day vegetation greenness (NDVI) imagery at about 250 m per pixel.',
    limit: 'A pixel may contain multiple fields and land-cover types. It does not identify the crop in a field and is not used in the rotation score.',
    href: 'https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_NDVI_8Day.json',
  },
  {
    name: 'NASA SRTM · configured slope context',
    status: 'Static farm-profile input',
    detail: 'The comparison model uses fixed slope values stored in the representative farm profiles, cited there to SRTM. The app does not fetch an SRTM raster or derive parcel-scale slope.',
    limit: 'These configured values are broad study-location context, not a measured slope for a farmer’s field.',
    href: 'https://www.earthdata.nasa.gov/data/instruments/srtm',
  },
  {
    name: 'Open-Meteo · live weather model',
    status: 'Live weather and 3-day forecast',
    detail: 'The Season panel fetches current model-updated conditions and a three-day outlook for the selected study coordinate. It refreshes every 15 minutes and offers a manual refresh.',
    limit: 'These are model-derived conditions, not readings from a weather station at the farm. Forecast availability depends on network access; confirm spray timing with PAGASA or the local weather service.',
    href: 'https://open-meteo.com/en/docs',
  },
  {
    name: 'ESA Copernicus Sentinel-2 L2A',
    status: 'Optional live point sample',
    detail: 'When a clear, usable scene is available, the app samples red and near-infrared reflectance at the selected study coordinate and derives NDVI. It checks recent scenes through the Earth Search STAC catalog.',
    limit: 'This is one 10 m pixel at the study point, not a farm-wide average. Scene availability depends on cloud cover and network access; it is not used in the rotation score.',
    href: 'https://dataspace.copernicus.eu/',
  },
  {
    name: 'FAO ECOCROP · crop climate database',
    status: 'Local reference database',
    detail: 'A local extract of FAO’s historical EcoCrop_DB.csv is mapped to 13 curated crop profiles. The app compares species-level temperature, rainfall, soil pH, elevation, and growth-cycle ranges with selected rotation crops.',
    limit: 'A bundled historical extract of global crop ranges, not a local field soil test or a yield prediction.',
    href: 'https://www.fao.org/land-water/databases-and-software/ecocrop/en/',
  },
  {
    name: 'FieldShift farm and rotation library',
    status: 'Bundled decision inputs',
    detail: 'The prototype contains five representative study-location profiles and 15 crop-rotation strategy profiles. Crop traits and field context are curated configuration inputs used by the comparison model; they are not individual farm records collected from growers.',
    limit: 'Representative planning scenarios. Confirm crop varieties, soil conditions, planting dates, labor, and market access with local farmers and extension staff.',
    href: 'https://github.com/godinezjames14-del/FieldShift',
  },
  {
    name: 'USDA AMS Market News · Illinois grain bids',
    status: 'Static market snapshot',
    detail: 'The market card includes a dated Central Illinois country-elevator corn and soybean price snapshot (USD/bu) from the USDA AMS grain bids report. It is supporting market context, not a live feed.',
    limit: 'Prices vary by buyer, location, grade, moisture, delivery date, freight, and basis. Confirm a current local offer before planning.',
    href: 'https://www.ams.usda.gov/mnreports/ams_3192.pdf',
  },
  {
    name: 'Philippine Statistics Authority · farmgate prices',
    status: 'Static market snapshot',
    detail: 'The market card includes September 2026 national farmgate snapshots: palay PHP 20.84/kg, yellow corn PHP 19.84/kg, and white corn PHP 18.92/kg. Values are bundled from the PSA July–September 2026 Palay and Corn Statistics release (retrieved November 14, 2026).',
    limit: 'National reported averages; not a local buyer quote, current daily price, or guaranteed farm return.',
    href: 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20Q3%202026.pdf',
  },
  {
    name: 'Esri World Imagery',
    status: 'Map basemaps',
    detail: 'Satellite imagery basemap shown beneath map overlays for visual orientation.',
    limit: 'Imagery does not establish surveyed field boundaries or enter any score.',
    href: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
  },
  {
    name: 'OpenStreetMap',
    status: 'Map basemap',
    detail: 'Street and place map data shown as an alternative basemap.',
    limit: 'Map features help orient the user; they do not establish surveyed field boundaries or enter any score.',
    href: 'https://www.openstreetmap.org/copyright',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onEnterWorkspace }) => (
  <main id="top" className="min-h-screen overflow-hidden bg-[#040811] text-[#F0F9FF]">
    <div className="min-h-screen bg-[#040811]">
      <header className="relative z-20 mx-auto flex min-h-[74px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400">
          <Compass className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
          <span>
            <span className="block text-[15px] font-extrabold tracking-tight text-[#F0F9FF]">FieldShift</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-sky-300/75 sm:block">Earth data · farm choices</span>
          </span>
        </a>

        <nav aria-label="Introduction sections" className="hidden items-center gap-1 rounded-lg border border-sky-400/20 bg-[#0B1426]/85 p-1 text-[11px] font-semibold text-slate-400 backdrop-blur-md md:flex">
          <a href="#overview" className="rounded-md border border-sky-400/30 bg-[#0D182E] px-4 py-2 text-[#F0F9FF]">Overview</a>
          <a href="#approach" className="rounded-md px-4 py-2 transition-colors hover:bg-[#0D182E]/70 hover:text-[#F0F9FF]">How it works</a>
          <a href="#data" className="rounded-md px-4 py-2 transition-colors hover:bg-[#0D182E]/70 hover:text-[#F0F9FF]">Data</a>
        </nav>

        <button type="button" onClick={onEnterWorkspace} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-sky-400 px-4 text-[11px] font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sky-400 sm:px-5 sm:text-xs">
          Enter the field workspace <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>

      <section id="overview" className="landing-hero relative isolate flex min-h-[calc(100svh-74px)] flex-col items-center overflow-hidden px-5 pt-16 text-center sm:px-8 sm:pt-20 lg:pt-24">
        <div aria-hidden="true" className="landing-hero-art absolute inset-0 -z-20" />
        <div aria-hidden="true" className="landing-hero-wash absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-[#0B1426]/85 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#7DD3FC] backdrop-blur-md sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> NASA Space Apps Challenge · The Next Frontier
          </p>
          <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#F0F9FF] sm:text-6xl lg:text-[4.75rem]">
            A changing season.<br className="hidden sm:block" /> A clearer next step.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#CBD5E1] sm:text-base sm:leading-8">
            Explore how historical climate patterns shape crop-rotation choices, then carry a grounded draft into a local conversation.
          </p>
          <button type="button" onClick={onEnterWorkspace} className="mt-7 inline-flex min-h-12 items-center gap-2.5 rounded-lg bg-sky-400 px-6 text-sm font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400">
            Enter the field workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <a href="#approach" className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
            See the three-step journey <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <section aria-label="Featured Guimaras mango terroir index" className="mt-6 w-full max-w-2xl rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 text-left backdrop-blur-md sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-sky-300/75">Featured case · Guimaras orchard</p>
                <h2 className="mt-1 text-base font-extrabold text-[#F0F9FF] sm:text-lg">Mango Sugar-Loading Index</h2>
                <p className="mt-1 max-w-lg text-xs leading-5 text-[#CBD5E1]">A modeled 0–100 climate-suitability index using historical dry spells, solar radiation, and configured terrain slope.</p>
              </div>
              <span className="shrink-0 rounded-md border border-sky-400/25 bg-[#0D182E] px-3 py-2 font-mono text-sm font-extrabold text-[#38BDF8]">0–100</span>
            </div>
            <p className="mt-3 border-t border-sky-400/20 pt-2 text-[10px] leading-4 text-[#94A3B8]">Designed around an 18–22° Brix suitability target; it does not measure fruit sugar or connect a live SRTM terrain feed.</p>
          </section>
        </div>

        <div className="relative z-10 mt-auto flex w-full max-w-[1120px] items-end justify-between gap-4 pb-5 pt-12 text-left text-[#F0F9FF] sm:pb-7 sm:pt-16">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-sky-300/80">A planning companion for real fields</p>
            <p className="mt-1 text-xs font-semibold sm:text-sm">From historical signals to farmer-reviewed choices.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-sky-400/30 bg-[#08101F]/80 px-3 py-1.5 font-mono text-[9px] font-semibold text-[#7DD3FC] backdrop-blur-md sm:inline-flex">
            Historical data for seasonal planning
          </span>
        </div>
      </section>

      <section aria-label="FieldShift at a glance" className="border-y border-sky-400/20 bg-[#08101F]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-sky-400/20 px-4 py-5 sm:px-8 sm:py-7">
          {overviewStats.map((item) => (
            <div key={item.label} className="px-3 text-center sm:px-6">
              <p className="font-mono text-2xl font-semibold tracking-tight text-[#38BDF8] sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-[9px] font-medium text-[#94A3B8] sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="approach" className="scroll-mt-20 bg-[#040811] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="max-w-sm">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-sky-300/75">A calm, guided workflow</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#F0F9FF] sm:text-3xl">One decision at a time.</h2>
            <p className="mt-3 text-sm leading-6 text-[#94A3B8]">The workspace walks from field context to a plan worth reviewing. You choose when to move to each step.</p>
          </div>
          <ol className="divide-y divide-sky-400/20 border-y border-sky-400/20">
            {planningSteps.map((step) => (
              <li key={step.number} className="grid gap-2 py-4 sm:grid-cols-[52px_1fr] sm:gap-4 sm:py-5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-[#38BDF8]">{step.number}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#F0F9FF] sm:text-base">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8] sm:text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="data" className="scroll-mt-20 border-t border-sky-400/20 bg-[#08101F] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-sky-300/75">Open data room · judge review</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#F0F9FF] sm:text-3xl">See exactly what informs FieldShift.</h2>
            <p className="mt-3 text-sm leading-6 text-[#94A3B8]">FieldShift uses past climate records and satellite imagery to compare seasonal choices. It does not predict next week&rsquo;s rain or temperature. Check your local weather service for day-to-day forecasts.</p>
          </div>

          <div className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7DD3FC]">
            <Database className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" /> Data used in this prototype
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {connectedDatasets.map((item) => (
              <details key={item.name} className="group rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md transition-colors hover:border-sky-400/50 open:border-sky-400 open:shadow-[0_0_18px_rgba(56,189,248,0.22)]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                  <span>
                    <span className="block text-sm font-bold text-[#F0F9FF]">{item.name}</span>
                    <span className="mt-1 inline-flex rounded border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 font-mono text-[9px] font-bold text-[#7DD3FC]">{item.status}</span>
                  </span>
                  <ArrowDown className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-xs leading-5 text-[#CBD5E1]">{item.detail}</p>
                <p className="mt-2 border-l-2 border-sky-400/40 pl-3 text-xs leading-5 text-[#94A3B8]"><strong>Limit:</strong> {item.limit}</p>
                <a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200" href={item.href} target="_blank" rel="noreferrer">Source citation <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
              </details>
            ))}
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#94A3B8]">
            <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#38BDF8]" aria-hidden="true" />
            Strategy scores and stress scenarios are educational models built from historical climate signals and curated crop assumptions. They are not weather predictions, measured yield outcomes, or a replacement for farmer judgment and local extension advice.
          </p>
        </div>
      </section>

      <footer className="border-t border-sky-400/20 bg-[#040811] px-5 py-6 text-[10px] leading-5 text-[#94A3B8] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold text-[#F0F9FF]">FieldShift · Team Overachiever · NASA Space Apps Challenge</span>
          <span>Educational decision support · pair climate information with local forecasts and extension expertise.</span>
        </div>
        <p className="mx-auto mt-3 max-w-[1120px] border-t border-sky-400/20 pt-3 text-[10px] leading-5 text-[#94A3B8]">NASA does not endorse any non-U.S. Government entity. FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.</p>
      </footer>
    </div>
  </main>
);
