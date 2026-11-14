import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardCopy,
  CloudRain,
  Flame,
  Info,
  Layers,
  Printer,
  ShieldCheck,
  Sliders,
  Sprout,
  Sun,
  TrendingUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  calculateCfiSprayCalendar,
  DEFAULT_FIELD_CONSTRAINTS,
  FarmId,
  FieldConstraints,
  getMonthlyTelemetry,
  getFarmById,
  PriorityWeights,
  rankFarmStrategies,
  STRESS_PRESETS,
  StressScenarioId,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';
import { formatSmsFieldBrief } from '../../utils/exportBrief';
import {
  isSpeechSynthesisSupported,
  speakFieldAdvisory,
  stopFieldAdvisorySpeech,
} from '../../utils/speech';

const STRATEGY_ROLE_LABELS: Record<'S1' | 'S2' | 'S3', string> = {
  S1: 'Existing baseline practice',
  S2: 'Nitrogen-fixing soil regenerator',
  S3: 'Climate-resilient cash crop / stress armor',
};

const PEST_DISRUPTION_NOTES: Record<FarmId, string> = {
  'nueva-ecija':
    'The non-rice relay periods indicate a planned host break for rice-associated pests such as brown planthopper and stemborer; scout locally because this calendar does not measure pest populations.',
  bukidnon:
    'Legume and camote phases indicate planned non-corn intervals that can disrupt corn pest carryover; this calendar does not measure field pest populations.',
  isabela:
    'Mungbean and sorghum relay periods indicate planned non-corn intervals that can disrupt corn pest carryover; this calendar does not measure field pest populations.',
  guimaras:
    'Mango remains present in every strategy. Living cover and mulch can reduce soil splash associated with anthracnose spread, but do not break the mango host cycle.',
  'usa-midwest':
    'Soybean and cover-crop phases indicate planned non-corn intervals that can disrupt corn pest carryover; this calendar does not measure field pest populations.',
};

interface StrategyComparisonSectionProps {
  farmId: FarmId;
  selectedMonth: number;
  onSelectMonth?: (month: number) => void;
}

const STAGE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  'main-crop': {
    bg: 'bg-[#1B4332]',
    text: 'text-white',
    label: 'Primary Crop',
  },
  'legume-relay': {
    bg: 'bg-[#2D6A4F]',
    text: 'text-white',
    label: 'N-Fixing Legume Relay',
  },
  'resilient-relay': {
    bg: 'bg-[#40916C]',
    text: 'text-white',
    label: 'Drought/Slope Resilient Relay',
  },
  'cover-mulch': {
    bg: 'bg-[#74C69D]',
    text: 'text-[#112A1E]',
    label: 'Protective Cover / Mulch',
  },
  'harvest-transition': {
    bg: 'bg-[#D8F3DC]',
    text: 'text-[#1B4332]',
    label: 'Harvest & Residue Return',
  },
  'bare-fallow': {
    bg: 'bg-[#FDE2E4]',
    text: 'text-[#8C1D28]',
    label: 'Bare Unshielded Fallow',
  },
};

