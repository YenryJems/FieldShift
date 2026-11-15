import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Satellite,
  Sparkles,
} from 'lucide-react';
import {
  calculateSiComparison,
  calculateTerroirAssessment,
  DEFAULT_PRIORITY_WEIGHTS,
  ECOCROP_CLIMATE_PROFILES,
  getEcoCropReferencesForCrops,
  FarmId,
  getFarmById,
  type PriorityWeights,
  StrategyId,
  type StressScenarioId,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';
import { FrostIndicator } from './FrostIndicator';
import { SprayValidator } from './SprayValidator';
import {
  SoilCertificate,
  type SoilGroundTruthFormState,
} from '../Certification/SoilCertificate';
import { MarketCard } from '../Hub/MarketCard';
import { SeedHub } from '../Hub/SeedHub';
import { NasaDataAuditDrawer } from '../Common/NasaDataAuditDrawer';

interface AnalyticalSuiteSectionProps {
  farmId: FarmId;
  selectedMonth: number;
  stressScenario?: StressScenarioId;
  weights?: PriorityWeights;
  draftStrategyId?: StrategyId | null;
  recommendedStrategyId?: StrategyId;
  onSelectDraftStrategy?: (strategyId: StrategyId) => void;
  soilFormState?: SoilGroundTruthFormState;
  onSoilFormStateChange?: (next: SoilGroundTruthFormState) => void;
  initialEcoCropScope?: 'matched' | 'all';
}

export const AnalyticalSuiteSection: React.FC<AnalyticalSuiteSectionProps> = ({
  farmId,
  selectedMonth,
  stressScenario = 'baseline',
  weights = DEFAULT_PRIORITY_WEIGHTS,
  draftStrategyId = null,
  recommendedStrategyId,
  onSelectDraftStrategy,
  soilFormState,
  onSoilFormStateChange,
  initialEcoCropScope = 'matched',
}) => {
  const { t } = useLanguage();
  const [inspectedStrategyId, setInspectedStrategyId] = useState<StrategyId | null>(null);
  const [ecoCropScope, setEcoCropScope] = useState<'matched' | 'all'>(initialEcoCropScope);

  useEffect(() => {
    setInspectedStrategyId(null);
  }, [farmId]);

  const activeStrategyId: StrategyId =
    inspectedStrategyId ?? draftStrategyId ?? recommendedStrategyId ?? 'S2';

  const farm = getFarmById(farmId);

  const terroir = calculateTerroirAssessment(
    farmId,
    activeStrategyId,
    selectedMonth,
    stressScenario,
  );
  const siComparison = calculateSiComparison(
    farmId,
    selectedMonth,
    stressScenario,
    activeStrategyId,
    weights,
  );

  const activeStrategy =
    farm.strategies.find((s) => s.id === activeStrategyId) ??
    farm.strategies[1];

  const matchedEcoCropReferences = getEcoCropReferencesForCrops(activeStrategy.crops);
  const displayedEcoCropProfiles =
    ecoCropScope === 'all' ? ECOCROP_CLIMATE_PROFILES : matchedEcoCropReferences;

  return (
    <div id="agronomic-suite" className="space-y-8">
      {/* Global Strategy Selector for Agronomic Deep-Dive */}
      <div className="flex flex-col gap-3 rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
            Agronomic Deep-Dive &amp; Verification Suite
          </p>
          <h3 className="text-base font-extrabold text-[#F0F9FF]">
            Inspecting Strategy {activeStrategy.id}: {activeStrategy.name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Select strategy for terroir and certification analysis"
            className="inline-flex rounded-lg border border-sky-400/20 bg-[#0D182E] p-1"
          >
            {farm.strategies.map((strat) => (
              <button
                key={strat.id}
                type="button"
                aria-pressed={activeStrategyId === strat.id}
                onClick={() => setInspectedStrategyId(strat.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeStrategyId === strat.id
                    ? 'bg-sky-400 text-[#040811]'
                    : 'text-[#94A3B8] hover:text-[#F0F9FF]'
                }`}
              >
                {strat.id}: {strat.shortLabel}
              </button>
            ))}
          </div>
          {onSelectDraftStrategy && (
            <button
              type="button"
              aria-pressed={activeStrategyId === draftStrategyId}
              onClick={() => onSelectDraftStrategy(activeStrategyId)}
              className={`inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                activeStrategyId === draftStrategyId
                  ? 'border-sky-400 bg-[#0D182E] text-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                  : 'border-sky-400 bg-sky-400 text-[#040811] hover:bg-sky-300'
              }`}
            >
              {activeStrategyId === draftStrategyId ? 'Active draft plan' : 'Set as draft plan'}
            </button>
          )}
        </div>
      </div>

      <SprayValidator farmId={farmId} startMonth={selectedMonth} scenario={stressScenario} />
      <FrostIndicator farmId={farmId} month={selectedMonth} />

      {/* 2. Precision Terroir & Guimaras Mango Sugar-Loading Index + Nutrient Gap Table */}
      <section
        aria-labelledby="terroir-engine-heading"
        className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-sky-400/20 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
                Precision Terroir &amp; Nutrient Gap Calculator
              </span>
              <span className="rounded border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7DD3FC]">
                {t.illustrativeModeledBadge}
              </span>
            </div>
            <h3
              id="terroir-engine-heading"
              className="mt-1 text-xl font-extrabold text-[#F0F9FF]"
            >
              Terroir Nutrient Balance &amp; Guimaras Mango Sugar-Loading Index (0–100)
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
              Computes ΔAdjustment = TargetIdealProfile − (SoilBaseline + CoverCropContribution) for {farm.name} under Strategy {activeStrategy.id}. Soil baselines are regional literature reference values—not direct satellite measurements.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] px-3.5 py-2 text-right">
              <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
                Sugar-Loading Index
              </p>
              <p className="font-mono text-xl font-extrabold text-[#38BDF8]">
                {terroir.mangoSugarLoadingIndex}/100{' '}
                <span className="text-xs font-normal text-[#94A3B8]">
                  ({terroir.targetBrixRange})
                </span>
              </p>
            </div>
            <div
              title={t.projectedEstimateTooltip}
              className="rounded-xl border border-sky-400/20 bg-[#0D182E] px-3.5 py-2 text-right"
            >
              <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
                Urea Reduction ({t.projectedEstimateBadge})
              </p>
              <p className="font-mono text-xl font-extrabold text-[#F0F9FF]">
                {terroir.estimatedUreaReductionPct > 0
                  ? `${terroir.estimatedUreaReductionPct}% (25–40% range)`
                  : '0% (Baseline Monocrop)'}
              </p>
            </div>
          </div>
        </div>

        {/* Sugar Loading Component Sub-Indices */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
              Solar Irradiance Index (ALLSKY_SFC_SW_DWN)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#38BDF8]">
              {Math.round(terroir.solarIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              Drives sucrose translocation during fruit maturation.
            </p>
          </div>
          <div className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
              Dry-Spell Maturation Index (&lt;3 mm/day)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#38BDF8]">
              {Math.round(terroir.drySpellIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              Dry ripening prevents watery dilution and anthracnose fungal rot.
            </p>
          </div>
          <div className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
              Slope Drainage Index ({farm.slopePct}% Slope)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#38BDF8]">
              {Math.round(terroir.drainageIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              Gentle 4–8% orchard drainage induces mild root stress that triggers flowering.
            </p>
          </div>
        </div>

        {/* Nutrient Gap Table */}
        <details className="mt-4 rounded-xl border border-sky-400/20 bg-[#0D182E] p-3.5">
          <summary className="cursor-pointer select-none text-xs font-extrabold text-[#F0F9FF]">
            Nutrient Gap Table — Strategy {activeStrategy.id} ({terroir.nutrientGaps.length} parameters)
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-sky-400/20 bg-[#0B1426] font-mono text-[10px] uppercase text-sky-300/75">
                  <th className="p-2.5">Soil Parameter</th>
                  <th className="p-2.5">Regional Soil Baseline</th>
                  <th className="p-2.5">
                    Strategy {activeStrategy.id} Biological Contribution
                  </th>
                  <th className="p-2.5">Target Ideal Profile</th>
                  <th className="p-2.5">Remaining Adjustment Gap</th>
                  <th className="p-2.5">Agronomic Advisory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-400/20 bg-[#0D182E]">
                {terroir.nutrientGaps.map((row) => (
                  <tr key={row.nutrient}>
                    <td className="p-2.5 font-bold text-[#F0F9FF]">{row.nutrient}</td>
                    <td className="p-2.5 font-mono text-[#CBD5E1]">
                      {row.soilBaseline} {row.unit}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#34D399]">
                      +{row.coverCropContribution} {row.unit}
                    </td>
                    <td className="p-2.5 font-mono text-[#CBD5E1]">
                      {row.targetIdeal} {row.unit}
                    </td>
                    <td className="p-2.5 font-mono font-extrabold text-[#38BDF8]">
                      {row.adjustmentGap > 0 ? `+${row.adjustmentGap}` : row.adjustmentGap}{' '}
                      {row.unit}
                    </td>
                    <td className="p-2.5 text-[11px] text-[#94A3B8]">
                      {row.advisoryNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* 3. Satellite Intelligence (SI) Comparison: Approach A (Z-Score) vs Approach B (Rule-based RF-style Ensemble) */}
      <section
        aria-labelledby="si-comparison-heading"
        className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-sky-400/20 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
                Satellite Intelligence (SI) Dual-Approach Comparison
              </span>
            </div>
            <h3
              id="si-comparison-heading"
              className="mt-1 text-xl font-extrabold text-[#F0F9FF]"
            >
              Approach A (25-Year Z-Score Anomaly) vs. Approach B ({siComparison.approachB.label})
            </h3>
          </div>
          <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-3 py-1 font-mono text-xs font-extrabold text-[#7DD3FC]">
            {siComparison.approachB.confidenceBanner}
          </span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-12">
          {/* Approach A: same-month 2001-2025 baseline z-score table */}
          <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4 lg:col-span-7">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#F0F9FF]">
                Approach A: {siComparison.approachA.name}
              </h4>
              <span className="font-mono text-[10px] font-bold text-sky-300/75">
                {siComparison.approachA.baselinePeriod}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Compares {siComparison.monthLabel} 2020–2025 observations against the 25-year (`2001–2025`) NASA POWER historical mean ($\mu_m$) and standard deviation ($\sigma_m$).
            </p>

            <details className="mt-3 rounded-lg border border-sky-400/20 bg-[#0B1426] p-3">
              <summary className="cursor-pointer select-none text-xs font-extrabold text-[#F0F9FF]">
                25-Year Z-Score Anomaly Table ({siComparison.approachA.anomalies.length} variables)
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-sky-400/20 font-mono text-[10px] uppercase text-sky-300/75">
                      <th className="py-2 pr-2">Variable</th>
                      <th className="px-2 py-2">Current</th>
                      <th className="px-2 py-2">25-Yr &mu; &plusmn; &sigma;</th>
                      <th className="px-2 py-2">Z-Score</th>
                      <th className="py-2 pl-2">Agronomic Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-400/20">
                    {siComparison.approachA.anomalies.map((item) => (
                      <tr key={item.variable}>
                        <td className="py-2 pr-2 font-semibold text-[#F0F9FF]">
                          {item.label}
                          <div className="font-mono text-[10px] font-normal text-[#94A3B8]">
                            {item.rawCode}
                          </div>
                        </td>
                        <td className="px-2 py-2 font-mono font-bold text-[#38BDF8]">
                          {item.currentValue} {item.unit}
                        </td>
                        <td className="px-2 py-2 font-mono text-[11px] text-[#CBD5E1]">
                          {item.mean2001_2025} &plusmn; {item.std2001_2025} {item.unit}
                        </td>
                        <td className="px-2 py-2 font-mono font-extrabold">
                          <span className="inline-flex items-center gap-1 rounded border border-sky-400/20 bg-[#0D182E] px-1.5 py-0.5 text-[#F0F9FF]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                Math.abs(item.zScore) >= 0.8 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              aria-hidden="true"
                            />
                            {item.zScore >= 0 ? `+${item.zScore}` : item.zScore}&sigma;
                          </span>
                        </td>
                        <td className="py-2 pl-2 text-[11px] text-[#94A3B8]">
                          {item.plainInterpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>

          {/* Approach B: Rule-based suitability ensemble (RF-style) */}
          <div className="flex flex-col justify-between rounded-xl border border-sky-400/20 bg-[#0D182E] p-4 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-sky-300/75">
                  <Cpu className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                  Approach B · Deterministic Decision Tree Ensemble
                </span>
                <span className="rounded border border-sky-400/20 bg-[#0B1426] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7DD3FC]">
                  {t.illustrativeModeledBadge}
                </span>
              </div>
              <h4 className="mt-1 text-base font-extrabold text-[#F0F9FF]">
                {siComparison.approachB.label}
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                Evaluates multi-variable suitability rules across moisture stability, slope erosion control, thermal window, and biological N regeneration. Explicitly capped at{' '}
                <strong className="text-[#F0F9FF]">{siComparison.approachB.orbitalConfidencePct}% Orbital Confidence</strong>{' '}
                because satellites cannot directly observe subsurface pH, plant-available NPK, or root-knot nematodes.
              </p>

              <div className="mt-4 space-y-2.5">
                {(
                  [
                    {
                      label: 'Root-Zone Moisture Stability Rule',
                      val: siComparison.approachB.ruleBreakdown.moistureStabilityScore,
                    },
                    {
                      label: 'Slope & Rain-Burst Erosion Control Rule',
                      val: siComparison.approachB.ruleBreakdown.erosionControlScore,
                    },
                    {
                      label: 'Canopy Thermal Window Rule',
                      val: siComparison.approachB.ruleBreakdown.thermalWindowScore,
                    },
                    {
                      label: 'Biological N & Mulch Regeneration Rule',
                      val: siComparison.approachB.ruleBreakdown.nutrientRegenScore,
                    },
                  ] as const
                ).map((rule) => (
                  <div key={rule.label} className="text-xs">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="font-semibold text-[#CBD5E1]">{rule.label}</span>
                      <span className="font-bold text-[#F0F9FF]">{rule.val}/100</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#0B1426]">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: `${rule.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-sky-400/20 bg-[#0B1426] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#CBD5E1]">
                  Ensemble Suitability Score ({activeStrategy.id})
                </span>
                <span className="font-mono text-xl font-extrabold text-[#38BDF8]">
                  {siComparison.approachB.suitabilityScore}/100
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] font-bold text-[#94A3B8]">
                {siComparison.approachB.confidenceBanner}
              </p>
            </div>
          </div>
        </div>

      </section>

      <SoilCertificate
        key={farmId}
        farmId={farmId}
        strategyId={activeStrategyId}
        month={selectedMonth}
        scenario={stressScenario}
        formState={soilFormState}
        onFormStateChange={onSoilFormStateChange}
      />

      <div className="space-y-4">
        <SeedHub farmId={farmId} strategyId={activeStrategyId} />
        <MarketCard farmId={farmId} strategyId={activeStrategyId} />
        <div className="mt-4 rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-[#F0F9FF]">
                EcoCrop climate reference ranges
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                Global species-level reference envelopes from the committed EcoCrop database,{' '}
                {ecoCropScope === 'all'
                  ? `showing all ${ECOCROP_CLIMATE_PROFILES.length} committed reference profiles (including Adlai).`
                  : 'matched to this strategy’s crops.'}{' '}
                These are screening references, not farm measurements or cultivar guarantees; confirm
                local performance with MAO or extension staff.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="EcoCrop reference scope"
                className="inline-flex rounded-lg border border-sky-400/20 bg-[#0D182E] p-1"
              >
                <button
                  type="button"
                  aria-pressed={ecoCropScope === 'matched'}
                  onClick={() => setEcoCropScope('matched')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    ecoCropScope === 'matched'
                      ? 'bg-sky-400 text-[#040811]'
                      : 'text-[#94A3B8] hover:text-[#F0F9FF]'
                  }`}
                >
                  Matched to Strategy {activeStrategy.id} ({matchedEcoCropReferences.length})
                </button>
                <button
                  type="button"
                  aria-pressed={ecoCropScope === 'all'}
                  onClick={() => setEcoCropScope('all')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    ecoCropScope === 'all'
                      ? 'bg-sky-400 text-[#040811]'
                      : 'text-[#94A3B8] hover:text-[#F0F9FF]'
                  }`}
                >
                  All {ECOCROP_CLIMATE_PROFILES.length} Reference Species
                </button>
              </div>
              <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#7DD3FC]">
                Reference data · not site-specific
              </span>
            </div>
          </div>
          {displayedEcoCropProfiles.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {displayedEcoCropProfiles.map((profile) => (
                <article
                  key={profile.rawEcoPortCode}
                  className="rounded-lg border border-sky-400/20 bg-[#0D182E] p-3"
                >
                  <h5 className="text-xs font-extrabold text-[#F0F9FF]">
                    {profile.scientificName}
                  </h5>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-[#94A3B8]">
                    {profile.commonNames.split(',').slice(0, 4).join(', ')}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-[#94A3B8]">
                    <dt>Optimal temp.</dt>
                    <dd className="text-[#F0F9FF]">
                      {profile.optimalTempRangeC.min ?? '—'}–{profile.optimalTempRangeC.max ?? '—'}°C
                    </dd>
                    <dt>Optimal rain</dt>
                    <dd className="text-[#F0F9FF]">
                      {profile.optimalSeasonalRainMm.min ?? '—'}–{profile.optimalSeasonalRainMm.max ?? '—'} mm/yr
                    </dd>
                    <dt>Ideal soil pH</dt>
                    <dd className="text-[#F0F9FF]">{profile.idealSoilPhRange.min ?? '—'}–{profile.idealSoilPhRange.max ?? '—'}</dd>
                    <dt>Days to harvest</dt>
                    <dd className="text-[#F0F9FF]">
                      {profile.daysToHarvestRange.min ?? '—'}–{profile.daysToHarvestRange.max ?? '—'} days
                    </dd>
                  </dl>
                  <details className="mt-2 rounded border border-sky-400/20 bg-[#0B1426] px-2 py-1.5 text-[10px] text-[#CBD5E1]">
                    <summary className="cursor-pointer select-none font-semibold text-[#F0F9FF]">
                      Taxonomy, soil &amp; EcoCrop metadata
                    </summary>
                    <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px]">
                      <dt className="text-sky-300/75">Plant family</dt>
                      <dd className="text-[#F0F9FF]">{profile.plantFamilyGroup}</dd>
                      <dt className="text-sky-300/75">Root depth</dt>
                      <dd className="text-[#F0F9FF]">{profile.rootDepthCm} cm</dd>
                      <dt className="text-sky-300/75">Soil texture</dt>
                      <dd className="text-[#F0F9FF]">{profile.soilTextureType}</dd>
                      <dt className="text-sky-300/75">Drainage</dt>
                      <dd className="text-[#F0F9FF]">{profile.soilDrainageClass}</dd>
                      <dt className="text-sky-300/75">NPK demand</dt>
                      <dd className="text-[#F0F9FF]">{profile.soilNutrientDemand}</dd>
                      <dt className="text-sky-300/75">Max elevation</dt>
                      <dd className="text-[#F0F9FF]">{profile.maxElevationMeters !== null ? `${profile.maxElevationMeters} m` : '—'}</dd>
                      <dt className="text-sky-300/75">EcoPort code</dt>
                      <dd className="text-[#F0F9FF]">{profile.rawEcoPortCode}</dd>
                    </dl>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 text-xs text-[#94A3B8]">
              No matching species profile is included for this strategy’s crop names.
            </p>
          )}
          <p className="mt-2 text-[10px] text-[#94A3B8]">
            Source: EcoCrop_DB.csv, EcoPortCode records {displayedEcoCropProfiles.map((profile) => profile.rawEcoPortCode).join(', ') || '—'}.
          </p>
          <NasaDataAuditDrawer
            className="mt-3"
            title="Agronomic & EcoCrop Parameter Audit Drawer"
            metricKeys={[
              'optimalTempRangeC',
              'optimalSeasonalRainMm',
              'idealSoilPhRange',
              'daysToHarvestRange',
              'rootDepthCm',
              'plantFamilyGroup',
              'maxElevationMeters',
              'soilTextureType',
              'soilDrainageClass',
              'soilNutrientDemand',
            ]}
          />
        </div>
      </div>
    </div>
  );
};
