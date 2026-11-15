import React, { Suspense, lazy, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  CloudRain,
  Droplets,
  ExternalLink,
  MapPin,
  ThermometerSun,
} from 'lucide-react';
import {
  buildMonthlySummaryCsv,
  DEFAULT_FIELD_CONSTRAINTS,
  DEFAULT_PLOT_SHOCKS,
  DEFAULT_PRIORITY_WEIGHTS,
  FARMS_BY_ID,
  type FieldConstraints,
  getMonthlyTelemetry,
  MONTHLY_SUMMARY_CSV_FILE_NAME,
  type PlaceClimate,
  type PlaceId,
  PLACES,
  PLACES_BY_ID,
  type PlotStrategyShocks,
  type PriorityWeights,
  rankFarmStrategies,
  type StrategyId,
  STRESS_PRESETS,
  type StressScenarioId,
  wetnessIndexToPct,
} from '@fieldshift/climate-data';
import { AnalyticalSuiteSection } from './Agronomics/AnalyticalSuiteSection';
import { LiveWeatherPanel } from './Agronomics/LiveWeatherPanel';
import {
  EMPTY_SOIL_FORM_STATE,
  type SoilGroundTruthFormState,
} from './Certification/SoilCertificate';
import { FooterAndAttributions } from './Common/FooterAndAttributions';
import { NasaDataAuditDrawer } from './Common/NasaDataAuditDrawer';
import { DecisionDashboard } from './Dashboard/DecisionDashboard';
import { StrategyComparisonSection } from './Rotation/StrategyComparisonSection';
import type { WorkbenchTab } from './TopNavBar';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const NASA_POWER_API_DOCS = 'https://power.larc.nasa.gov/docs/services/api/temporal/monthly/';
type MapLayer = 'satellite' | 'street';

const INITIAL_PRIORITY_WEIGHTS: PriorityWeights = {
  water: Math.round(DEFAULT_PRIORITY_WEIGHTS.water * 100),
  erosion: Math.round(DEFAULT_PRIORITY_WEIGHTS.erosion * 100),
  nutrients: Math.round(DEFAULT_PRIORITY_WEIGHTS.nutrients * 100),
  market: Math.round(DEFAULT_PRIORITY_WEIGHTS.market * 100),
};

const LazyFieldMap = lazy(() =>
  import('./FieldMap').then(({ FieldMap }) => ({ default: FieldMap })),
);

