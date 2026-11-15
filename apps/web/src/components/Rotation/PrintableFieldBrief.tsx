import React from 'react';
import { createPortal } from 'react-dom';
import type {
  AdjustedClimateContext,
  CfiMonthWindow,
  CropStrategy,
  FarmProfile,
  FariScoreBreakdown,
  FieldConstraints,
  PriorityWeights,
  StrategyId,
} from '@fieldshift/climate-data';
import type { MonthlyTelemetry, PlaceClimate } from '@fieldshift/climate-data';

interface PrintableFieldBriefProps {
  farm: FarmProfile;
  place: PlaceClimate;
  climate: AdjustedClimateContext;
  monthlyTelemetry: MonthlyTelemetry;
  strategyScores: FariScoreBreakdown[];
  strategyById: Record<StrategyId, CropStrategy>;
  selectedStrategy: CropStrategy;
  selectedScore: FariScoreBreakdown;
  hasFarmerChoice: boolean;
  weights: PriorityWeights;
  constraints: FieldConstraints;
  cfiWindows: CfiMonthWindow[];
  droughtAlert?: string;
}

const pct = (value: number): string => `${Math.round(value * 100)}%`;
const fixed = (value: number, digits = 2): string => value.toFixed(digits);

const PillarValue: React.FC<{ value: number }> = ({ value }) => (
  <span>{fixed(value * 100, 0)}</span>
);

const Explanation: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div className="brief-explanation">
    <h4>{title}</h4>
    <p>{text}</p>
  </div>
);

