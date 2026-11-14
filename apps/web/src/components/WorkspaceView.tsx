import React, { Suspense, lazy, useState } from 'react';
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowRight,
  CloudRain,
  Droplets,
  ExternalLink,
  MapPin,
  Printer,
  ThermometerSun,
} from 'lucide-react';
import {
  buildMonthlySummaryCsv,
  getMonthlyTelemetry,
  MONTHLY_SUMMARY_CSV_FILE_NAME,
  FARMS_BY_ID,
  PlaceClimate,
  PlaceId,
  PLACES,
  PLACES_BY_ID,
  StrategyId,
} from '@fieldshift/climate-data';
import { AnalyticalSuiteSection } from './Agronomics/AnalyticalSuiteSection';
import { FooterAndAttributions } from './Common/FooterAndAttributions';
import { StrategyComparisonSection } from './Rotation/StrategyComparisonSection';

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

const LazyFieldMap = lazy(() =>
  import('./FieldMap').then(({ FieldMap }) => ({ default: FieldMap })),
);

const formatNumber = (value: number | null, digits = 1): string =>
  value === null
    ? 'No data'
    : new Intl.NumberFormat('en', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

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
  <div className="min-w-0 rounded-lg border border-[#DDE5D9] bg-[#FBFCFA] p-3">
    <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#698071]">{label}</p>
    <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#263B2E]">{value}</p>
  </div>
);