export const StrategyComparisonSection: React.FC<StrategyComparisonSectionProps> = ({
  farmId,
  selectedMonth,
  onSelectMonth,
}) => {
  const { language, t } = useLanguage();
  const [weights, setWeights] = useState<PriorityWeights>({
    water: 25,
    erosion: 25,
    nutrients: 25,
    market: 25,
  });
  const [stressScenario, setStressScenario] = useState<StressScenarioId>('baseline');
  const [constraints, setConstraints] = useState<FieldConstraints>(
    DEFAULT_FIELD_CONSTRAINTS,
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  const farm = getFarmById(farmId);
  const evaluation = rankFarmStrategies(
    farmId,
    selectedMonth,
    stressScenario,
    weights,
    constraints,
  );
  const cfiWindows = calculateCfiSprayCalendar(
    farmId,
    selectedMonth,
    stressScenario,
  );

  const topScore = evaluation.topStrategy;
  const monthlyTelemetry = getMonthlyTelemetry(farmId, selectedMonth);
  const topStrategyObj =
    farm.strategies.find((s) => s.id === topScore.strategyId) ??
    farm.strategies[0];

  const isDroughtCondition =
    stressScenario === 'drought' ||
    evaluation.climate.adjustedGwetRoot < 0.6 ||
    evaluation.climate.adjustedGwetTop < 0.55;

  const handleWeightChange = (key: keyof PriorityWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopFieldAdvisorySpeech();
      setIsSpeaking(false);
      return;
    }

    const speechText = `${farm.name}, ${evaluation.climate.monthLabel}. ${t.droughtAlertBanner} Top recommended strategy: ${topStrategyObj.name}, scoring ${topScore.fariScore.toFixed(1)} out of 100. ${topStrategyObj.explanations.whySuggested} Local review alert: ${topStrategyObj.explanations.localReviewAlerts}`;
    setIsSpeaking(true);
    speakFieldAdvisory(speechText, language, () => setIsSpeaking(false));
  };

  const handleCopyBrief = async () => {
    const briefText = formatSmsFieldBrief({
      farm,
      climate: evaluation.climate,
      topScore,
      topStrategy: topStrategyObj,
      cfiWindow: cfiWindows[0],
      droughtAlert: isDroughtCondition ? t.droughtAlertBanner : undefined,
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(briefText);
        setCopiedSms(true);
        window.setTimeout(() => setCopiedSms(false), 2500);
      }
    } catch {
      setCopiedSms(false);
    }
  };

  const handlePrintBrief = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const projectedImpactCards = [
    {
      metric: '+35 to +80 kg N/ha',
      title: 'Biological Nitrogen Fixation',
      detail: `Legume relay nodulation (${topStrategyObj.nFixKgHa} kg N/ha modeled for ${topStrategyObj.shortLabel}) replenishes root-zone nitrogen between main harvests.`,
      source: 'FAO / IRRI tropical grain-legume biological N-fixation range',
    },
    {
      metric: '25–40%',
      title: 'Synthetic Urea Reduction Potential',
      detail:
        'Incorporating mungbean, cowpea, peanut, or crimson clover haulms reduces synthetic basal N fertilizer requirements in the following cropping cycle.',
      source: 'PCARRD / DA-BAR legume-cereal rotation trials',
    },
    {
      metric: 'Up to 75%',
      title: 'Slope Soil Erosion Reduction',
      detail: `Rapid-closing canopy (${topStrategyObj.canopyClosureDays} days) and contour hedgerow root binding protect sloping fields (${farm.slopePct}% slope at ${farm.name}) against monsoon rain bursts.`,
      source: 'World Agroforestry (ICRAF) NVS contour trials in Bukidnon (8–15% slopes)',
    },
    {
      metric: 'PHP 15,000–35,000/ha',
      title: 'Avoided Foliar Spray & Input Loss',
      detail:
        'Screening 90-day climatological storm washout (≥14 mm/day) and heat shock (≥33°C) windows prevents wasted KNO₃ flower inducers and foliar fertilizers.',
      source: 'BPI-NMRDC Guimaras mango induction & smallholder input cost benchmarks',
    },
  ];

  return (
    <section
      id="fari-engine"
      aria-labelledby="fari-engine-heading"
      className="space-y-6 rounded-2xl border border-[#D4DDD0] bg-white p-5 shadow-xs sm:p-7"
    >
      {/* Section Header & Action Toolbar */}
      <div className="flex flex-col gap-4 border-b border-[#E2E8DF] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F3EC] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1B4332]">
              <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
              FARI Multi-Criteria Engine · 0–100 Scale
            </span>
            {farm.isBenchmarkPlot && (
              <span className="rounded-full bg-[#E6EFF8] px-2.5 py-1 font-mono text-[10px] font-bold text-[#1D4E89]">
                Global Space Agency Benchmark Plot ({farm.country})
              </span>
            )}
          </div>
          <h2
            id="fari-engine-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-[#17271D] sm:text-3xl"
          >
            {t.fariSectionTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#536458]">
            {t.fariSectionSubtitle}
          </p>
        </div>

        {/* Field Extension / Voice / SMS Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isSpeechSynthesisSupported() && (
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                isSpeaking
                  ? 'border-[#9C2B23] bg-[#FDF2F2] text-[#9C2B23]'
                  : 'border-[#C7D5C5] bg-[#F7FAF5] text-[#1B4332] hover:bg-[#EAF2E6]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                  {t.stopAudioButton}
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  {t.readAloudButton}
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyBrief}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C7D5C5] bg-white px-3 py-2 text-xs font-bold text-[#1B4332] transition-colors hover:bg-[#F3F6F1]"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            <span>{copiedSms ? 'Copied SMS brief!' : t.copySmsBriefButton}</span>
          </button>
          <button
            type="button"
            onClick={handlePrintBrief}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>{t.printBriefButton}</span>
          </button>
        </div>
      </div>

      {/* Trilingual Drought / Low-Moisture Action Banner (Includes Exact Binisaya Alert) */}
      <div
        role="region"
        aria-label="Field moisture & spray advisory banner"
        className={`rounded-xl border p-4 ${
          isDroughtCondition || language === 'ceb'
            ? 'border-[#E6B86A] bg-[#FFF8EB] text-[#5F3DC4]'
            : 'border-[#C7D5C5] bg-[#F5F9F3]'
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]"
              aria-hidden="true"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#92400E]">
                  Field Action Advisory · {t.languageName}
                </span>
                <span className="rounded bg-white/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#65766A]">
                  {t.reviewNotice}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-[#1F2937]">
                {t.droughtAlertBanner}
              </p>
              {language !== 'ceb' && (
                <p className="mt-1 text-xs italic text-[#4B5563]">
                  Binisaya field alert:{' '}
                  <span className="font-semibold not-italic text-[#17271D]">
                    &ldquo;Uga kaayo ang yuta—ayaw una pag-spray og pampabulak; pagtanom og munggo o kamote aron mapanalipdan ang kaumog.&rdquo;
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-[#E2E8DF] bg-white px-3 py-2 font-mono text-xs text-[#263B2E]">
            <div>
              GWETROOT: <strong>{evaluation.climate.adjustedGwetRoot.toFixed(2)}</strong>
            </div>
            <div>
              GWETTOP: <strong>{evaluation.climate.adjustedGwetTop.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Grid: Priority Weights + Stress Scenarios + Field Constraints */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* 4 Priority Sliders */}
        <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 sm:p-5 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <h3 className="text-sm font-extrabold text-[#17271D]">
                {t.prioritySlidersTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setWeights({ water: 25, erosion: 25, nutrients: 25, market: 25 })
              }
              className="text-xs font-bold text-[#2D6A4F] underline hover:text-[#1B4332]"
            >
              Reset 25% each
            </button>
          </div>
          <p className="mt-1 text-xs text-[#65766A]">
            Adjusting sliders dynamically re-weights $W, E, N, M$ so $\sum w_i = 1.00$.
            {farm.slopePct <= 3 && (
              <span>
                {' '}
                Note: On flat terrain ({farm.slopePct}% slope), all strategies naturally score high on Erosion ($E \ge 0.90$).
              </span>
            )}
          </p>

          <div className="mt-4 space-y-3">
            {(
              [
                {
                  key: 'water',
                  label: t.waterPriorityLabel,
                  norm: evaluation.normalizedWeights.water,
                  color: 'accent-[#2563EB]',
                },
                {
                  key: 'erosion',
                  label: t.erosionPriorityLabel,
                  norm: evaluation.normalizedWeights.erosion,
                  color: 'accent-[#D97706]',
                },
                {
                  key: 'nutrients',
                  label: t.nutrientsPriorityLabel,
                  norm: evaluation.normalizedWeights.nutrients,
                  color: 'accent-[#1B4332]',
                },
                {
                  key: 'market',
                  label: t.marketPriorityLabel,
                  norm: evaluation.normalizedWeights.market,
                  color: 'accent-[#7C3AED]',
                },
              ] as const
            ).map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`slider-${item.key}`}
                    className="font-bold text-[#263B2E]"
                  >
                    {item.label}
                  </label>
                  <span className="font-mono text-xs font-bold text-[#1B4332]">
                    Raw {weights[item.key]} · Normalized{' '}
                    {Math.round(item.norm * 100)}%
                  </span>
                </div>
                <input
                  id={`slider-${item.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[item.key]}
                  onChange={(e) =>
                    handleWeightChange(item.key, Number(e.target.value))
                  }
                  className={`h-2 w-full cursor-pointer rounded-lg bg-[#DCE5D8] ${item.color}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Climate Stress Presets & Field Reality Constraints */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 sm:p-5 lg:col-span-6">
          <div>
            <h3 className="text-sm font-extrabold text-[#17271D]">
              {t.stressPresetsTitle}
            </h3>
            <p className="mt-1 text-xs text-[#65766A]">
              Applies deterministic climate perturbations to {evaluation.climate.monthLabel}{' '}
              NASA POWER &amp; GPM IMERG baselines.
            </p>
            <div
              role="group"
              aria-label="Climate stress scenario presets"
              className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {(
                [
                  { id: 'baseline', icon: ShieldCheck },
                  { id: 'drought', icon: Sun },
                  { id: 'heatwave', icon: Flame },
                  { id: 'deluge', icon: CloudRain },
                ] as const
              ).map(({ id, icon: Icon }) => {
                const preset = STRESS_PRESETS[id];
                const active = stressScenario === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStressScenario(id)}
                    className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors ${
                      active
                        ? 'border-[#1B4332] bg-[#1B4332] text-white shadow-xs'
                        : 'border-[#C7D5C5] bg-white text-[#263B2E] hover:border-[#1B4332]'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="mt-1.5 text-xs font-extrabold">
                      {preset.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Climate Delta Readout */}
            <div className="mt-3 rounded-lg border border-[#DCE5D8] bg-white p-3 text-xs text-[#3B4D41]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#17271D]">
                  {evaluation.climate.scenarioLabel} ({evaluation.climate.monthLabel})
                </span>
                <span className="rounded bg-[#E8F3EC] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1B4332]">
                  {stressScenario === 'baseline'
                    ? 'Observed 2020–2025 Mean'
                    : t.illustrativeModeledBadge}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#536458]">
                {evaluation.climate.scenarioDescription}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#EDF2EB] pt-2 font-mono text-[11px] sm:grid-cols-4">
                <div>
                  T2M: <strong>{evaluation.climate.adjustedTempC.toFixed(1)}°C</strong>{' '}
                  <span className="text-[#65766A]">
                    (Max {evaluation.climate.adjustedMaxTempC.toFixed(1)}°C)
                  </span>
                </div>
                <div>
                  Rain: <strong>{evaluation.climate.adjustedDailyPrecipMm.toFixed(1)} mm/d</strong>
                </div>
                <div>
                  Burst P95: <strong>{evaluation.climate.adjustedRainBurstMm.toFixed(0)} mm</strong>
                </div>
                <div>
                  GWETROOT: <strong>{evaluation.climate.adjustedGwetRoot.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Field Reality Constraints */}
          <div className="border-t border-[#DCE5D8] pt-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#52715E]">
              {t.constraintsTitle}
            </h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  {
                    key: 'rainfedOnly',
                    label: t.constraintRainfed,
                  },
                  {
                    key: 'manualToolsOnly',
                    label: t.constraintManual,
                  },
                  {
                    key: 'fastCashNeeded',
                    label: t.constraintFastCash,
                  },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#C7D5C5] bg-white px-3 py-2 text-xs font-semibold text-[#263B2E]"
                >
                  <input
                    type="checkbox"
                    checked={constraints[item.key]}
                    onChange={(e) =>
                      setConstraints((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#1B4332]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Strategy Side-by-Side Comparison Cards (S1, S2, S3) */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#17271D]">
            {t.strategyComparisonTitle} — {farm.name} ({farm.locationLabel})
          </h3>
          <span className="font-mono text-xs font-semibold text-[#52715E]">
            Slope: {farm.slopePct}% · Elevation: {farm.elevationM} m · Soil: {farm.soilType}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {farm.strategies.map((strategy) => {
            const scoreData =
              evaluation.strategies.find((s) => s.strategyId === strategy.id) ??
              evaluation.strategies[0];
            const isTopRanked = scoreData.rank === 1;

            return (
              <article
                key={strategy.id}
                aria-label={`Strategy ${strategy.id}: ${strategy.name}`}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-shadow ${
                  isTopRanked
                    ? 'border-2 border-[#1B4332] bg-[#F6FBF7] shadow-sm'
                    : 'border-[#D4DDD0] bg-white'
                }`}
              >
                <div>
                  {/* Strategy Top Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                        isTopRanked
                          ? 'bg-[#1B4332] text-white'
                          : strategy.isBaseline
                            ? 'bg-[#EAECE9] text-[#465A4E]'
                            : 'bg-[#E2F0E8] text-[#1B4332]'
                      }`}
                    >
                      {isTopRanked && <Award className="h-3.5 w-3.5" aria-hidden="true" />}
                      Rank #{scoreData.rank} · {strategy.id}{' '}
                      {strategy.isBaseline ? '(Baseline Practice)' : '(Adaptive Rotation)'}
                    </span>
                    <span className="rounded-full border border-[#DCE5D8] bg-white px-2 py-1 text-[10px] font-semibold text-[#536458]">
                      {STRATEGY_ROLE_LABELS[strategy.id]}
                    </span>

                    {!strategy.isBaseline && (
                      <span
                        className={`font-mono text-xs font-extrabold ${
                          scoreData.deltaVsBaseline >= 0
                            ? 'text-[#1B4332]'
                            : 'text-[#B45309]'
                        }`}
                      >
                        {scoreData.deltaVsBaseline >= 0 ? '+' : ''}
                        {scoreData.deltaVsBaseline.toFixed(1)} vs S1
                      </span>
                    )}
                  </div>

                  {/* Title & FARI Score */}
                  <div className="mt-3 flex items-baseline justify-between gap-3 border-b border-[#E2E8DF] pb-3">
                    <div>
                      <h4 className="text-base font-extrabold text-[#17271D]">
                        {strategy.name}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {strategy.crops.map((crop) => (
                          <span
                            key={crop}
                            className="rounded-md bg-[#EBF2EA] px-2 py-0.5 text-[11px] font-semibold text-[#263B2E]"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[10px] font-bold uppercase text-[#52715E]">
                        FARI Score
                      </p>
                      <p className="font-mono text-3xl font-extrabold tabular-nums text-[#1B4332]">
                        {scoreData.fariScore.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* 4 Pillar Breakdown Bars (W, E, N, M) */}
                  <div className="mt-3 space-y-2 border-b border-[#E2E8DF] pb-3">
                    {(
                      [
                        {
                          label: 'Water (W)',
                          val: scoreData.pillars.water,
                          barClass: 'bg-[#2563EB]',
                        },
                        {
                          label: 'Erosion (E)',
                          val: scoreData.pillars.erosion,
                          barClass: 'bg-[#D97706]',
                        },
                        {
                          label: 'Nutrients (N)',
                          val: scoreData.pillars.nutrients,
                          barClass: 'bg-[#1B4332]',
                        },
                        {
                          label: 'Market (M)',
                          val: scoreData.pillars.market,
                          barClass: 'bg-[#7C3AED]',
                        },
                      ] as const
                    ).map((pillar) => {
                      const pct = Math.round(pillar.val * 100);
                      return (
                        <div key={pillar.label} className="text-xs">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-semibold text-[#3B4D41]">
                              {pillar.label}
                            </span>
                            <span className="font-bold text-[#17271D]">
                              {pct}/100
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#E6ECE4]">
                            <div
                              className={`h-full rounded-full ${pillar.barClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Biophysical Parameter Chips */}
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-b border-[#E2E8DF] pb-3 font-mono text-[11px]">
                    <div className="rounded bg-[#F5F8F3] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-[#65766A]">Root Depth</dt>
                      <dd className="font-bold text-[#17271D]">
                        {strategy.rootDepthCm} cm (Ideal {scoreData.diagnostics.idealRootCm} cm)
                      </dd>
                    </div>
                    <div className="rounded bg-[#F5F8F3] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-[#65766A]">N-Fixation</dt>
                      <dd className="font-bold text-[#17271D]">
                        +{strategy.nFixKgHa} kg N/ha
                        {strategy.nFixKgHa > 0 && (
                          <span
                            title="Projected estimate: modeled biological nitrogen fixation, not a measured field result."
                            className="ml-1 rounded bg-[#FFF3CD] px-1 py-0.5 text-[8px] font-bold text-[#856404]"
                          >
                            Projected estimate
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="rounded bg-[#F5F8F3] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-[#65766A]">Canopy Closure</dt>
                      <dd className="font-bold text-[#17271D]">
                        {strategy.canopyClosureDays} days
                      </dd>
                    </div>
                    <div className="rounded bg-[#F5F8F3] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-[#65766A]">Cash Turnaround</dt>
                      <dd className="font-bold text-[#17271D]">
                        {strategy.cashTurnaroundDays} days
                      </dd>
                    </div>
                  </dl>

                  {/* All 5 Mandatory Rubric Explanations */}
                  <div className="mt-3 space-y-2.5 text-xs leading-5">
                    <div>
                      <p className="font-bold text-[#1B4332]">
                        {t.whySuggestedLabel}
                      </p>
                      <p className="text-[#3B4D41]">
                        {strategy.explanations.whySuggested}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-[#1D4E89]">
                        {t.supportingEvidenceLabel}
                      </p>
                      <p className="text-[#3B4D41]">
                        {strategy.explanations.supportingEvidence}
                      </p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-[#DCE5D8] bg-[#F8FAF7] p-2 font-mono text-[10px] text-[#3B4D41] sm:grid-cols-3">
                        <div>
                          <dt>NASA POWER T2M</dt>
                          <dd className="font-bold">{monthlyTelemetry.t2m.toFixed(1)}°C</dd>
                        </div>
                        <div>
                          <dt>NASA POWER PRECTOTCORR</dt>
                          <dd className="font-bold">{monthlyTelemetry.precCorr.toFixed(2)} mm/day</dd>
                        </div>
                        <div>
                          <dt>GPM IMERG precipitation</dt>
                          <dd className="font-bold">{monthlyTelemetry.imergPrecipitationMmDay.toFixed(2)} mm/day</dd>
                        </div>
                        <div>
                          <dt>POWER GWETROOT index</dt>
                          <dd className="font-bold">{monthlyTelemetry.gwetRoot.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt>POWER GWETTOP index</dt>
                          <dd className="font-bold">{monthlyTelemetry.gwetTop.toFixed(2)}</dd>
                        </div>
                        <div>
                          <dt>SRTM terrain context</dt>
                          <dd className="font-bold">{farm.slopePct}% slope</dd>
                        </div>
                      </dl>
                      {stressScenario !== 'baseline' && (
                        <p className="mt-1 text-[10px] text-[#92400E]">
                          Scenario-adjusted inputs: T2M {evaluation.climate.adjustedTempC.toFixed(1)}°C, rain{' '}
                          {evaluation.climate.adjustedDailyPrecipMm.toFixed(2)} mm/day, GWETROOT{' '}
                          {evaluation.climate.adjustedGwetRoot.toFixed(2)}.
                          <span className="ml-1 rounded bg-amber-100 px-1 font-bold">Illustrative / modeled</span>
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-[#65766A]">
                        SMAP, ECOSTRESS, and Sentinel-2/Landsat values are not ingested as farm-point observations here; related map overlays are{' '}
                        <span className="rounded bg-amber-100 px-1 font-bold text-amber-900">Illustrative / modeled</span>.
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-[#2D6A4F]">
                        {t.expectedBenefitsLabel}
                      </p>
                      <p className="text-[#3B4D41]">
                        {strategy.explanations.expectedBenefits}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#E2E8DF] bg-[#F8FAF7] p-2.5">
                      <p className="font-bold text-[#52715E]">
                        {t.dataGapsLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#536458]">
                        {strategy.explanations.dataGaps}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#F3D9A4] bg-[#FFFBEB] p-2.5">
                      <p className="font-bold text-[#92400E]">
                        {t.localReviewAlertsLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#78350F]">
                        {strategy.explanations.localReviewAlerts}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 12-Month Bare-Field & Pest-Disruption Gantt Timeline */}
      <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              <h3 className="text-base font-extrabold text-[#17271D]">
                {t.timelineTitle}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#536458]">
              Ground-cover estimates show bare-field exposure; the shield marks a planned pest/disease management interval. Click a month to inspect its telemetry.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[#536458]">{PEST_DISRUPTION_NOTES[farmId]}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
            {Object.entries(STAGE_STYLES).map(([key, style]) => (
              <span
                key={key}
                className={`rounded px-2 py-0.5 ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4DDD0] font-mono text-[10px] uppercase text-[#52715E]">
                <th className="py-2 pr-3 font-bold">Strategy</th>
                {farm.strategies[0].monthlySchedule.map((item) => (
                  <th key={item.month} className="px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectMonth?.(item.month)}
                      className={`w-full rounded px-1.5 py-1 font-bold transition-colors ${
                        selectedMonth === item.month
                          ? 'bg-[#1B4332] text-white'
                          : 'hover:bg-[#E2ECE0]'
                      }`}
                    >
                      {item.monthLabel}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8DF]">
              {farm.strategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td className="py-2.5 pr-3 font-bold text-[#17271D]">
                    <div className="font-mono text-[10px] text-[#52715E]">
                      {strategy.id}
                    </div>
                    <div className="max-w-[160px] truncate" title={strategy.name}>
                      {strategy.shortLabel}
                    </div>
                  </td>
                  {strategy.monthlySchedule.map((cell) => {
                    const style =
                      STAGE_STYLES[cell.stage] ?? STAGE_STYLES['main-crop'];
                    return (
                      <td key={cell.month} className="p-1 align-top">
                        <div
                          className={`flex min-h-[58px] flex-col justify-between rounded-md p-1.5 text-[10px] leading-tight ${style.bg} ${style.text} ${
                            selectedMonth === cell.month
                              ? 'ring-2 ring-[#1B4332] ring-offset-1'
                              : ''
                          }`}
                        >
                          <span className="font-bold">{cell.cropLabel}</span>
                          <div className="mt-1 flex items-center justify-between font-mono text-[9px] opacity-90">
                            <span>{cell.groundCoverPct}% cov</span>
                            {cell.pestBreakActive && (
                              <span
                                title={farmId === 'guimaras'
                                  ? 'Living cover and mulch reduce soil splash; mango remains the host crop'
                                  : 'Scheduled non-host phase; pest populations are not measured'}
                                className="inline-flex items-center rounded bg-white/25 px-1 font-bold"
                              >
                                {farmId === 'guimaras' ? 'Splash Control' : 'Host Break'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Literature-Range Projected Impact Indicator Cards (Mandatory Projected Estimate Badge & Tooltip) */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-[#17271D]">
              {t.projectedImpactsTitle}
            </h3>
          </div>
          <span
            title={t.projectedEstimateTooltip}
            className="inline-flex items-center gap-1 rounded-full border border-[#D97706]/40 bg-[#FFFBEB] px-2.5 py-1 font-mono text-[10px] font-bold text-[#92400E]"
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            {t.projectedEstimateBadge} — Hover or read note for scientific bounds
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projectedImpactCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#F9FBF8] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    title={t.projectedEstimateTooltip}
                    className="inline-flex items-center gap-1 rounded bg-[#FFF3CD] px-2 py-0.5 font-mono text-[10px] font-bold text-[#856404]"
                  >
                    {t.projectedEstimateBadge}
                  </span>
                  <CheckCircle2
                    className="h-4 w-4 text-[#2D6A4F]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2.5 font-mono text-xl font-extrabold text-[#1B4332]">
                  {card.metric}
                </p>
                <h4 className="mt-1 text-xs font-extrabold text-[#17271D]">
                  {card.title}
                </h4>
                <p className="mt-1.5 text-xs leading-5 text-[#536458]">
                  {card.detail}
                </p>
              </div>
              <div className="mt-3 border-t border-[#E2E8DF] pt-2 text-[10px] leading-4 text-[#65766A]">
                <p className="font-semibold text-[#3B4D41]">
                  Basis: {card.source}
                </p>
                <p className="mt-0.5 italic">{t.projectedEstimateTooltip}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