export const PrintableFieldBrief: React.FC<PrintableFieldBriefProps> = ({
  farm,
  place,
  climate,
  monthlyTelemetry,
  strategyScores,
  strategyById,
  selectedStrategy,
  selectedScore,
  hasFarmerChoice,
  weights,
  constraints,
  cfiWindows,
  droughtAlert,
}) => {
  const generatedAt = new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date());
  const bbox = place.extent.bbox.map((coordinate) => coordinate.toFixed(3)).join(', ');

  const briefContent = (
    <article id="field-brief-print" className="print-brief-root" aria-label="Printable scientific field planning brief">
      <header className="brief-cover">
        <div className="brief-brand-row">
          <span className="brief-brand">FIELDSHIFT <span>· NASA EARTH DATA FOR FARM DECISIONS</span></span>
          <span className="brief-document-type">FIELD PLANNING BRIEF · PROTOTYPE</span>
        </div>
        <p className="brief-kicker">Decision record · {generatedAt}</p>
        <h1>{farm.name}</h1>
        <p className="brief-location">{farm.locationLabel} · {farm.region}, {farm.country}</p>
        <div className="brief-facts">
          <div><span>Study point</span><strong>{Math.abs(farm.latitude).toFixed(3)}°{farm.latitude < 0 ? 'S' : 'N'}, {Math.abs(farm.longitude).toFixed(3)}°{farm.longitude < 0 ? 'W' : 'E'}</strong></div>
          <div><span>Elevation · configured context</span><strong>{fixed(farm.elevationM, 1)} m · {fixed(farm.slopePct, 1)}% slope</strong></div>
          <div><span>Soil context</span><strong>{farm.soilType}</strong></div>
          <div><span>Historical period</span><strong>Jan 2020 – Dec 2025</strong></div>
        </div>
        {farm.isBenchmarkPlot && <p className="brief-note">Benchmark context: {farm.benchmarkNote ?? 'Representative regional benchmark; not a surveyed private parcel.'}</p>}
      </header>

      <section className="brief-callout">
        <div>
          <p className="brief-kicker">Planning question</p>
          <h2>Which rotation is worth discussing for this field and season?</h2>
          <p>This report records a comparison of the configured crop strategies against historical climate context and farmer-selected priorities. It is decision support, not a planting prescription.</p>
        </div>
        <div className="brief-score">
          <span>{hasFarmerChoice ? 'Farmer-selected draft' : 'Leading candidate · not selected'}</span>
          <strong>{fixed(selectedScore.fariScore, 1)}<small> / 100</small></strong>
          <b>Rank #{selectedScore.rank} · {selectedStrategy.id}</b>
        </div>
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>01</span><div><h2>Field context & decision settings</h2><p>What was selected for this comparison run.</p></div></div>
        <div className="brief-two-column">
          <div>
            <h3>Configured field context</h3>
            <dl className="brief-definition-grid">
              <dt>Baseline system</dt><dd>{farm.baselineFarmingSystem}</dd>
              <dt>Study-area bounding box</dt><dd>[{bbox}] · west, south, east, north</dd>
              <dt>Primary concerns</dt><dd>{farm.primaryConcerns.join('; ')}</dd>
              <dt>Map extent</dt><dd>Configured regional study extent; not a surveyed parcel boundary.</dd>
            </dl>
          </div>
          <div>
            <h3>Farmer priorities & constraints</h3>
            <table className="brief-table brief-compact">
              <thead><tr><th>Priority weight</th><th>Normalized</th></tr></thead>
              <tbody>
                <tr><td>Water alignment (W)</td><td>{pct(weights.water)}</td></tr>
                <tr><td>Erosion protection (E)</td><td>{pct(weights.erosion)}</td></tr>
                <tr><td>Nutrient cycling (N)</td><td>{pct(weights.nutrients)}</td></tr>
                <tr><td>Market / income (M)</td><td>{pct(weights.market)}</td></tr>
              </tbody>
            </table>
            <p className="brief-small"><b>Constraints:</b> {constraints.rainfedOnly ? 'Rainfed only' : 'No rainfed-only constraint'} · {constraints.manualToolsOnly ? 'Manual tools only' : 'No manual-tools-only constraint'} · {constraints.fastCashNeeded ? 'Fast cash prioritized' : 'No fast-cash constraint'}</p>
          </div>
        </div>
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>02</span><div><h2>Climate evidence & scenario</h2><p>Historical monthly averages and the modeled comparison input.</p></div></div>
        <div className="brief-highlight-grid">
          <div><span>Selected month</span><strong>{climate.monthLabel}</strong></div>
          <div><span>Scenario</span><strong>{climate.scenarioLabel}</strong></div>
          <div><span>Air temperature · mean</span><strong>{fixed(climate.baselineTempC, 1)} → {fixed(climate.adjustedTempC, 1)} °C</strong></div>
          <div><span>Daily rainfall · mean</span><strong>{fixed(climate.baselineDailyRainfallMm, 2)} → {fixed(climate.adjustedDailyRainfallMm, 2)} mm/day</strong></div>
          <div><span>Root-Zone Moisture</span><strong>{climate.baselineRootZoneMoisturePct}% → {climate.adjustedRootZoneMoisturePct}%</strong></div>
          <div><span>Surface Moisture</span><strong>{climate.baselineSurfaceMoisturePct}% → {climate.adjustedSurfaceMoisturePct}%</strong></div>
        </div>
        <table className="brief-table">
          <thead><tr><th>Historical signal · {monthlyTelemetry.month}</th><th>Value</th><th>Units / meaning</th></tr></thead>
          <tbody>
            <tr><td>Air Temperature</td><td>{fixed(monthlyTelemetry.airTempCelsius, 2)}</td><td>°C · 2 m air-temperature mean</td></tr>
            <tr><td>Daily Rainfall</td><td>{fixed(monthlyTelemetry.dailyRainfallMm, 2)}</td><td>mm/day · corrected precipitation mean</td></tr>
            <tr><td>GPM IMERG Rainfall</td><td>{fixed(monthlyTelemetry.imergRainfallMmDay, 2)}</td><td>mm/day · separate GPM precipitation product</td></tr>
            <tr><td>Root-Zone Moisture</td><td>{monthlyTelemetry.rootZoneMoisturePct}%</td><td>0–100% scaled NASA POWER root-zone wetness · not a field probe reading</td></tr>
            <tr><td>Surface Moisture</td><td>{monthlyTelemetry.surfaceSoilMoisturePct}%</td><td>0–100% scaled NASA POWER surface wetness · not a field measurement</td></tr>
            <tr><td>Relative Humidity</td><td>{fixed(monthlyTelemetry.relativeHumidityPct, 1)}</td><td>% · relative humidity at 2 m</td></tr>
            <tr><td>Solar Radiation</td><td>{fixed(monthlyTelemetry.solarRadiationMj, 2)}</td><td>MJ/m²/day · all-sky surface shortwave radiation</td></tr>
            <tr><td>Historical storm-day mean</td><td>{fixed(climate.stormDaysGe14Mm, 1)}</td><td>Days/month at or above 14 mm/day · 2020–2025 daily summary</td></tr>
            <tr><td>Historical dry-day mean</td><td>{fixed(climate.dryDaysLt3Mm, 1)}</td><td>Days/month below 3 mm/day · 2020–2025 daily summary</td></tr>
          </tbody>
        </table>
        <p className="brief-note"><b>Scenario transparency:</b> {climate.scenarioDescription} Scenario-adjusted values are modeled sensitivity inputs. The underlying monthly measurements remain historical climatology; this is not a current weather forecast.</p>
        {droughtAlert && <p className="brief-alert"><b>Water-stress advisory:</b> {droughtAlert}</p>}
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>03</span><div><h2>Rotation comparison & FARI scoring</h2><p>All three configured strategies scored with the same climate inputs and weights.</p></div></div>
        <div className="brief-formula"><b>FARI</b> = 100 × (w<sub>W</sub>W + w<sub>E</sub>E + w<sub>N</sub>N + w<sub>M</sub>M)<br /><span>Each pillar and normalized weight is constrained to 0–1; weights sum to 1. The score is a relative suitability index, not a yield probability.</span></div>
        <table className="brief-table brief-score-table">
          <thead><tr><th>Rank · ID</th><th>Strategy / crop sequence</th><th>FARI</th><th>Δ vs S1</th><th>W</th><th>E</th><th>N</th><th>M</th></tr></thead>
          <tbody>{strategyScores.map((score) => {
            const strategy = strategyById[score.strategyId];
            return <tr key={score.strategyId} className={score.strategyId === selectedStrategy.id ? 'brief-selected-row' : undefined}>
              <td>#{score.rank} · {score.strategyId}{score.strategyId === selectedStrategy.id ? ' · DRAFT' : ''}</td>
              <td><b>{strategy.name}</b><br />{strategy.crops.join(' → ')}</td>
              <td><b>{fixed(score.fariScore, 1)}</b></td><td>{score.deltaVsBaseline > 0 ? '+' : ''}{fixed(score.deltaVsBaseline, 1)}</td>
              <td><PillarValue value={score.pillars.water} /></td><td><PillarValue value={score.pillars.erosion} /></td><td><PillarValue value={score.pillars.nutrients} /></td><td><PillarValue value={score.pillars.market} /></td>
            </tr>;
          })}</tbody>
        </table>
        <p className="brief-small"><b>Pillar meaning:</b> W = root-depth and water-demand alignment against wetness and drought stress; E = slope and rainfall exposure moderated by canopy, roots, and contour cover; N = modeled biological N contribution and residue mulch; M = price index, cash turnaround, forage, and configured market access. See the methodology section for equations.</p>
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>04</span><div><h2>Seasonal risk window · next 90 climatological days</h2><p>Historical 2020–2025 monthly event frequencies, not a day-specific forecast.</p></div></div>
        <table className="brief-table">
          <thead><tr><th>Month</th><th>Screening result</th><th>Storm days ≥14 mm</th><th>Heat days ≥33 °C</th><th>Dry days &lt;3 mm</th><th>Root-Zone Moisture</th></tr></thead>
          <tbody>{cfiWindows.map((window) => <tr key={window.month}>
            <td><b>{window.monthLabel}</b></td><td>{window.badgeText}</td><td>{fixed(window.stormDaysGe14Mm, 1)}</td><td>{fixed(window.heatStressDaysGe33C, 1)}</td><td>{fixed(window.dryDaysLt3Mm, 1)}</td><td>{window.rootZoneMoisturePct}%</td>
          </tr>)}</tbody>
        </table>
        <p className="brief-note"><b>Use:</b> Treat the color class as a historical screening signal. Check a local 24-hour forecast and crop-specific extension guidance before any planting, flower-induction, or foliar-application decision.</p>
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>05</span><div><h2>Selected draft · agronomic review record</h2><p>{selectedStrategy.id} · {selectedStrategy.shortLabel} · {selectedStrategy.crops.join(' → ')}</p></div></div>
        <div className="brief-highlight-grid">
          <div><span>Root depth parameter</span><strong>{selectedStrategy.rootDepthCm} cm</strong></div>
          <div><span>Modeled N-fixation parameter</span><strong>{selectedStrategy.nFixKgHa} kg N/ha</strong></div>
          <div><span>Canopy closure parameter</span><strong>{selectedStrategy.canopyClosureDays} days</strong></div>
          <div><span>Cash turnaround parameter</span><strong>{selectedStrategy.cashTurnaroundDays} days</strong></div>
          <div><span>Water demand index</span><strong>{fixed(selectedStrategy.waterDemand, 2)}</strong></div>
          <div><span>Forage value index</span><strong>{fixed(selectedStrategy.forageValue, 2)}</strong></div>
        </div>
        <h3>Configured cultivar options · availability not verified</h3>
        <table className="brief-table">
          <thead><tr><th>Crop</th><th>Cultivar / option</th><th>Type</th><th>Maturity</th><th>Seed access note</th></tr></thead>
          <tbody>{selectedStrategy.cultivars.map((cultivar) => <tr key={`${cultivar.crop}-${cultivar.name}`}><td>{cultivar.crop}</td><td><b>{cultivar.name}</b><br />{cultivar.traitHighlight}</td><td>{cultivar.type}</td><td>{cultivar.maturityDays} days</td><td>{cultivar.seedSourceNote}</td></tr>)}</tbody>
        </table>
        <div className="brief-explanation-grid">
          <Explanation title="1 · Why this strategy was suggested" text={selectedStrategy.explanations.whySuggested} />
          <Explanation title="2 · Supporting evidence" text={selectedStrategy.explanations.supportingEvidence} />
          <Explanation title="3 · Expected benefits" text={selectedStrategy.explanations.expectedBenefits} />
          <Explanation title="4 · Data gaps" text={selectedStrategy.explanations.dataGaps} />
          <Explanation title="5 · Local review alerts" text={selectedStrategy.explanations.localReviewAlerts} />
        </div>
        <p className="brief-note"><b>Forage context:</b> {selectedStrategy.forageSummary}</p>
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>06</span><div><h2>12-month crop sequence & ground-cover schedule</h2><p>Configured strategy calendar; ground-cover percentages are modeled estimates.</p></div></div>
        {strategyScores.map((score) => {
          const strategy = strategyById[score.strategyId];
          return <div className="brief-calendar" key={strategy.id}>
            <h3>{strategy.id} · {strategy.shortLabel}{strategy.id === selectedStrategy.id ? ' · DRAFT' : ''}</h3>
            <table className="brief-table brief-calendar-table">
              <thead><tr><th>Month</th><th>Crop stage</th><th>Ground cover</th><th>Pest-break flag</th></tr></thead>
              <tbody>{strategy.monthlySchedule.map((month) => <tr key={`${strategy.id}-${month.month}`}><td>{month.monthLabel}</td><td>{month.cropLabel}</td><td>{month.groundCoverPct}% · modeled</td><td>{month.pestBreakActive ? 'Planned interval' : 'None flagged'}</td></tr>)}</tbody>
            </table>
          </div>;
        })}
      </section>

      <section className="brief-section">
        <div className="brief-section-heading"><span>07</span><div><h2>Before planting · local verification checklist</h2><p>Use this record to guide a conversation, not to bypass one.</p></div></div>
        <ol className="brief-checklist">
          <li><b>Confirm the field:</b> verify the actual parcel boundary, slope, drainage, soil texture, and access; the plotted coordinates and extent are representative study context.</li>
          <li><b>Ground-truth soil:</b> obtain a current local soil test for pH, organic matter, and available N-P-K. NASA orbital data do not directly measure these values.</li>
          <li><b>Check resources:</b> confirm seed/cutting availability, labor, equipment, water supply, buyer or household use, and crop-calendar fit with the farmer and local extension officer.</li>
          <li><b>Check near-term conditions:</b> consult local forecasts and field observations before spraying, irrigation, or planting.</li>
          <li><b>Review assumptions:</b> discuss the selected strategy’s stated data gaps and risk alerts with the Municipal Agriculture Office (MAO), cooperative, or certified extension adviser.</li>
        </ol>
      </section>

      <section className="brief-section brief-method">
        <div className="brief-section-heading"><span>08</span><div><h2>Methods, sources & limits</h2><p>Reproducibility and interpretation notes for this prototype run.</p></div></div>
        <dl className="brief-definition-grid">
          <dt>Primary climate source</dt><dd>NASA Langley Research Center POWER Project · monthly point series · {place.years[0]}–{place.years.at(-1)} · {place.dataSources.join(', ')}</dd>
          <dt>Precipitation context</dt><dd>NASA POWER PRECTOTCORR and GPM IMERG monthly precipitation are shown as separate products; daily event summaries support the historical 90-day screening calendar.</dd>
          <dt>Data status</dt><dd>Static historical baseline and deterministic derived/model outputs. No live satellite scene, parcel-level sensor feed, or current forecast is claimed in this brief.</dd>
          <dt>Spatial limits</dt><dd>NASA POWER point values are gridded regional estimates and do not resolve within-field variability. The configured study bounding box is not a surveyed property boundary.</dd>
          <dt>Unmeasured conditions</dt><dd>Subsurface pH, exact plant-available N-P-K, rhizobium nodulation, pest pressure, micro-gullies, current seed stocks, market prices, yield, and fruit Brix require local evidence.</dd>
          <dt>Score interpretation</dt><dd>FARI ranks the configured strategies under the stated model and preferences. It does not estimate yield, profit, or probability of success and does not artificially penalize the baseline.</dd>
          <dt>Reproduction inputs</dt><dd>Farm ID: {farm.id} · Month: {climate.month} · Scenario: {climate.scenarioId} · Weights: W {pct(weights.water)}, E {pct(weights.erosion)}, N {pct(weights.nutrients)}, M {pct(weights.market)}.</dd>
        </dl>
        <p className="brief-source-link">NASA POWER documentation: <span>https://power.larc.nasa.gov/docs/services/api/temporal/monthly/</span></p>
      </section>

      <footer className="brief-disclaimer">
        <b>NASA does not endorse any non-U.S. Government entity.</b> FieldShift is an educational decision-support prototype designed to support, and never replace, farmer judgment, local soil testing, and certified agricultural extension expertise.
      </footer>
      <p className="brief-footer">FieldShift · Team Overachiever · NASA Space Apps Challenge · Historical data through 2025 · Generated {generatedAt}</p>
    </article>
  );

  return typeof document === 'undefined'
    ? briefContent
    : createPortal(briefContent, document.body);
};
