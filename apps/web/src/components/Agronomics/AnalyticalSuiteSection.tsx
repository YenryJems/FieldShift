import React, { useState } from 'react';
import {
  Activity,
  Award,
  Beaker,
  CalendarClock,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Info,
  Leaf,
  Satellite,
  ShieldAlert,
  Sparkles,
  ThermometerSnowflake,
  Wheat,
} from 'lucide-react';
import {
  calculateCfiSprayCalendar,
  calculateSiComparison,
  calculateTerroirAssessment,
  evaluateTwoTierSoilCertificate,
  getEcoCropReferencesForCrops,
  FarmId,
  getFarmById,
  StrategyId,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';

interface AnalyticalSuiteSectionProps {
  farmId: FarmId;
  selectedMonth: number;
}

export const AnalyticalSuiteSection: React.FC<AnalyticalSuiteSectionProps> = ({
  farmId,
  selectedMonth,
}) => {
  const { t } = useLanguage();
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>('S2');
  const [seedFilter, setSeedFilter] = useState<'all' | 'commercial' | 'open-pollinated'>('all');

  // Ground-Truth Tier 2 Interactive Field Kit State
  const farm = getFarmById(farmId);
  const [measuredPh, setMeasuredPh] = useState<string>(
    farm.soilBaseline.ph.toFixed(1),
  );
  const [measuredN, setMeasuredN] = useState<string>(
    String(farm.soilBaseline.nitrogenKgHa + 35),
  );
  const [measuredOm, setMeasuredOm] = useState<string>(
    (farm.soilBaseline.organicMatterPct + 0.4).toFixed(1),
  );
  const [textureVerified, setTextureVerified] = useState<boolean>(true);

  const cfiCalendar = calculateCfiSprayCalendar(farmId, selectedMonth, 'baseline');
  const terroir = calculateTerroirAssessment(
    farmId,
    selectedStrategyId,
    selectedMonth,
    'baseline',
  );
  const siComparison = calculateSiComparison(
    farmId,
    selectedMonth,
    'baseline',
    selectedStrategyId,
  );

  const parsedPh = Number.parseFloat(measuredPh);
  const parsedN = Number.parseFloat(measuredN);
  const parsedOm = Number.parseFloat(measuredOm);

  const certificate = evaluateTwoTierSoilCertificate(
    farmId,
    selectedStrategyId,
    selectedMonth,
    'baseline',
    {
      measuredPh: Number.isFinite(parsedPh) ? parsedPh : null,
      measuredNitrogenKgHa: Number.isFinite(parsedN) ? parsedN : null,
      measuredOrganicMatterPct: Number.isFinite(parsedOm) ? parsedOm : null,
      soilTextureVerified: textureVerified,
    },
  );

  const activeStrategy =
    farm.strategies.find((s) => s.id === selectedStrategyId) ??
    farm.strategies[1];

  const filteredCultivars = activeStrategy.cultivars.filter((item) =>
    seedFilter === 'all' ? true : item.type === seedFilter,
  );
  const ecoCropReferences = getEcoCropReferencesForCrops(activeStrategy.crops);

  return (
    <div id="agronomic-suite" className="space-y-8">
      {/* Global Strategy Selector for Agronomic Deep-Dive */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#D4DDD0] bg-[#F4F8F2] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
            Agronomic Deep-Dive &amp; Verification Suite
          </p>
          <h3 className="text-base font-extrabold text-[#17271D]">
            Inspecting Strategy {activeStrategy.id}: {activeStrategy.name}
          </h3>
        </div>
        <div
          role="group"
          aria-label="Select strategy for terroir and certification analysis"
          className="inline-flex rounded-lg border border-[#C7D5C5] bg-white p-1"
        >
          {farm.strategies.map((strat) => (
            <button
              key={strat.id}
              type="button"
              aria-pressed={selectedStrategyId === strat.id}
              onClick={() => setSelectedStrategyId(strat.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedStrategyId === strat.id
                  ? 'bg-[#1B4332] text-white'
                  : 'text-[#536458] hover:text-[#1B4332]'
              }`}
            >
              {strat.id}: {strat.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* 1. 90-Day Climatological CFI & Spray Risk Validator + Thermal/Frost Shock */}
      <section
        aria-labelledby="cfi-spray-calendar-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-[#E2E8DF] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                NASA POWER Daily Climatology (2020–2025 UTC) · IMERG_PRECTOT &amp; T2M_MAX / T2M_MIN
              </span>
            </div>
            <h3
              id="cfi-spray-calendar-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              90-Day Climatological Flower Induction (CFI) &amp; Foliar Spray Risk Validator
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#536458]">
              Screens 3 consecutive months starting in{' '}
              <strong>{cfiCalendar[0].monthLabel}</strong> for heavy storm washout days
              (&ge;14 mm/day), canopy heat-shock days (&ge;33&deg;C), and highland/temperate cold-shock days (&le;2&deg;C). Climatological risk window—always check your 24-hour local weather forecast before spraying.
            </p>
          </div>
          <span
            title={t.projectedEstimateTooltip}
            className="shrink-0 rounded-full border border-[#D97706]/40 bg-[#FFFBEB] px-3 py-1 font-mono text-[10px] font-bold text-[#92400E]"
          >
            Avoided Spray Loss: PHP 15,000–35,000/ha ({t.projectedEstimateBadge})
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {cfiCalendar.map((win, idx) => {
            const badgeColors =
              win.riskLevel === 'green'
                ? 'border-[#2D6A4F] bg-[#EDF7F0] text-[#1B4332]'
                : win.riskLevel === 'amber'
                  ? 'border-[#D97706] bg-[#FFFBEB] text-[#92400E]'
                  : 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]';

            return (
              <article
                key={win.month}
                className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#FAFBF9] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#52715E]">
                      Window Month {idx + 1} · {win.monthLabel}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${badgeColors}`}
                    >
                      {win.badgeText}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="rounded border border-[#E2E8DF] bg-white p-2">
                      <dt className="text-[10px] text-[#65766A]">Storm Days (&ge;14 mm)</dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#17271D]">
                        {win.stormDaysGe14Mm.toFixed(1)} days/mo
                      </dd>
                    </div>
                    <div className="rounded border border-[#E2E8DF] bg-white p-2">
                      <dt className="text-[10px] text-[#65766A]">Dry Days (&lt;3 mm)</dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#17271D]">
                        {win.dryDaysLt3Mm.toFixed(1)} days/mo
                      </dd>
                    </div>
                    <div className="rounded border border-[#E2E8DF] bg-white p-2">
                      <dt className="text-[10px] text-[#65766A]">Heat Days (&ge;33&deg;C)</dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#B45309]">
                        {win.heatStressDaysGe33C.toFixed(1)} days (Tmax {win.t2mMaxC.toFixed(1)}&deg;C)
                      </dd>
                    </div>
                    <div className="rounded border border-[#E2E8DF] bg-white p-2">
                      <dt className="flex items-center gap-1 text-[10px] text-[#65766A]">
                        <ThermometerSnowflake className="h-3 w-3 text-[#2563EB]" />
                        Cold Days (&le;2&deg;C)
                      </dt>
                      <dd className="mt-0.5 text-sm font-extrabold text-[#1D4E89]">
                        {win.coldDaysLe2C.toFixed(1)} days (Tmin {win.t2mMinC.toFixed(1)}&deg;C)
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="mt-3 border-t border-[#E2E8DF] pt-2.5 text-xs leading-5 text-[#3B4D41]">
                  <strong className="text-[#17271D]">Field Action: </strong>
                  {win.farmerActionAdvisory}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 2. Precision Terroir & Guimaras Mango Sugar-Loading Index + Nutrient Gap Table */}
      <section
        aria-labelledby="terroir-engine-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-[#E2E8DF] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                Precision Terroir &amp; Nutrient Gap Calculator
              </span>
              <span className="rounded bg-[#FFF3CD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#856404]">
                {t.illustrativeModeledBadge}
              </span>
            </div>
            <h3
              id="terroir-engine-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              Terroir Nutrient Balance &amp; Guimaras Mango Sugar-Loading Index (0–100)
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#536458]">
              Computes $\Delta\text&#123;Adjustment&#125; = \text&#123;TargetIdealProfile&#125; - (\text&#123;SoilBaseline&#125; + \text&#123;CoverCropContribution&#125;)$ for {farm.name} under Strategy {activeStrategy.id}. Soil baselines are regional literature reference values—not direct satellite measurements.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-[#C7D5C5] bg-[#F5F9F3] px-3.5 py-2 text-right">
              <p className="font-mono text-[10px] font-bold uppercase text-[#52715E]">
                Sugar-Loading Index
              </p>
              <p className="font-mono text-xl font-extrabold text-[#1B4332]">
                {terroir.mangoSugarLoadingIndex}/100{' '}
                <span className="text-xs font-normal text-[#3B4D41]">
                  ({terroir.targetBrixRange})
                </span>
              </p>
            </div>
            <div
              title={t.projectedEstimateTooltip}
              className="rounded-xl border border-[#F3D9A4] bg-[#FFFBEB] px-3.5 py-2 text-right"
            >
              <p className="font-mono text-[10px] font-bold uppercase text-[#92400E]">
                Urea Reduction ({t.projectedEstimateBadge})
              </p>
              <p className="font-mono text-xl font-extrabold text-[#92400E]">
                {terroir.estimatedUreaReductionPct > 0
                  ? `${terroir.estimatedUreaReductionPct}% (25–40% range)`
                  : '0% (Baseline Monocrop)'}
              </p>
            </div>
          </div>
        </div>

        {/* Sugar Loading Component Sub-Indices */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#E2E8DF] bg-[#F8FAF7] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-[#52715E]">
              Solar Irradiance Index (ALLSKY_SFC_SW_DWN)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#17271D]">
              {Math.round(terroir.solarIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#65766A]">
              Drives sucrose translocation during fruit maturation.
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E8DF] bg-[#F8FAF7] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-[#52715E]">
              Dry-Spell Maturation Index (&lt;3 mm/day)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#17271D]">
              {Math.round(terroir.drySpellIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#65766A]">
              Dry ripening prevents watery dilution and anthracnose fungal rot.
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E8DF] bg-[#F8FAF7] p-3">
            <p className="font-mono text-[10px] font-bold uppercase text-[#52715E]">
              Slope Drainage Index ({farm.slopePct}% Slope)
            </p>
            <p className="mt-1 font-mono text-lg font-extrabold text-[#17271D]">
              {Math.round(terroir.drainageIndex * 100)}/100
            </p>
            <p className="text-[11px] text-[#65766A]">
              Gentle 4–8% orchard drainage induces mild root stress that triggers flowering.
            </p>
          </div>
        </div>

        {/* Nutrient Gap Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4DDD0] bg-[#F3F6F1] font-mono text-[10px] uppercase text-[#52715E]">
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
            <tbody className="divide-y divide-[#E2E8DF]">
              {terroir.nutrientGaps.map((row) => (
                <tr key={row.nutrient}>
                  <td className="p-2.5 font-bold text-[#17271D]">{row.nutrient}</td>
                  <td className="p-2.5 font-mono">
                    {row.soilBaseline} {row.unit}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-[#1B4332]">
                    +{row.coverCropContribution} {row.unit}
                  </td>
                  <td className="p-2.5 font-mono">
                    {row.targetIdeal} {row.unit}
                  </td>
                  <td className="p-2.5 font-mono font-extrabold text-[#B45309]">
                    {row.adjustmentGap > 0 ? `+${row.adjustmentGap}` : row.adjustmentGap}{' '}
                    {row.unit}
                  </td>
                  <td className="p-2.5 text-[11px] text-[#536458]">
                    {row.advisoryNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Satellite Intelligence (SI) Comparison: Approach A (Z-Score) vs Approach B (Rule-based RF-style Ensemble) */}
      <section
        aria-labelledby="si-comparison-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-[#E2E8DF] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                Satellite Intelligence (SI) Dual-Approach Comparison
              </span>
            </div>
            <h3
              id="si-comparison-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              Approach A (25-Year Z-Score Anomaly) vs. Approach B ({siComparison.approachB.label})
            </h3>
          </div>
          <span className="rounded-full border border-[#1D4E89]/30 bg-[#EBF3FA] px-3 py-1 font-mono text-xs font-extrabold text-[#1D4E89]">
            {siComparison.approachB.confidenceBanner}
          </span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-12">
          {/* Approach A: 2001-2025 Rolling Z-Score Table */}
          <div className="rounded-xl border border-[#D4DDD0] bg-[#FAFBF9] p-4 lg:col-span-7">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#17271D]">
                Approach A: {siComparison.approachA.name}
              </h4>
              <span className="font-mono text-[10px] font-bold text-[#52715E]">
                {siComparison.approachA.baselinePeriod}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#536458]">
              Compares {siComparison.monthLabel} 2020–2025 observations against the 25-year (`2001–2025`) NASA POWER historical mean ($\mu_m$) and standard deviation ($\sigma_m$).
            </p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4DDD0] font-mono text-[10px] uppercase text-[#52715E]">
                    <th className="py-2 pr-2">Variable</th>
                    <th className="px-2 py-2">Current</th>
                    <th className="px-2 py-2">25-Yr &mu; &plusmn; &sigma;</th>
                    <th className="px-2 py-2">Z-Score</th>
                    <th className="py-2 pl-2">Agronomic Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8DF]">
                  {siComparison.approachA.anomalies.map((item) => (
                    <tr key={item.variable}>
                      <td className="py-2 pr-2 font-mono font-bold text-[#17271D]">
                        {item.variable}
                        <div className="font-sans text-[10px] font-normal text-[#65766A]">
                          {item.label}
                        </div>
                      </td>
                      <td className="px-2 py-2 font-mono font-bold">
                        {item.currentValue} {item.unit}
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] text-[#536458]">
                        {item.mean2001_2025} &plusmn; {item.std2001_2025}
                      </td>
                      <td className="px-2 py-2 font-mono font-extrabold">
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            Math.abs(item.zScore) >= 0.8
                              ? 'bg-[#FFF3CD] text-[#92400E]'
                              : 'bg-[#E8F3EC] text-[#1B4332]'
                          }`}
                        >
                          {item.zScore >= 0 ? `+${item.zScore}` : item.zScore}&sigma;
                        </span>
                      </td>
                      <td className="py-2 pl-2 text-[11px] text-[#3B4D41]">
                        {item.plainInterpretation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approach B: Rule-based suitability ensemble (RF-style) */}
          <div className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#FAFBF9] p-4 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-[#1D4E89]">
                  <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                  Approach B · Deterministic Decision Tree Ensemble
                </span>
                <span className="rounded bg-[#FFF3CD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#856404]">
                  {t.illustrativeModeledBadge}
                </span>
              </div>
              <h4 className="mt-1 text-base font-extrabold text-[#17271D]">
                {siComparison.approachB.label}
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#536458]">
                Evaluates multi-variable suitability rules across moisture stability, slope erosion control, thermal window, and biological N regeneration. Explicitly capped at{' '}
                <strong>{siComparison.approachB.orbitalConfidencePct}% Orbital Confidence</strong>{' '}
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
                      <span className="font-semibold text-[#3B4D41]">{rule.label}</span>
                      <span className="font-bold text-[#17271D]">{rule.val}/100</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#E2E8DF]">
                      <div
                        className="h-full rounded-full bg-[#1B4332]"
                        style={{ width: `${rule.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#C7D5C5] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#263B2E]">
                  Ensemble Suitability Score ({activeStrategy.id})
                </span>
                <span className="font-mono text-xl font-extrabold text-[#1B4332]">
                  {siComparison.approachB.suitabilityScore}/100
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] font-bold text-[#1D4E89]">
                {siComparison.approachB.confidenceBanner}
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* 4. Two-Tier Soil Resilience Certificate + Satellite vs Ground-Truth Matrix */}
      <section
        aria-labelledby="soil-certificate-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-[#E2E8DF] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                Two-Tier Soil Resilience &amp; Terroir Certification
              </span>
            </div>
            <h3
              id="soil-certificate-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              Tier 1 Orbital Assessment (80%) + Tier 2 Ground-Truth Field Kit Verification (20%)
            </h3>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-extrabold ${
              certificate.groundTruthVerified
                ? 'bg-[#1B4332] text-white'
                : 'bg-[#FFF3CD] text-[#92400E]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {certificate.badgeStatus}
          </span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-12">
          {/* Interactive Tier 2 Field Kit Form */}
          <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 lg:col-span-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <h4 className="text-sm font-extrabold text-[#17271D]">
                Tier 2: Local Soil Test Kit Input (20% Weight)
              </h4>
            </div>
            <p className="mt-1 text-xs text-[#536458]">
              Enter measurements from a BSWM / DA Soil Test Kit (STK) or Municipal Agriculturist Office (MAO) lab check to unlock full verification.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-bold text-[#263B2E]">
                Measured Soil pH
                <input
                  type="number"
                  step="0.1"
                  min="3.5"
                  max="9.0"
                  value={measuredPh}
                  onChange={(e) => setMeasuredPh(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-1.5 font-mono text-xs"
                />
              </label>
              <label className="block text-xs font-bold text-[#263B2E]">
                Available N (kg/ha)
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="300"
                  value={measuredN}
                  onChange={(e) => setMeasuredN(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-1.5 font-mono text-xs"
                />
              </label>
              <label className="block text-xs font-bold text-[#263B2E]">
                Organic Matter (%)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={measuredOm}
                  onChange={(e) => setMeasuredOm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-1.5 font-mono text-xs"
                />
              </label>
            </div>

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-[#1B4332]">
              <input
                type="checkbox"
                checked={textureVerified}
                onChange={(e) => setTextureVerified(e.target.checked)}
                className="h-4 w-4 accent-[#1B4332]"
              />
              <span>
                On-farm soil texture ({farm.soilType}) &amp; root health visually verified with extension staff
              </span>
            </label>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-[#C7D5C5] bg-white p-3 text-center font-mono">
              <div>
                <p className="text-[10px] uppercase text-[#65766A]">Tier 1 Orbital (80%)</p>
                <p className="mt-0.5 text-lg font-extrabold text-[#17271D]">
                  {certificate.tier1OrbitalScore}/100
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#65766A]">Tier 2 Field Kit (20%)</p>
                <p className="mt-0.5 text-lg font-extrabold text-[#2D6A4F]">
                  {certificate.tier2GroundTruthScore}/100
                </p>
              </div>
              <div className="rounded bg-[#E8F3EC] p-1">
                <p className="text-[10px] font-bold uppercase text-[#1B4332]">
                  Combined Score
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-[#1B4332]">
                  {certificate.combinedCertificateScore}/100
                </p>
              </div>
            </div>
          </div>

          {/* Honest Satellite vs Ground-Truth Capability Matrix */}
          <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 lg:col-span-6">
            <h4 className="text-sm font-extrabold text-[#17271D]">
              Scientific Honesty: What Satellites Can vs. Cannot Measure
            </h4>
            <p className="mt-1 text-xs text-[#536458]">
              Why FieldShift requires a 20% on-farm ground-truth check before issuing a verified certificate:
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#C7D5C5] bg-white p-3 text-xs">
                <p className="font-bold text-[#1B4332]">
                  Orbital Satellites Measure Well (80%)
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] text-[#3B4D41]">
                  <li>Grid-cell root-zone &amp; surface wetness indices (`GWETROOT`, `GWETTOP`)</li>
                  <li>Daily &amp; monthly precipitation and storm bursts (`PRECTOTCORR`, `IMERG`)</li>
                  <li>2m air temperature extremes (`T2M_MAX`, `T2M_MIN`) and solar irradiance</li>
                  <li>Canopy greenness (`NDVI`) and regional terrain slope (`SRTM DEM`)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-[#F3D9A4] bg-[#FFFBEB] p-3 text-xs">
                <p className="font-bold text-[#92400E]">
                  Requires On-Farm Ground-Truth (20%)
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] text-[#78350F]">
                  <li>Subsurface soil pH and lime buffering requirement</li>
                  <li>Plant-available N-P-K and micronutrient concentrations</li>
                  <li>Soil-borne pathogens, root-knot nematodes, and bacterial wilt</li>
                  <li>Sub-meter rill/gully erosion and actual internal fruit Brix</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Climate-Matched Seed & Livestock Forage Market Hub */}
      <section
        aria-labelledby="seed-forage-hub-heading"
        className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-[#E2E8DF] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
                Seed Sovereignty &amp; Crop-Livestock Integration
              </span>
            </div>
            <h3
              id="seed-forage-hub-heading"
              className="mt-1 text-xl font-extrabold text-[#17271D]"
            >
              Climate-Matched Cultivars &amp; Post-Harvest Livestock Forage Hub
            </h3>
          </div>

          <div
            role="group"
            aria-label="Filter cultivar seed type"
            className="inline-flex rounded-lg border border-[#C7D5C5] bg-[#F3F6F1] p-1"
          >
            {(
              [
                { id: 'all', label: 'All Cultivars' },
                { id: 'open-pollinated', label: 'Open-Pollinated / Farmer-Saved' },
                { id: 'commercial', label: 'Commercial / Certified' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={seedFilter === tab.id}
                onClick={() => setSeedFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                  seedFilter === tab.id
                    ? 'bg-white text-[#1B4332] shadow-xs'
                    : 'text-[#536458] hover:text-[#1B4332]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className=" grid gap-3 sm:grid-cols-2 lg:col-span-2">
            {filteredCultivars.map((cultivar) => (
              <article
                key={cultivar.name}
                className="rounded-xl border border-[#D4DDD0] bg-[#FAFBF9] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-[#E8F3EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1B4332]">
                    {cultivar.crop}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      cultivar.type === 'open-pollinated'
                        ? 'bg-[#D8F3DC] text-[#1B4332]'
                        : 'bg-[#E6EFF8] text-[#1D4E89]'
                    }`}
                  >
                    {cultivar.type === 'open-pollinated'
                      ? 'Open-Pollinated (Saveable)'
                      : 'Commercial Line'}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-extrabold text-[#17271D]">
                  {cultivar.name}
                </h4>
                <p className="mt-1 text-xs text-[#3B4D41]">{cultivar.traitHighlight}</p>
                <div className="mt-2 flex items-center justify-between border-t border-[#E2E8DF] pt-2 font-mono text-[11px] text-[#52715E]">
                  <span>Maturity: {cultivar.maturityDays} days</span>
                  <span>{cultivar.seedSourceNote}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#C7D5C5] bg-[#F4F9F4] p-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
                <h4 className="text-sm font-extrabold text-[#17271D]">
                  Livestock Forage &amp; Cut-and-Carry Value
                </h4>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#3B4D41]">
                {activeStrategy.forageSummary}
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-white p-3 font-mono text-xs text-[#1B4332]">
              Forage Index ({activeStrategy.id}):{' '}
              <strong>{Math.round(activeStrategy.forageValue * 100)}/100</strong> · Residue Mulch Index:{' '}
              <strong>{Math.round(activeStrategy.residueMulch * 100)}/100</strong>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-[#C7D5C5] bg-[#F7FAF5] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-[#17271D]">
                EcoCrop climate reference ranges
              </h4>
              <p className="mt-1 text-xs leading-5 text-[#536458]">
                Global species-level reference envelopes from the committed EcoCrop database,
                matched to this strategy’s crops. These are screening references, not farm
                measurements or cultivar guarantees; confirm local performance with MAO or
                extension staff.
              </p>
            </div>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-900">
              Reference data · not site-specific
            </span>
          </div>
          {ecoCropReferences.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {ecoCropReferences.map((profile) => (
                <article
                  key={profile.ecoPortCode}
                  className="rounded-lg border border-[#E2E8DF] bg-white p-3"
                >
                  <h5 className="text-xs font-extrabold text-[#1B4332]">
                    {profile.scientificName}
                  </h5>
                  <p className="mt-0.5 line-clamp-2 text-[10px] text-[#536458]">
                    {profile.commonNames.split(',').slice(0, 4).join(', ')}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-[#3B4D41]">
                    <dt>Optimum temp.</dt>
                    <dd>
                      {profile.optimumTemperatureMinC ?? '—'}–{profile.optimumTemperatureMaxC ?? '—'}°C
                    </dd>
                    <dt>Optimum rain</dt>
                    <dd>
                      {profile.optimumRainfallMinMmYr ?? '—'}–{profile.optimumRainfallMaxMmYr ?? '—'} mm/yr
                    </dd>
                    <dt>Soil pH range</dt>
                    <dd>{profile.soilPhMin ?? '—'}–{profile.soilPhMax ?? '—'}</dd>
                    <dt>Reported cycle</dt>
                    <dd>
                      {profile.cycleDaysMin ?? '—'}–{profile.cycleDaysMax ?? '—'} days
                    </dd>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-white p-3 text-xs text-[#536458]">
              No matching species profile is included for this strategy’s crop names.
            </p>
          )}
          <p className="mt-2 text-[10px] text-[#68786D]">
            Source: EcoCrop_DB.csv, EcoPortCode records {ecoCropReferences.map((profile) => profile.ecoPortCode).join(', ') || '—'}.
          </p>
        </div>
      </section>
    </div>
  );
};