const AdditionalSignalsPanel: React.FC<{
  selectedPlot: PlaceClimate;
  selectedMonth: number;
}> = ({ selectedPlot, selectedMonth }) => {
  const selectedMonthTelemetry = getMonthlyTelemetry(selectedPlot.id, selectedMonth);
  const supplementalSignals = [
    {
      label: 'Relative humidity',
      value: `${formatNumber(selectedMonthTelemetry.relativeHumidityPct)}%`,
      detail: 'RH2M · 2 m',
    },
    {
      label: 'Solar radiation',
      value: `${formatNumber(selectedMonthTelemetry.solarRadiationMjM2Day)} MJ/m²/day`,
      detail: 'ALLSKY_SFC_SW_DWN · mean',
    },
    {
      label: 'Surface wetness',
      value: formatNumber(selectedMonthTelemetry.gwetTop, 2),
      detail: 'GWETTOP · unitless index',
    },
    {
      label: 'IMERG rainfall estimate',
      value: `${formatNumber(selectedMonthTelemetry.imergPrecipitationMmDay)} mm/day`,
      detail: 'IMERG_PRECTOT · alternate product',
    },
  ];

  return (
    <section
      aria-label={`Additional ${selectedMonthTelemetry.month} climate data for ${selectedPlot.name}`}
      className="mt-5 rounded-xl border border-[#D4DDD0] bg-[#F7FAF5] p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#52715E]">
            NASA POWER · more signals
          </p>
          <h4 className="mt-1 text-sm font-extrabold text-[#17271D]">
            {selectedMonthTelemetry.month} averages
          </h4>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 font-mono text-[9px] font-bold text-[#52715E]">
          {selectedPlot.years.length} years
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {supplementalSignals.map((signal) => (
          <article
            key={signal.label}
            className="min-w-0 rounded-lg border border-[#E2E8DF] bg-white px-3 py-2"
          >
            <p className="text-[9px] font-bold text-[#65766A]">{signal.label}</p>
            <p className="mt-0.5 break-words font-mono text-[13px] font-extrabold tabular-nums text-[#17271D]">
              {signal.value}
            </p>
            <p className="mt-0.5 break-words text-[8px] leading-3 text-[#738278]">
              {signal.detail}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[9px] leading-3 text-[#65766A]">
        Monthly means for {selectedPlot.years[0]}–{selectedPlot.years.at(-1)}. GWETTOP is a
        unitless surface-wetness index, not a soil-water percentage. IMERG is a separate
        precipitation product from PRECTOTCORR.
      </p>
    </section>
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
    <section className="rounded-xl border border-[#D4DDD0] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
            Esri World Imagery · Leaflet
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-[#17271D]">Satellite field view</h3>
          <p className="mt-1 text-xs leading-5 text-[#65766A]">
            NASA POWER point and configured study-area extent for {selectedPlot.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-[#65766A]">
            Historical month
            <select
              aria-label="Select month for map telemetry"
              value={selectedMonth}
              onChange={(event) => onMonthChange(Number(event.target.value))}
              className="h-10 rounded-lg border border-[#C7D5C5] bg-white px-3 text-xs font-semibold normal-case tracking-normal text-[#263B2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              {selectedPlot.monthly.map((month) => (
                <option key={month.month} value={month.month}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <div
            role="group"
            aria-label="Map layer"
            className="inline-flex h-10 rounded-lg border border-[#C7D5C5] bg-[#F3F6F1] p-1"
          >
            {(['satellite', 'street'] as const).map((layer) => (
              <button
                key={layer}
                type="button"
                aria-pressed={mapLayer === layer}
                onClick={() => onMapLayerChange(layer)}
                className={`rounded-md px-3 text-xs font-bold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${
                  mapLayer === layer
                    ? 'bg-white text-[#1B4332] shadow-sm'
                    : 'text-[#536458] hover:text-[#1B4332]'
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
            className="flex h-[420px] items-center justify-center rounded-xl border border-[#D4DDD0] bg-[#F3F6F1] text-sm text-[#536458]"
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
      <p className="mt-3 text-xs leading-5 text-[#65766A]">
        The boundary marks the configured study extent, not a farm boundary. Its color is a
        threshold-based cue for the selected monthly point summary—not a spatial stress map or
        calibrated crop-risk assessment. Display thresholds: GWETROOT &lt; 0.55, PRECTOTCORR
        &gt; 14 mm/day, GWETROOT &gt; 0.93, or T2M &gt; 28.5°C. Satellite tiles © Esri; street
        tiles © OpenStreetMap contributors.
      </p>
    </section>
  );
};

const SeasonalChart: React.FC<{
  place: PlaceClimate;
  rainfallChange: boolean;
  heatChange: boolean;
}> = ({ place, rainfallChange, heatChange }) => {
  const width = 900;
  const height = 320;
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
    <div id="seasonal-analysis" className="scroll-mt-28 overflow-x-auto rounded-xl border border-[#D4DDD0] bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-bold text-[#17271D]">Monthly climate pattern</h3>
          <p className="mt-1 text-xs text-[#65766A]">
            Mean for each calendar month across {place.years[0]}–{place.years.at(-1)}
          </p>
        </div>
        {(rainfallChange || heatChange) && (
          <span className="rounded-full bg-[#FFF2DA] px-2.5 py-1 font-mono text-[10px] font-bold text-[#815B18]">
            WHAT-IF SCENARIO
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto min-w-[660px] w-full"
        role="img"
        aria-label={`Monthly NASA POWER historical summary for ${place.name}: precipitation columns in millimeters and 2-meter temperature line in degrees Celsius${rainfallChange ? ', with rainfall reduced by 20 percent' : ''}${heatChange ? ', with temperature increased by 2 degrees Celsius' : ''}`}
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = top + chartHeight * fraction;
          const value = Math.round(rainAxisMax * (1 - fraction));
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="#E8EEE7" />
              <text
                x={left - 10}
                y={y + 3}
                textAnchor="end"
                fill="#77867B"
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
          fill="#65766A"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          mm / month
        </text>
        {temperaturePath && (
          <path
            d={temperaturePath}
            fill="none"
            stroke="#C45A37"
            strokeWidth="3"
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
                  x={x - 13}
                  y={top + chartHeight - barHeight}
                  width="26"
                  height={barHeight}
                  rx="3"
                  fill={rainfallChange ? '#D8A24C' : '#81B4D3'}
                >
                  <title>{`${month}: ${formatNumber(value, 0)} mm mean monthly precipitation${rainfallChange ? ' in the 20% less rainfall scenario' : ''}`}</title>
                </rect>
              )}
              {y !== null && (
                <circle cx={x} cy={y} r="3.5" fill="#C45A37" stroke="white" strokeWidth="1.5">
                  <title>{`${month}: ${formatNumber(temperatureValue, 1)}°C mean 2-meter temperature${heatChange ? ' in the +2°C scenario' : ''}`}</title>
                </circle>
              )}
              <text
                x={x}
                y={height - 13}
                textAnchor="middle"
                fill="#65766A"
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
          fill="#A64A31"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          {maximumTemperature}°
        </text>
        <text
          x={width - right + 8}
          y={top + chartHeight}
          fill="#A64A31"
          fontFamily="JetBrains Mono, monospace"
          fontSize="9"
        >
          {minimumTemperature}°
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 px-2 text-xs text-[#536458]">
        <span className="inline-flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-sm ${rainfallChange ? 'bg-[#D8A24C]' : 'bg-[#81B4D3]'}`}
          />
          Mean monthly precipitation (mm)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-[#C45A37]" />
          Mean T2M ({heatChange ? '+2°C scenario' : '°C'})
        </span>
        <span className="ml-auto text-[#77867B]">Temperature line uses right-side °C scale</span>
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

  return (
    <section aria-labelledby="season-readout-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
            Season readout
          </p>
          <h3 id="season-readout-title" className="mt-1 text-lg font-extrabold text-[#17271D]">
            What stands out for {place.name}?
          </h3>
        </div>
        <span className="hidden text-xs text-[#77867B] sm:block">Summary of past seasons</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-[#E2E8DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#A64A31]">
            <ThermometerSun className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold">Warmest monthly average</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {formatNumber(warmestTemperature)}°C
          </p>
          <p className="mt-1 text-xs text-[#65766A]">{warmestMonth.label} mean T2M</p>
        </article>
        <article className="rounded-xl border border-[#E2E8DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#32658E]">
            <CloudRain className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold">Wettest month</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {formatNumber(scenarioRain, 0)} mm
          </p>
          <p className="mt-1 text-xs text-[#65766A]">
            {wettestMonth.label} average monthly precipitation
          </p>
        </article>
        <article className="rounded-xl border border-[#E2E8DF] bg-white p-4">
          <div className="flex items-center gap-2 text-[#39734A]">
            <Droplets className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold">Lowest root-zone wetness</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {formatNumber(driestRootMonth.meanRootWetnessIndex, 2)}
          </p>
          <p className="mt-1 text-xs text-[#65766A]">{driestRootMonth.label} unitless index</p>
        </article>
      </div>
    </section>
  );
};

const PlanningComparison: React.FC<{
  place: PlaceClimate;
  heatChange: boolean;
}> = ({ place, heatChange }) => {
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
      evidence: `Root-zone wetness is lowest in ${lowestRootWetnessMonth.label}; rainfall is lowest in ${driestMonth.label} in this six-year summary.`,
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
    <section aria-labelledby="planning-comparison-title">
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
          From climate signal to planting conversation
        </p>
        <h3 id="planning-comparison-title" className="mt-1 text-lg font-extrabold text-[#17271D]">
          Three options to compare with the farmer
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#65766A]">
          These are discussion prompts, not ranked recommendations. The source data has no crop calendar,
          field soil test, irrigation record, or market information.
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {comparisons.map((item, index) => (
          <article key={item.label} className="rounded-xl border border-[#D4DDD0] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                Option 0{index + 1}
              </span>
              <span className="rounded-full bg-[#F0F5ED] px-2.5 py-1 text-[10px] font-bold text-[#3A6547]">
                {item.label}
              </span>
            </div>
            <h4 className="mt-3 text-base font-extrabold text-[#17271D]">{item.title}</h4>
            <p className="mt-3 border-l-2 border-[#87A985] pl-3 text-xs leading-5 text-[#536458]">
              <span className="font-bold text-[#263B2E]">Data signal: </span>
              {item.evidence}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#65766A]">
              <span className="font-bold text-[#263B2E]">Discuss: </span>
              {item.prompt}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

interface WorkspaceViewProps {
  plannerStep: number;
  onPlannerStepChange: (step: number) => void;
}

const PLANNER_STEPS = [
  { title: 'Choose a farm', prompt: 'Start with the field and its real context.' },
  { title: 'Read the season', prompt: 'See the historical climate signals behind this farm’s planning challenge.' },
  { title: 'Set priorities', prompt: 'Tell FieldShift what matters and test a climate stress scenario.' },
  { title: 'Compare rotations', prompt: 'Compare the baseline with two adaptive options, then choose a draft.' },
  { title: 'Review the plan', prompt: 'Check the trade-offs and prepare a field brief for local review.' },
];

type EvidencePanel = 'climate' | 'seasonal' | 'agronomy' | 'sources';

const EVIDENCE_PANELS: ReadonlyArray<{ id: EvidencePanel; title: string }> = [
  { id: 'climate', title: 'Climate & map' },
  { id: 'seasonal', title: 'Season outlook' },
  { id: 'agronomy', title: 'Soil & crop checks' },
  { id: 'sources', title: 'Sources & help' },
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ plannerStep, onPlannerStepChange }) => {
  const [placeId, setPlaceId] = useState<PlaceId>('nueva-ecija');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [mapLayer, setMapLayer] = useState<MapLayer>('satellite');
  const [rainfallChange, setRainfallChange] = useState(false);
  const [heatChange, setHeatChange] = useState(false);
  const [evidencePanel, setEvidencePanel] = useState<EvidencePanel>('climate');
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId | null>(null);
  const place = PLACES_BY_ID[placeId];
  const farm = FARMS_BY_ID[placeId];
  const averageMonthlyTemperature = place.meanTemperatureC;
  const averageRootWetness = place.meanRootWetnessIndex;
  const annualPrecipitation = place.meanAnnualPrecipitationMm === null
    ? null
    : place.meanAnnualPrecipitationMm * (rainfallChange ? 0.8 : 1);
  const scenarioTemperature = averageMonthlyTemperature === null
    ? null
    : averageMonthlyTemperature + (heatChange ? 2 : 0);
  const goToStep = (nextStep: number) => {
    onPlannerStepChange(nextStep);
    document.getElementById('workspace-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const selectFarm = (nextPlaceId: PlaceId) => {
    setPlaceId(nextPlaceId);
    setSelectedStrategyId(null);
  };

  return (
    <main id="field-demo" className="mx-auto max-w-[1280px] space-y-7 px-4 py-7 sm:px-6 sm:py-9">
      <section id="workspace-content" aria-live="polite" className="scroll-mt-24 flex flex-col gap-2 border-b border-[#E4E9E2] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#698071]">Field workspace · Step {String(plannerStep + 1).padStart(2, '0')} of {PLANNER_STEPS.length}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#1B2B20] sm:text-3xl">{PLANNER_STEPS[plannerStep].title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68766C] sm:text-sm">{PLANNER_STEPS[plannerStep].prompt}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-[#E2E8DF] bg-white px-3 py-1.5 text-[9px] font-semibold text-[#758178]">Historical context · farmer-reviewed decisions</span>
      </section>
      <div className={`planner-stage ${plannerStep === 0 ? 'planner-stage-active step-one space-y-5' : 'hidden'}`}>
      <section id="field-sites" className="scroll-mt-28 flex flex-col gap-5 border-b border-[#E2E8DF] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E] sm:text-xs">
            Farm context · select one of five representative locations
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#17271D] sm:text-3xl">
            Choose a study farm
          </h2>
          <p className="mt-1 text-sm text-[#536458]">
            Selection updates strategy scores, climate context, and the map.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Select a farm location"
          className="grid grid-cols-2 gap-1 rounded-xl border border-[#D7E0D5] bg-[#F3F6F1] p-1 sm:grid-cols-5"
        >
          {PLACES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={placeId === item.id}
              onClick={() => selectFarm(item.id)}
              className={`min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] sm:px-3.5 sm:text-sm ${
                placeId === item.id
                  ? 'bg-white text-[#1B4332] shadow-sm'
                  : 'text-[#536458] hover:text-[#1B4332]'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section aria-label={`Field context for ${farm.name}`} className="grid gap-3 rounded-2xl border border-[#D5DED2] bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
        <div className="rounded-lg bg-[#F4F7F1] p-3 lg:col-span-2">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#698071]">Selected field context</p>
          <h3 className="mt-1 text-lg font-extrabold text-[#17271D]">{farm.name}</h3>
          <p className="mt-0.5 text-xs text-[#536458]">{farm.locationLabel}</p>
        </div>
        <FarmFact label="Coordinates" value={`${Math.abs(farm.latitude).toFixed(3)}°${farm.latitude < 0 ? 'S' : 'N'}, ${Math.abs(farm.longitude).toFixed(3)}°${farm.longitude < 0 ? 'W' : 'E'}`} />
        <FarmFact label="Elevation · slope" value={`${farm.elevationM} m · ${farm.slopePct}%`} />
        <FarmFact label="Soil context" value={farm.soilType} />
        <div className="rounded-lg border border-[#DDE5D9] bg-white p-3 sm:col-span-2 lg:col-span-5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#698071]">Baseline practice</p>
          <p className="mt-1 text-xs font-semibold text-[#263B2E]">{farm.baselineFarmingSystem}</p>
        </div>
      </section>
      </div>

      <div className={`planner-stage ${plannerStep === 2 || plannerStep === 3 || plannerStep === 4 ? `planner-stage-active step-${plannerStep + 1}` : 'hidden'}`}>
      <StrategyComparisonSection
        farmId={placeId}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        displayMode={plannerStep === 2 ? 'controls' : plannerStep === 3 ? 'compare' : 'review'}
        selectedStrategyId={selectedStrategyId}
        onSelectStrategy={setSelectedStrategyId}
      />
      </div>

      <div className={`planner-stage ${plannerStep === 1 ? 'planner-stage-active step-two space-y-6' : 'hidden'}`}>
      <section aria-label="Decision this demo supports" className="grid gap-3 rounded-2xl border border-[#223B30] bg-[#10251B] p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#D4E6A7]">The farm decision</p>
          <h2 className="mt-1 text-lg font-extrabold sm:text-xl">Which rotation is worth discussing for this field and season?</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-white/75">Use past climate records to compare crop options against the farmer’s priorities. Check local weather before scheduling field work, and review any plan with local agricultural advisers.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-[#D4E6A7]/30 bg-white/[0.06] px-3 py-2 font-mono text-[10px] font-bold text-[#E5F0DA]">OBSERVE → COMPARE → VERIFY</span>
      </section>
      <nav aria-label="Evidence sections" className="flex gap-2 overflow-x-auto rounded-xl border border-[#D8E2D5] bg-white p-2">
        {EVIDENCE_PANELS.map((panel) => (
          <button key={panel.id} type="button" aria-pressed={evidencePanel === panel.id} onClick={() => setEvidencePanel(panel.id)} className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${evidencePanel === panel.id ? 'bg-[#1B4332] text-white' : 'text-[#516357] hover:bg-[#F1F5EF]'}`}>
            {panel.title}
          </button>
        ))}
      </nav>

      <div className={evidencePanel === 'climate' ? 'space-y-5' : 'hidden'}>
      <div className="flex flex-col gap-1 border-b border-[#E2E8DF] pb-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E] sm:text-xs">
          NASA POWER · historical monthly point data · 2020–2025
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-[#17271D] sm:text-3xl">Seasonal climate profile</h2>
        <p className="text-sm text-[#536458]">Explore six years of historical monthly patterns for this study location.</p>
      </div>

      <div id="field-map" className="scroll-mt-28 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-[#D4DDD0] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3EFDF] text-[#2D6A4F]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
                Selected location
              </p>
              <h3 className="mt-0.5 text-xl font-extrabold text-[#17271D]">{place.name}</h3>
              <p className="mt-0.5 text-sm text-[#65766A]">{place.region}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#F5F8F3] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#738278]">
                Air temp
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold tabular-nums text-[#17271D]">
                {formatNumber(scenarioTemperature)}°
              </p>
              <p className="text-[10px] text-[#65766A]">T2M mean · °C</p>
            </div>
            <div className="rounded-lg bg-[#F5F8F3] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#738278]">
                Rainfall
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold tabular-nums text-[#17271D]">
                {formatNumber(annualPrecipitation, 0)}
              </p>
              <p className="text-[10px] text-[#65766A]">mm / year</p>
            </div>
            <div className="rounded-lg bg-[#F5F8F3] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#738278]">
                Root wetness
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold tabular-nums text-[#17271D]">
                {formatNumber(averageRootWetness, 2)}
              </p>
              <p className="text-[10px] text-[#65766A]">unitless index</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#738278]">
            Summary values are six-year monthly averages. Soil wetness is a modeled index, not soil-water percentage.
          </p>
          <AdditionalSignalsPanel selectedPlot={place} selectedMonth={selectedMonth} />
        </section>

        {plannerStep === 1 && evidencePanel === 'climate' && (
          <FieldMapPanel
            selectedPlot={place}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            mapLayer={mapLayer}
            onMapLayerChange={setMapLayer}
            onSelectPlot={selectFarm}
          />
        )}
      </div>

      </div>

      <div className={evidencePanel === 'agronomy' ? 'space-y-6' : 'hidden'}>
      <AnalyticalSuiteSection
        farmId={placeId}
        selectedMonth={selectedMonth}
      />
      </div>

      <div className={evidencePanel === 'seasonal' ? 'space-y-6' : 'hidden'}>
      <SeasonalChart
        place={place}
        rainfallChange={rainfallChange}
        heatChange={heatChange}
      />

      <section className="rounded-xl border border-[#D4DDD0] bg-[#F7FAF5] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
              Explore a what-if
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-[#17271D]">Adjust the historical baseline</h3>
            <p className="mt-1 text-sm leading-6 text-[#536458]">
              These hypothetical changes adjust only the displayed rainfall and temperature averages; root-zone wetness is not re-simulated. They are not forecasts or climate projections.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#D7E0D5] bg-white px-3 text-xs font-semibold text-[#263B2E]">
              <input
                type="checkbox"
                checked={rainfallChange}
                onChange={(event) => setRainfallChange(event.target.checked)}
                className="h-4 w-4 accent-[#32658E]"
              />
              <span>20% less precipitation</span>
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#D7E0D5] bg-white px-3 text-xs font-semibold text-[#263B2E]">
              <input
                type="checkbox"
                checked={heatChange}
                onChange={(event) => setHeatChange(event.target.checked)}
                className="h-4 w-4 accent-[#C45A37]"
              />
              <span>2°C warmer</span>
            </label>
          </div>
        </div>
        <p aria-live="polite" className="mt-4 border-t border-[#DFE7DD] pt-4 text-sm text-[#536458]">
          <span className="font-bold text-[#1B4332]">Planning question: </span>
          {rainfallChange && heatChange
            ? 'How might varieties, planting windows, and moisture-saving practices need to change if both conditions occur?'
            : rainfallChange
              ? 'Which crops and soil-cover practices can cope with a drier-than-usual season?'
              : heatChange
                ? 'Would a warmer season change crop choice or the timing of heat-sensitive field work?'
                : 'Select a what-if scenario to explore how the historical pattern could shift.'}
        </p>
      </section>

      <PlaceInsights place={place} rainfallChange={rainfallChange} heatChange={heatChange} />

      <PlanningComparison place={place} heatChange={heatChange} />
      </div>

      <div className={evidencePanel === 'sources' ? 'space-y-6' : 'hidden'}>
      <section id="data-sources" className="scroll-mt-28 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[#D4DDD0] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
                Data provenance
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-[#17271D]">
                NASA POWER point data
              </h3>
            </div>
            <a
              href={NASA_POWER_API_DOCS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:underline"
            >
              API docs
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#536458]">
            NASA Langley Research Center POWER Project, Monthly and Annual API;
            point data for {place.latitude.toFixed(3)}° N, {place.longitude.toFixed(3)}° E,
            January 2020–December 2025. Product groups listed in the source file:{' '}
            {place.dataSources.join(', ')}.
          </p>
          <dl className="mt-4 grid gap-3 border-t border-[#E6ECE4] pt-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="font-bold text-[#263B2E]">T2M · °C</dt>
              <dd className="mt-1 text-[#65766A]">Monthly mean air temperature at 2 m.</dd>
            </div>
            <div>
              <dt className="font-bold text-[#263B2E]">PRECTOTCORR · mm/day</dt>
              <dd className="mt-1 text-[#65766A]">
                Multiplied by calendar days, then averaged by month.
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[#263B2E]">GWETROOT · unitless</dt>
              <dd className="mt-1 text-[#65766A]">
                NASA root-zone wetness index; not a field soil test.
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-[#65766A]">
            Point-scale gridded estimates do not describe variation within a farm. Monthly summaries are historical, not current forecasts.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#F7FAF5] p-5 sm:p-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
              Take the data with you
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-[#17271D]">Download and cite</h3>
            <p className="mt-2 text-sm leading-6 text-[#536458]">
              Export the original NASA POWER JSON for this point or a CSV of the derived monthly summaries for all three places. The CSV includes units, sample counts, bounding boxes, source products, and citation notes.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={place.dataUrl}
              download={place.fileName}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#1B4332] transition-colors hover:bg-[#EEF5EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Raw JSON · {place.name}
            </a>
            <button
              type="button"
              onClick={downloadMonthlySummaryCsv}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1B4332] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              All places · CSV
            </button>
          </div>
          <p className="mt-3 break-all font-mono text-[10px] leading-4 text-[#738278]">
            NASA Langley Research Center POWER Project. Monthly and Annual API, 2020–2025.{' '}
            <a href={NASA_POWER_API_DOCS} target="_blank" rel="noreferrer" className="underline">
              API documentation
            </a>
            .
          </p>
        </div>
      </section>

      <FooterAndAttributions />

      <p className="border-t border-[#E2E8DF] pt-5 text-xs leading-5 text-[#65766A]">
        FieldShift is a planning aid prototype. Use NASA POWER alongside local forecasts,
        on-farm measurements, crop calendars, and farmer or extension expertise.
      </p>
      </div>

      </div>

      <nav aria-label="Plan navigation" className="sticky bottom-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CAD8C9] bg-[#F8FAF7]/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:p-4">
        <button type="button" disabled={plannerStep === 0} onClick={() => goToStep(plannerStep - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C8D5C7] bg-white px-4 text-xs font-bold text-[#33493A] transition-colors hover:bg-[#F0F5EE] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <p className="hidden text-xs font-semibold text-[#5C6D60] sm:block">{plannerStep < 4 ? `Next: ${PLANNER_STEPS[plannerStep + 1].title}` : 'Your plan is ready for local review.'}</p>
        {plannerStep < 4 ? (
          <button type="button" onClick={() => goToStep(plannerStep + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]">
            {plannerStep === 0 ? 'Read this farm’s season' : plannerStep === 1 ? 'Set my priorities' : plannerStep === 2 ? 'Compare rotations' : 'Review my draft plan'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={() => window.print()} title="Print the detailed A4 field-planning report" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-xs font-extrabold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]">
            <Printer className="h-4 w-4" aria-hidden="true" /> Print detailed field report
          </button>
        )}
      </nav>
    </main>
  );
};