const formatNumber = (value: number | null, digits = 1): string =>
  value === null
    ? 'No data'
    : new Intl.NumberFormat('en', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

const formatCoordinates = (latitude: number, longitude: number): string =>
  `${Math.abs(latitude).toFixed(3)}° ${latitude < 0 ? 'S' : 'N'}, ${Math.abs(longitude).toFixed(3)}° ${longitude < 0 ? 'W' : 'E'}`;

const downloadMonthlySummaryCsv = () => {
  const file = new Blob([buildMonthlySummaryCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = MONTHLY_SUMMARY_CSV_FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const FarmFact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-lg border border-sky-400/20 bg-[#0D182E] p-2.5">
    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">{label}</p>
    <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#F0F9FF]">{value}</p>
  </div>
);

interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, detail, highlight = false }) => (
  <div
    className={`rounded-xl border px-3.5 py-2.5 ${
      highlight
        ? 'border-sky-400 bg-[#0D182E] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
        : 'border-sky-400/20 bg-[#0D182E]'
    }`}
  >
    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">
      {label}
    </p>
    <p
      className={`mt-1 font-mono text-lg font-extrabold tabular-nums ${
        highlight ? 'text-[#38BDF8]' : 'text-[#F0F9FF]'
      }`}
    >
      {value}
    </p>
    <p className="text-[10px] text-[#94A3B8]">{detail}</p>
  </div>
);

const AdditionalSignalsPanel: React.FC<{
  selectedPlot: PlaceClimate;
  selectedMonth: number;
}> = ({ selectedPlot, selectedMonth }) => {
  const selectedMonthTelemetry = getMonthlyTelemetry(selectedPlot.id, selectedMonth);
  const supplementalSignals = [
    {
      label: 'Relative Humidity',
      value: `${formatNumber(selectedMonthTelemetry.relativeHumidityPct)}%`,
      detail: '2 m atmospheric moisture',
    },
    {
      label: 'Solar Radiation',
      value: `${formatNumber(selectedMonthTelemetry.solarRadiationMj)} MJ/m²/day`,
      detail: 'All-sky surface shortwave',
    },
    {
      label: 'Surface Moisture (%)',
      value: `${selectedMonthTelemetry.surfaceSoilMoisturePct}%`,
      detail: 'Topsoil (0–5 cm) scaled index',
    },
    {
      label: 'IMERG Rainfall',
      value: `${formatNumber(selectedMonthTelemetry.imergRainfallMmDay)} mm/day`,
      detail: 'Alternate GPM satellite product',
    },
  ];

  return (
    <details
      aria-label={`Additional ${selectedMonthTelemetry.month} climate data for ${selectedPlot.name}`}
      className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-3.5 backdrop-blur-md"
    >
      <summary className="flex cursor-pointer select-none items-center justify-between gap-2 text-xs font-extrabold text-[#F0F9FF]">
        <span>More {selectedMonthTelemetry.month} signals (Humidity, Solar, Surface Moisture, IMERG)</span>
        <span className="shrink-0 rounded-full border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 font-mono text-[9px] font-bold text-[#7DD3FC]">
          {selectedPlot.years.length} years
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {supplementalSignals.map((signal) => (
          <article
            key={signal.label}
            className="min-w-0 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 py-2"
          >
            <p className="text-[9px] font-bold text-sky-300/75">{signal.label}</p>
            <p className="mt-0.5 break-words font-mono text-[13px] font-extrabold tabular-nums text-[#F0F9FF]">
              {signal.value}
            </p>
            <p className="mt-0.5 break-words text-[8px] leading-3 text-[#94A3B8]">
              {signal.detail}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[9px] leading-3 text-[#94A3B8]">
        Monthly means for {selectedPlot.years[0]}–{selectedPlot.years.at(-1)}. Surface moisture is scaled
        0–100% from a gridded wetness index, not a field probe reading.
      </p>
    </details>
  );
};

const FieldMapPanel: React.FC<{
  selectedPlot: PlaceClimate;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  mapLayer: MapLayer;
  onMapLayerChange: (layer: MapLayer) => void;
  onSelectPlot: (id: PlaceId) => void;
}> = ({
  selectedPlot,
  selectedMonth,
  onMonthChange,
  mapLayer,
  onMapLayerChange,
  onSelectPlot,
}) => {
  const selectedMonthTelemetry = getMonthlyTelemetry(selectedPlot.id, selectedMonth);

  return (
    <section className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
            Esri World Imagery · Leaflet
          </p>
          <div className="mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <h3 className="text-lg font-extrabold text-[#F0F9FF]">Satellite field view</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            NASA POWER point and configured study-area extent for {selectedPlot.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
            Historical month
            <select
              aria-label="Select month for map telemetry"
              value={selectedMonth}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className="h-10 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 text-xs font-semibold normal-case tracking-normal text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              {selectedPlot.monthly.map((month) => (
                <option key={month.month} value={month.month} className="bg-[#08101F] text-[#F0F9FF]">
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <div
            role="group"
            aria-label="Map layer"
            className="inline-flex h-10 rounded-lg border border-sky-400/20 bg-[#0D182E] p-1"
          >
            {(['satellite', 'street'] as const).map((layer) => (
              <button
                key={layer}
                type="button"
                aria-pressed={mapLayer === layer}
                onClick={() => onMapLayerChange(layer)}
                className={`rounded-md px-3 text-xs font-bold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  mapLayer === layer
                    ? 'bg-sky-400 text-[#040811]'
                    : 'text-[#94A3B8] hover:text-[#F0F9FF]'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div
            className="flex h-[420px] items-center justify-center rounded-xl border border-sky-400/20 bg-[#08101F] text-sm text-[#94A3B8]"
            role="status"
          >
            Loading interactive map…
          </div>
        }
      >
        <LazyFieldMap
          activeMonthData={selectedMonthTelemetry}
          mapLayer={mapLayer}
          selectedPlotId={selectedPlot.id}
          onSelectPlot={onSelectPlot}
        />
      </Suspense>
      <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
        The boundary marks the configured study extent, not a farm boundary. Its color is a
        threshold-based cue for the selected monthly point summary—not a spatial stress map or
        calibrated crop-risk assessment. Display thresholds: Root-Zone Moisture &lt; 55%, Daily
        Rainfall &gt; 14 mm/day, Root-Zone Moisture &gt; 93%, or Air Temperature &gt; 28.5°C.
        Satellite tiles © Esri; street tiles © OpenStreetMap contributors.
      </p>
    </section>
  );
};

const SeasonalChart: React.FC<{
  place: PlaceClimate;
  rainfallChange: boolean;
  heatChange: boolean;
}> = ({ place, rainfallChange, heatChange }) => {
  const width = 760;
  const height = 300;
  const left = 58;
  const right = 54;
  const top = 26;
  const bottom = 44;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const columnWidth = chartWidth / 12;

  const baselinePrecipitation = place.monthly.map((month) => month.meanPrecipitationMm);
  const precipitation = baselinePrecipitation.map((value) =>
    value === null
      ? null
      : value * (rainfallChange ? 0.8 : 1),
  );
  const baselineTemperature = place.monthly.map((month) => month.meanTemperatureC);
  const temperature = baselineTemperature.map((value) =>
    value === null
      ? null
      : value + (heatChange ? 2 : 0),
  );
  const validRain = baselinePrecipitation.filter((value): value is number => value !== null);
  const validTemperature = baselineTemperature.filter((value): value is number => value !== null);
  const rainAxisMax = Math.max(100, Math.ceil(Math.max(...validRain, 0) / 100) * 100);
  const minimumTemperature = validTemperature.length
    ? Math.floor(Math.min(...validTemperature) / 2) * 2
    : 0;
  const maximumTemperature = validTemperature.length
    ? Math.ceil((Math.max(...validTemperature) + 2) / 2) * 2
    : 2;
  const temperatureRange = Math.max(maximumTemperature - minimumTemperature, 1);
  let hasPreviousTemperature = false;
  const temperaturePath = temperature
    .map((value, index) => {
      if (value === null) {
        hasPreviousTemperature = false;
        return '';
      }
      const x = left + index * columnWidth + columnWidth / 2;
      const y = top + chartHeight - ((value - minimumTemperature) / temperatureRange) * chartHeight;
      const command = hasPreviousTemperature ? 'L' : 'M';
      hasPreviousTemperature = true;
      return `${command} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <div id="seasonal-analysis" className="scroll-mt-28 overflow-x-auto rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-bold text-[#F0F9FF]">Monthly climate pattern</h3>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Mean for each calendar month across {place.years[0]}–{place.years.at(-1)}
          </p>
        </div>
        {(rainfallChange || heatChange) && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-[#0D182E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#FBBF24]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            WHAT-IF SCENARIO
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto min-w-[540px] w-full"
        role="img"
        aria-label={`Monthly NASA POWER historical summary for ${place.name}: precipitation columns in millimeters and 2-meter temperature line in degrees Celsius${rainfallChange ? ', with rainfall reduced by 20 percent' : ''}${heatChange ? ', with temperature increased by 2 degrees Celsius' : ''}`}
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = top + chartHeight * fraction;
          const value = Math.round(rainAxisMax * (1 - fraction));
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(56,189,248,0.15)" />
              <text
                x={left - 10}
                y={y + 3}
                textAnchor="end"
                fill="#94A3B8"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
              >
                {value}
              </text>
            </g>
          );
        })}
        <text
          x="15"
          y={top + chartHeight / 2}
          transform={`rotate(-90 15 ${top + chartHeight / 2})`}
          textAnchor="middle"
          fill="#94A3B8"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          mm / month
        </text>
        {temperaturePath && (
          <path
            d={temperaturePath}
            fill="none"
            stroke="#FBBF24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {MONTHS.map((month, index) => {
          const x = left + index * columnWidth + columnWidth / 2;
          const value = precipitation[index];
          const barHeight = value === null ? 0 : (value / rainAxisMax) * chartHeight;
          const temperatureValue = temperature[index];
          const y =
            temperatureValue === null
              ? null
              : top +
                chartHeight -
                ((temperatureValue - minimumTemperature) / temperatureRange) * chartHeight;

          return (
            <g key={month}>
              {value !== null && (
                <rect
                  x={x - 11}
                  y={top + chartHeight - barHeight}
                  width="22"
                  height={barHeight}
                  rx="2"
                  fill={rainfallChange ? '#94A3B8' : '#38BDF8'}
                  fillOpacity={rainfallChange ? 0.65 : 0.78}
                >
                  <title>{`${month}: ${formatNumber(value, 0)} mm mean monthly precipitation${rainfallChange ? ' in the 20% less rainfall scenario' : ''}`}</title>
                </rect>
              )}
              {y !== null && (
                <circle cx={x} cy={y} r="3.5" fill="#FBBF24" stroke="#040811" strokeWidth="1.5">
                  <title>{`${month}: ${formatNumber(temperatureValue, 1)}°C mean 2-meter temperature${heatChange ? ' in the +2°C scenario' : ''}`}</title>
                </circle>
              )}
              <text
                x={x}
                y={height - 13}
                textAnchor="middle"
                fill="#94A3B8"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="10"
              >
                {month}
              </text>
            </g>
          );
        })}
        <text
          x={width - right + 8}
          y={top + 8}
          fill="#FBBF24"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          {maximumTemperature}°
        </text>
        <text
          x={width - right + 8}
          y={top + chartHeight}
          fill="#FBBF24"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          {minimumTemperature}°
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-2 text-xs text-[#CBD5E1]">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-sm ${rainfallChange ? 'bg-[#94A3B8]' : 'bg-[#38BDF8]'}`}
          />
          Mean monthly precipitation (mm)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-[#FBBF24]" />
          Mean air temperature ({heatChange ? '+2°C scenario' : '°C'})
        </span>
        <span className="ml-auto text-[#94A3B8]">Temperature line uses right-side °C scale</span>
      </div>
    </div>
  );
};

const PlaceInsights: React.FC<{
  place: PlaceClimate;
  rainfallChange: boolean;
  heatChange: boolean;
}> = ({ place, rainfallChange, heatChange }) => {
  const warmestMonth = place.monthly.reduce((warmest, month) =>
    (month.meanTemperatureC ?? -Infinity) > (warmest.meanTemperatureC ?? -Infinity)
      ? month
      : warmest,
  );
  const wettestMonth = place.monthly.reduce((wettest, month) =>
    (month.meanPrecipitationMm ?? -Infinity) > (wettest.meanPrecipitationMm ?? -Infinity)
      ? month
      : wettest,
  );
  const driestRootMonth = place.monthly.reduce((driest, month) =>
    (month.meanRootWetnessIndex ?? Infinity) < (driest.meanRootWetnessIndex ?? Infinity)
      ? month
      : driest,
  );
  const warmestTemperature = warmestMonth.meanTemperatureC === null
    ? null
    : warmestMonth.meanTemperatureC + (heatChange ? 2 : 0);
  const scenarioRain = wettestMonth.meanPrecipitationMm === null
    ? null
    : wettestMonth.meanPrecipitationMm * (rainfallChange ? 0.8 : 1);
  const driestRootMoisturePct = driestRootMonth.meanRootWetnessIndex === null
    ? null
    : wetnessIndexToPct(driestRootMonth.meanRootWetnessIndex);

  return (
    <section aria-labelledby="season-readout-title" className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
            Season readout
          </p>
          <h3 id="season-readout-title" className="mt-1 text-lg font-extrabold text-[#F0F9FF]">
            What stands out for {place.name}?
          </h3>
        </div>
        <span className="hidden text-xs text-[#94A3B8] sm:block">Summary of past seasons</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
          <div className="flex items-center gap-2 text-[#CBD5E1]">
            <ThermometerSun className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <p className="text-xs font-bold">Warmest monthly average</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#38BDF8]">
            {formatNumber(warmestTemperature)}°C
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">{warmestMonth.label} mean air temperature</p>
        </article>
        <article className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
          <div className="flex items-center gap-2 text-[#CBD5E1]">
            <CloudRain className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <p className="text-xs font-bold">Wettest month</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#38BDF8]">
            {formatNumber(scenarioRain, 0)} mm
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {wettestMonth.label} average monthly precipitation
          </p>
        </article>
        <article className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
          <div className="flex items-center gap-2 text-[#CBD5E1]">
            <Droplets className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <p className="text-xs font-bold">Lowest Root-Zone Moisture</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#38BDF8]">
            {driestRootMoisturePct === null ? 'No data' : `${driestRootMoisturePct}%`}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">{driestRootMonth.label} (0–100 cm scaled)</p>
        </article>
      </div>
    </section>
  );
};

const PlanningComparison: React.FC<{
  place: PlaceClimate;
  heatChange: boolean;
  onOpenPriorities: () => void;
}> = ({ place, heatChange, onOpenPriorities }) => {
  const driestMonth = place.monthly.reduce((driest, month) =>
    (month.meanPrecipitationMm ?? Infinity) < (driest.meanPrecipitationMm ?? Infinity)
      ? month
      : driest,
  );
  const lowestRootWetnessMonth = place.monthly.reduce((driest, month) =>
    (month.meanRootWetnessIndex ?? Infinity) < (driest.meanRootWetnessIndex ?? Infinity)
      ? month
      : driest,
  );
  const warmestMonth = place.monthly.reduce((warmest, month) =>
    (month.meanTemperatureC ?? -Infinity) > (warmest.meanTemperatureC ?? -Infinity)
      ? month
      : warmest,
  );
  const warmestTemperature =
    warmestMonth.meanTemperatureC === null
      ? null
      : warmestMonth.meanTemperatureC + (heatChange ? 2 : 0);

  const comparisons = [
    {
      label: 'Baseline',
      title: 'Farmer’s current rotation',
      evidence: 'Bring the current crop sequence and planting dates; NASA POWER does not contain farm rotation records.',
      prompt: 'Which crop growth stages overlap the warmest or wettest months?',
    },
    {
      label: 'Soil cover',
      title: 'Explore a cover or legume window',
      evidence: `Root-Zone Moisture is lowest in ${lowestRootWetnessMonth.label}; rainfall is lowest in ${driestMonth.label} in this six-year summary.`,
      prompt: 'Could a locally suitable cover crop establish before the dry period with available water and seed?',
    },
    {
      label: 'Heat response',
      title: 'Compare a heat-ready alternative',
      evidence: `${warmestMonth.label} has the highest monthly mean temperature (${formatNumber(warmestTemperature)}°C${heatChange ? ' in the +2°C scenario' : ''}).`,
      prompt: 'Ask local extension staff which adapted varieties or planting windows are worth comparing.',
    },
  ];

  return (
    <section aria-labelledby="planning-comparison-title" className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
            From climate signal to planting conversation
          </p>
          <h3 id="planning-comparison-title" className="mt-1 text-lg font-extrabold text-[#F0F9FF]">
            Three options to compare with the farmer
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
            These are discussion prompts, not ranked recommendations. The source data has no crop calendar,
            field soil test, irrigation record, or market information.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPriorities}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-xs font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Set priorities &amp; compare rotations
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {comparisons.map((item, index) => (
          <article key={item.label} className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
                Option 0{index + 1}
              </span>
              <span className="rounded border border-sky-400/20 bg-[#0B1426] px-2.5 py-0.5 text-[10px] font-bold text-[#7DD3FC]">
                {item.label}
              </span>
            </div>
            <h4 className="mt-3 text-base font-extrabold text-[#F0F9FF]">{item.title}</h4>
            <p className="mt-3 border-l-2 border-sky-400/40 pl-3 text-xs leading-5 text-[#CBD5E1]">
              <span className="font-bold text-[#F0F9FF]">Data signal: </span>
              {item.evidence}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
              <span className="font-bold text-[#CBD5E1]">Discuss: </span>
              {item.prompt}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

interface WorkspaceViewProps {
  activeTab?: WorkbenchTab;
  onTabChange?: (tab: WorkbenchTab) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<WorkbenchTab>('field-season');
  const [placeId, setPlaceId] = useState<PlaceId>('nueva-ecija');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [mapLayer, setMapLayer] = useState<MapLayer>('satellite');
  const [rainfallChange, setRainfallChange] = useState(false);
  const [heatChange, setHeatChange] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId | null>(null);
  const [weights, setWeights] = useState<PriorityWeights>(INITIAL_PRIORITY_WEIGHTS);
  const [stressScenario, setStressScenario] = useState<StressScenarioId>('baseline');
  const [constraints, setConstraints] = useState<FieldConstraints>(DEFAULT_FIELD_CONSTRAINTS);
  const [soilFormByFarm, setSoilFormByFarm] = useState<
    Partial<Record<PlaceId, SoilGroundTruthFormState>>
  >({});
  const [dashboardWeights, setDashboardWeights] = useState<PriorityWeights>({
    water: 25,
    erosion: 25,
    nutrients: 25,
    market: 25,
  });
  const [dashboardShocks, setDashboardShocks] = useState<PlotStrategyShocks>(DEFAULT_PLOT_SHOCKS);
  const [plainEnglish, setPlainEnglish] = useState(true);

  const activeTab = controlledTab ?? internalTab;

  const navigateToTab = (nextTab: WorkbenchTab) => {
    if (controlledTab === undefined) {
      setInternalTab(nextTab);
    }
    onTabChange?.(nextTab);
    if (typeof document !== 'undefined') {
      document.getElementById('workspace-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectFarm = (nextPlaceId: PlaceId) => {
    setPlaceId(nextPlaceId);
    setSelectedStrategyId(null);
  };

  const place = PLACES_BY_ID[placeId];
  const farm = FARMS_BY_ID[placeId];
  const selectedMonthTelemetry = getMonthlyTelemetry(placeId, selectedMonth);
  const activeFariEvaluation = rankFarmStrategies(
    placeId,
    selectedMonth,
    stressScenario,
    weights,
    constraints,
  );
  const planScore =
    (selectedStrategyId
      ? activeFariEvaluation.strategies.find((s) => s.strategyId === selectedStrategyId)
      : undefined) ?? activeFariEvaluation.topStrategy;
  const planStrategyObj =
    farm.strategies.find((s) => s.id === planScore.strategyId) ?? farm.strategies[0];
  const activeFariScore = planScore.fariScore;

  const displayTemperature = activeFariEvaluation.climate.adjustedTempC + (heatChange ? 2 : 0);
  const displayDailyRainfall =
    activeFariEvaluation.climate.adjustedDailyRainfallMm * (rainfallChange ? 0.8 : 1);
  const displayRootZoneMoisture = activeFariEvaluation.climate.adjustedRootZoneMoisturePct;

  return (
    <main id="field-demo" className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      {/* Persistent Sticky Workbench Control Header + Live 4-KPI Strip */}
      <section
        id="workspace-content"
        aria-label="Workbench controls and live telemetry KPIs"
        className="scroll-mt-24 space-y-3 rounded-2xl border border-sky-400/20 bg-[#08101F]/90 p-4 backdrop-blur-md md:sticky md:top-[69px] md:z-30 sm:p-5"
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div
            role="tablist"
            aria-label="Select a farm location"
            className="grid grid-cols-2 gap-1 rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-1 sm:grid-cols-5"
          >
            {PLACES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={placeId === item.id}
                onClick={() => selectFarm(item.id)}
                className={`min-h-9 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 sm:px-3 ${
                  placeId === item.id
                    ? 'border-sky-400 bg-[#0D182E] text-[#F0F9FF] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F0F9FF]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 text-[11px] font-bold text-sky-300/75">
              <span className="font-mono uppercase tracking-wider">Month</span>
              <select
                aria-label="Select historical month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="h-7 bg-transparent text-xs font-extrabold text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                {place.monthly.map((month) => (
                  <option key={month.month} value={month.month} className="bg-[#08101F] text-[#F0F9FF]">
                    {month.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => navigateToTab('priorities-rotations')}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                stressScenario !== 'baseline' || rainfallChange || heatChange
                  ? 'border-sky-400 bg-[#0D182E] text-[#F0F9FF] shadow-[0_0_18px_rgba(56,189,248,0.22)] hover:border-sky-400/80'
                  : 'border-sky-400/20 bg-[#0D182E] text-[#CBD5E1] hover:border-sky-400/50'
              }`}
            >
              {(stressScenario !== 'baseline' || rainfallChange || heatChange) && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              )}
              <span className="uppercase tracking-wider text-sky-300/75">What-If:</span>
              <span>
                {STRESS_PRESETS[stressScenario].shortLabel}
                {rainfallChange ? ' · -20% chart rain' : ''}
                {heatChange ? ' · +2°C chart' : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                navigateToTab(selectedStrategyId ? 'sources-brief' : 'priorities-rotations')
              }
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selectedStrategyId
                  ? 'border-sky-400 bg-sky-400 text-[#040811] hover:bg-sky-300'
                  : 'border-sky-400/20 bg-[#0D182E] text-[#F0F9FF] hover:border-sky-400/50'
              }`}
            >
              <span className={`uppercase tracking-wider ${selectedStrategyId ? 'text-[#040811]/75' : 'text-sky-300/75'}`}>
                {selectedStrategyId ? 'Draft:' : 'Leading:'}
              </span>
              <span>
                {planStrategyObj.id} · {planStrategyObj.shortLabel}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <KpiCard
            label="Air Temperature (°C)"
            value={`${formatNumber(displayTemperature)}°C`}
            detail={`${selectedMonthTelemetry.month} · ${
              stressScenario === 'baseline' && !heatChange ? '2020–2025 mean' : 'scenario adjusted'
            }`}
          />
          <KpiCard
            label="Daily Rainfall (mm/day)"
            value={`${formatNumber(displayDailyRainfall, 2)} mm/day`}
            detail={`${selectedMonthTelemetry.month} · ${
              stressScenario === 'baseline' && !rainfallChange ? 'NASA POWER' : 'scenario adjusted'
            }`}
          />
          <KpiCard
            label="Root-Zone Moisture (%)"
            value={`${displayRootZoneMoisture}%`}
            detail={`0–100 cm scaled${
              stressScenario !== 'baseline' ? ` · ${STRESS_PRESETS[stressScenario].shortLabel}` : ''
            }`}
          />
          <KpiCard
            label="Active FARI Score (%)"
            value={`${activeFariScore.toFixed(1)}%`}
            detail={`${planStrategyObj.id} · Rank #${planScore.rank}${
              selectedStrategyId ? ' · your draft' : ' · leading score'
            }`}
            highlight
          />
        </div>
      </section>

      {/* Tab 01: Field & Season (Unified Split-Pane Workbench) */}
      {activeTab === 'field-season' && (
        <div className="space-y-6">
          <section
            aria-label={`Field context for ${farm.name}`}
            className="grid gap-3 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:grid-cols-2 sm:p-5 lg:grid-cols-5"
          >
            <div className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 lg:col-span-2">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">
                Selected field context
              </p>
              <h1 className="mt-1 text-lg font-extrabold text-[#F0F9FF]">{farm.name}</h1>
              <p className="mt-0.5 text-xs text-[#94A3B8]">{farm.locationLabel}</p>
            </div>
            <FarmFact
              label="Coordinates"
              value={formatCoordinates(farm.latitude, farm.longitude)}
            />
            <FarmFact label="Elevation · slope" value={`${farm.elevationM} m · ${farm.slopePct}%`} />
            <FarmFact label="Soil context" value={farm.soilType} />
            <div className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 sm:col-span-2 lg:col-span-5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">
                Baseline practice
              </p>
              <p className="mt-1 text-xs font-semibold text-[#F0F9FF]">
                {farm.baselineFarmingSystem}
              </p>
            </div>
          </section>

          <section
            aria-label="Decision this demo supports"
            className="grid gap-3 rounded-2xl border border-sky-400/30 bg-[#08101F] p-5 text-[#F0F9FF] shadow-[0_0_24px_rgba(56,189,248,0.12)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
          >
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#38BDF8]">
                The farm decision
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-[#F0F9FF] sm:text-xl">
                Which rotation is worth discussing for this field and season?
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[#CBD5E1]">
                Use past climate records to compare crop options against the farmer’s priorities.
                Check local weather before scheduling field work, and review any plan with local
                agricultural advisers.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-sky-400/30 bg-[#0D182E] px-3 py-2 font-mono text-[10px] font-bold text-[#7DD3FC]">
              OBSERVE → COMPARE → VERIFY
            </span>
          </section>

          {/* Split-Pane Grid: Map & Telemetry Left | Seasonal Chart, What-If & Insights Right */}
          <div id="field-map" className="scroll-mt-28 grid items-start gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <FieldMapPanel
                selectedPlot={place}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                mapLayer={mapLayer}
                onMapLayerChange={setMapLayer}
                onSelectPlot={selectFarm}
              />
              <AdditionalSignalsPanel selectedPlot={place} selectedMonth={selectedMonth} />
              <NasaDataAuditDrawer
                metricKeys={[
                  'airTempCelsius',
                  'dailyRainfallMm',
                  'rootZoneMoisturePct',
                  'surfaceSoilMoisturePct',
                  'relativeHumidityPct',
                  'solarRadiationMj',
                  'fariScore',
                ]}
              />
            </div>

            <div className="space-y-4 lg:col-span-6">
              <SeasonalChart
                place={place}
                rainfallChange={rainfallChange}
                heatChange={heatChange}
              />

              <section className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="max-w-xl">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
                      Explore a what-if
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold text-[#F0F9FF]">
                      Adjust the historical baseline
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                      These hypothetical changes adjust only the displayed rainfall and temperature
                      averages; root-zone wetness is not re-simulated. They are not forecasts or
                      climate projections.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:border-sky-400/50">
                      <input
                        type="checkbox"
                        checked={rainfallChange}
                        onChange={(event) => setRainfallChange(event.target.checked)}
                        className="h-4 w-4 accent-[#38BDF8]"
                      />
                      <span>20% less precipitation</span>
                    </label>
                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:border-sky-400/50">
                      <input
                        type="checkbox"
                        checked={heatChange}
                        onChange={(event) => setHeatChange(event.target.checked)}
                        className="h-4 w-4 accent-[#38BDF8]"
                      />
                      <span>2°C warmer</span>
                    </label>
                  </div>
                </div>
                <p aria-live="polite" className="mt-3 border-t border-sky-400/20 pt-3 text-xs text-[#94A3B8]">
                  <span className="font-bold text-[#F0F9FF]">Planning question: </span>
                  {rainfallChange && heatChange
                    ? 'How might varieties, planting windows, and moisture-saving practices need to change if both conditions occur?'
                    : rainfallChange
                      ? 'Which crops and soil-cover practices can cope with a drier-than-usual season?'
                      : heatChange
                        ? 'Would a warmer season change crop choice or the timing of heat-sensitive field work?'
                        : 'Select a what-if scenario to explore how the historical pattern could shift.'}
                </p>
              </section>

              <PlaceInsights
                place={place}
                rainfallChange={rainfallChange}
                heatChange={heatChange}
              />
            </div>
          </div>

          <LiveWeatherPanel
            latitude={farm.latitude}
            longitude={farm.longitude}
            locationName={farm.name}
          />

          <PlanningComparison
            place={place}
            heatChange={heatChange}
            onOpenPriorities={() => navigateToTab('priorities-rotations')}
          />

          <DecisionDashboard
            farmId={placeId}
            farmName={farm.name}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            weights={dashboardWeights}
            onWeightsChange={setDashboardWeights}
            shocks={dashboardShocks}
            onShocksChange={setDashboardShocks}
            plainEnglish={plainEnglish}
            onPlainEnglishChange={setPlainEnglish}
          />
        </div>
      )}

      {/* Tab 02: Priorities & Rotations */}
      {activeTab === 'priorities-rotations' && (
        <div className="space-y-6">
          <StrategyComparisonSection
            farmId={placeId}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            displayMode="all"
            selectedStrategyId={selectedStrategyId}
            onSelectStrategy={setSelectedStrategyId}
            weights={weights}
            onWeightsChange={setWeights}
            stressScenario={stressScenario}
            onStressScenarioChange={setStressScenario}
            constraints={constraints}
            onConstraintsChange={setConstraints}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
            <p className="text-xs font-semibold text-[#94A3B8]">
              Next step: inspect agronomic stress windows, EcoCrop envelopes, and Tier 2 soil
              verification, or open your printable field brief.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateToTab('soil-agronomy')}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-4 py-2 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#0B1426] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Inspect Soil &amp; Agronomy
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('sources-brief')}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-xs font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Open Sources &amp; Brief
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 03: Soil & Agronomy */}
      {activeTab === 'soil-agronomy' && (
        <div className="space-y-6">
          <AnalyticalSuiteSection
            farmId={placeId}
            selectedMonth={selectedMonth}
            stressScenario={stressScenario}
            weights={weights}
            draftStrategyId={selectedStrategyId}
            recommendedStrategyId={activeFariEvaluation.topStrategy.strategyId}
            onSelectDraftStrategy={setSelectedStrategyId}
            soilFormState={soilFormByFarm[placeId] ?? EMPTY_SOIL_FORM_STATE}
            onSoilFormStateChange={(next) =>
              setSoilFormByFarm((prev) => ({ ...prev, [placeId]: next }))
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5">
            <p className="text-xs font-semibold text-[#94A3B8]">
              Entered soil test inputs are retained per farm while you compare priorities or prepare
              your field brief.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateToTab('priorities-rotations')}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-4 py-2 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#0B1426] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Adjust Priorities &amp; Rotations
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('sources-brief')}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-4 py-2 text-xs font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Review &amp; Print Field Brief
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 04: Sources & Brief */}
      {activeTab === 'sources-brief' && (
        <div className="space-y-6">
          <StrategyComparisonSection
            farmId={placeId}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            displayMode="review"
            selectedStrategyId={selectedStrategyId}
            onSelectStrategy={setSelectedStrategyId}
            weights={weights}
            onWeightsChange={setWeights}
            stressScenario={stressScenario}
            onStressScenarioChange={setStressScenario}
            constraints={constraints}
            onConstraintsChange={setConstraints}
            onEditPriorities={() => navigateToTab('priorities-rotations')}
          />

          <section id="data-sources" className="scroll-mt-28 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
                    Data provenance
                  </p>
                  <h3 className="mt-1 text-lg font-extrabold text-[#F0F9FF]">
                    NASA POWER point data
                  </h3>
                </div>
                <a
                  href={NASA_POWER_API_DOCS}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-sky-300 hover:underline"
                >
                  API docs
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
                NASA Langley Research Center POWER Project, Monthly and Annual API;
                point data for {formatCoordinates(place.latitude, place.longitude)},
                January 2020–December 2025. Product groups listed in the source file:{' '}
                {place.dataSources.join(', ')}.
              </p>
              <dl className="mt-4 grid gap-3 border-t border-sky-400/20 pt-4 text-xs sm:grid-cols-3">
                <div>
                  <dt className="font-bold text-[#F0F9FF]">Air Temperature (2 m) · °C</dt>
                  <dd className="mt-1 text-[#94A3B8]">Monthly mean air temperature at 2 m.</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#F0F9FF]">Daily Rainfall · mm/day</dt>
                  <dd className="mt-1 text-[#94A3B8]">
                    Bias-corrected precipitation averaged by calendar month.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#F0F9FF]">Root-Zone Moisture · 0–100% scaled</dt>
                  <dd className="mt-1 text-[#94A3B8]">
                    Scaled from NASA POWER root-zone wetness index; not a field soil test.
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-[#94A3B8]">
                Point-scale gridded estimates do not describe variation within a farm. Monthly summaries are historical, not current forecasts.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-sky-400/20 bg-[#0D182E] p-5 sm:p-6">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/75">
                  Take the data with you
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[#F0F9FF]">Download and cite</h3>
                <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">
                  Export the original NASA POWER JSON for this point or a CSV of the derived monthly summaries for all five study locations. The CSV includes units, sample counts, bounding boxes, source products, and citation notes.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={place.dataUrl}
                  download={place.fileName}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0B1426] px-3 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#08101F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                  Raw JSON · {place.name}
                </a>
                <button
                  type="button"
                  onClick={downloadMonthlySummaryCsv}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-400 px-3 text-xs font-bold text-[#040811] transition-colors hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                  All 5 locations · CSV
                </button>
              </div>
              <p className="mt-3 break-all font-mono text-[10px] leading-4 text-[#94A3B8]">
                NASA Langley Research Center POWER Project. Monthly and Annual API, 2020–2025.{' '}
                <a href={NASA_POWER_API_DOCS} target="_blank" rel="noreferrer" className="text-sky-300 underline">
                  API documentation
                </a>
                .
              </p>
            </div>
          </section>

          <NasaDataAuditDrawer />

          <FooterAndAttributions />

          <p className="border-t border-sky-400/20 pt-5 text-xs leading-5 text-[#94A3B8]">
            FieldShift is a planning aid prototype. Use NASA POWER alongside local forecasts,
            on-farm measurements, crop calendars, and farmer or extension expertise.
          </p>
        </div>
      )}
    </main>
  );
};
