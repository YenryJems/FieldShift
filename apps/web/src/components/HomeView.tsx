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
    detail: 'Real gridded point series for all five study locations. Monthly 2001–2025 climate normals and 2020–2025 historical baselines, plus daily 2020–2025 event summaries. Variables include 2 m temperature, corrected precipitation, root/surface wetness indices, humidity, solar radiation, and heat/rain-event counts.',
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
    href: 'https://nsidc.org/data/smap/data',
  },
  {
    name: 'NASA Terra MODIS · 8-day NDVI',
    status: 'Map context only',
    detail: 'NASA GIBS displays rolling 8-day vegetation greenness (NDVI) imagery at about 250 m per pixel.',
    limit: 'A pixel may contain multiple fields and land-cover types. It does not identify the crop in a field and is not used in the rotation score.',
    href: 'https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Terra_NDVI_8Day.json',
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
    name: 'Esri World Imagery + OpenStreetMap',
    status: 'Map basemaps',
    detail: 'The field map can display Esri satellite imagery or OpenStreetMap street and place context beneath the selectable data layers.',
    limit: 'Basemaps help orient the map; they do not establish surveyed field boundaries or enter any score.',
    href: 'https://www.openstreetmap.org/copyright',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onEnterWorkspace }) => (
  <main id="top" className="min-h-screen overflow-hidden bg-[#FBFCFA] text-[#17231C]">
    <div className="min-h-screen bg-[#FBFCFA]">
      <header className="relative z-20 mx-auto flex min-h-[74px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332] text-white"><Compass className="h-[18px] w-[18px]" aria-hidden="true" /></span>
          <span>
            <span className="block text-[15px] font-extrabold tracking-tight">FieldShift</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-[#748178] sm:block">Earth data · farm choices</span>
          </span>
        </a>

        <nav aria-label="Introduction sections" className="hidden items-center gap-1 rounded-full border border-[#E2E5DF] bg-white p-1 text-[11px] font-semibold text-[#5C685F] shadow-[0_2px_10px_rgba(31,45,35,0.04)] md:flex">
          <a href="#overview" className="rounded-full bg-[#F1F4EF] px-4 py-2 text-[#25372B]">Overview</a>
          <a href="#approach" className="rounded-full px-4 py-2 transition-colors hover:bg-[#F5F7F3] hover:text-[#1B4332]">How it works</a>
          <a href="#data" className="rounded-full px-4 py-2 transition-colors hover:bg-[#F5F7F3] hover:text-[#1B4332]">Data</a>
        </nav>

        <button type="button" onClick={onEnterWorkspace} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[#1B4332] px-4 text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#285A40] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1B4332] sm:px-5 sm:text-xs">
          Enter the field workspace <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>

      <section id="overview" className="landing-hero relative isolate flex min-h-[calc(100svh-74px)] flex-col items-center overflow-hidden px-5 pt-16 text-center sm:px-8 sm:pt-20 lg:pt-24">
        <div aria-hidden="true" className="landing-hero-art absolute inset-0 -z-20" />
        <div aria-hidden="true" className="landing-hero-wash absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#DCE4D9] bg-white/80 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#48604E] shadow-sm backdrop-blur-sm sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5D9163]" /> NASA Space Apps Challenge · The Next Frontier
          </p>
          <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#1C2820] sm:text-6xl lg:text-[4.75rem]">
            A changing season.<br className="hidden sm:block" /> A clearer next step.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#536157] sm:text-base sm:leading-8">
            Explore how historical climate patterns shape crop-rotation choices, then carry a grounded draft into a local conversation.
          </p>
          <button type="button" onClick={onEnterWorkspace} className="mt-7 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#1C2820] px-6 text-sm font-bold text-white shadow-[0_8px_22px_rgba(22,38,27,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#31523B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]">
            Enter the field workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <a href="#approach" className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs font-semibold text-[#526458] transition-colors hover:text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
            See the three-step journey <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="relative z-10 mt-auto flex w-full max-w-[1120px] items-end justify-between gap-4 pb-5 pt-12 text-left text-white sm:pb-7 sm:pt-16">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">A planning companion for real fields</p>
            <p className="mt-1 text-xs font-semibold sm:text-sm">From historical signals to farmer-reviewed choices.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/35 bg-black/15 px-3 py-1.5 font-mono text-[9px] font-semibold text-white/90 backdrop-blur-sm sm:inline-flex">
            Historical data for seasonal planning
          </span>
        </div>
      </section>

      <section aria-label="FieldShift at a glance" className="border-y border-[#E6E9E3] bg-white">
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-[#E8EBE6] px-4 py-5 sm:px-8 sm:py-7">
          {overviewStats.map((item) => (
            <div key={item.label} className="px-3 text-center sm:px-6">
              <p className="font-mono text-2xl font-semibold tracking-tight text-[#1D2D22] sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-[9px] font-medium text-[#738078] sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="approach" className="scroll-mt-20 bg-[#FBFCFA] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="max-w-sm">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#64806A]">A calm, guided workflow</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#1C2820] sm:text-3xl">One decision at a time.</h2>
            <p className="mt-3 text-sm leading-6 text-[#667269]">The workspace walks from field context to a plan worth reviewing. You choose when to move to each step.</p>
          </div>
          <ol className="divide-y divide-[#E4E8E2] border-y border-[#E4E8E2]">
            {planningSteps.map((step) => (
              <li key={step.number} className="grid gap-2 py-4 sm:grid-cols-[52px_1fr] sm:gap-4 sm:py-5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-[#74917A]">{step.number}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#26372B] sm:text-base">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#69766D] sm:text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="data" className="scroll-mt-20 border-t border-[#E6E9E3] bg-[#F5F7F3] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#64806A]">Open data room · judge review</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#1C2820] sm:text-3xl">See exactly what informs FieldShift.</h2>
            <p className="mt-3 text-sm leading-6 text-[#58675D]">FieldShift uses past climate records and satellite imagery to compare seasonal choices. It does not predict next week&rsquo;s rain or temperature. Check your local weather service for day-to-day forecasts.</p>
          </div>

          <div className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#38513E]">
            <Database className="h-4 w-4" aria-hidden="true" /> Data used in this prototype
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {connectedDatasets.map((item) => (
              <details key={item.name} className="group rounded-xl border border-[#DDE4DB] bg-white p-4 open:border-[#9DB5A0] open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
                  <span>
                    <span className="block text-sm font-bold text-[#26372B]">{item.name}</span>
                    <span className="mt-1 inline-flex rounded-full bg-[#EAF2E9] px-2 py-1 font-mono text-[9px] font-bold text-[#3F6547]">{item.status}</span>
                  </span>
                  <ArrowDown className="mt-1 h-4 w-4 shrink-0 text-[#718176] transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-3 text-xs leading-5 text-[#536157]">{item.detail}</p>
                <p className="mt-2 border-l-2 border-[#D6C28A] pl-3 text-xs leading-5 text-[#6F6650]"><strong>Limit:</strong> {item.limit}</p>
                <a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#285A40] underline decoration-[#A7BCA8] underline-offset-2" href={item.href} target="_blank" rel="noreferrer">Open source <ExternalLink className="h-3 w-3" aria-hidden="true" /></a>
              </details>
            ))}
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#58675D]">
            <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#52715E]" aria-hidden="true" />
            Strategy scores and stress scenarios are educational models built from historical climate signals and curated crop assumptions. They are not weather predictions, measured yield outcomes, or a replacement for farmer judgment and local extension advice.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#E6E9E3] bg-white px-5 py-6 text-[10px] leading-5 text-[#778179] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold text-[#38513E]">FieldShift · Team Overachiever · NASA Space Apps Challenge</span>
          <span>Educational decision support · pair climate information with local forecasts and extension expertise.</span>
        </div>
      </footer>
    </div>
  </main>
);
