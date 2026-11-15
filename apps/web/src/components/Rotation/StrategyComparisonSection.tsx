import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  ClipboardCopy,
  Info,
  Layers,
  Printer,
  Sprout,
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
  PLACES_BY_ID,
  PriorityWeights,
  rankFarmStrategies,
  StressScenarioId,
  StrategyId,
  CropStrategy,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';
import { ScenarioControls } from '../Controls/ScenarioControls';
import { StressToggles } from '../Controls/StressToggles';
import { PrintableFieldBrief } from './PrintableFieldBrief';
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
  displayMode?: 'all' | 'controls' | 'compare' | 'review';
  selectedStrategyId?: StrategyId | null;
  onSelectStrategy?: (strategyId: StrategyId) => void;
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
  displayMode = 'all',
  selectedStrategyId = null,
  onSelectStrategy,
}) => {
  const { t } = useLanguage();
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
  const [copyFailed, setCopyFailed] = useState(false);

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
  const planScore = selectedStrategyId
    ? evaluation.strategies.find((score) => score.strategyId === selectedStrategyId) ?? topScore
    : topScore;
  const planStrategyObj =
    farm.strategies.find((strategy) => strategy.id === planScore.strategyId) ??
    farm.strategies[0];
  const showControls = displayMode === 'all' || displayMode === 'controls';
  const showComparison = displayMode === 'all' || displayMode === 'compare';
  const isReview = displayMode === 'review';
  const strategyById: Record<StrategyId, CropStrategy> = {
    S1: farm.strategies.find((strategy) => strategy.id === 'S1') ?? farm.strategies[0],
    S2: farm.strategies.find((strategy) => strategy.id === 'S2') ?? farm.strategies[0],
    S3: farm.strategies.find((strategy) => strategy.id === 'S3') ?? farm.strategies[0],
  };

  const isDroughtCondition =
    stressScenario === 'drought' ||
    evaluation.climate.adjustedGwetRoot < 0.6 ||
    evaluation.climate.adjustedGwetTop < 0.55;

  const fieldBrief = formatSmsFieldBrief({
    farm,
    climate: evaluation.climate,
    topScore: planScore,
    topStrategy: planStrategyObj,
    cfiWindow: cfiWindows[0],
    droughtAlert: isDroughtCondition ? t.droughtAlertBanner : undefined,
  });
  const fieldAdvisory = isDroughtCondition
    ? t.droughtAlertBanner
    : `No drought trigger is active. Review the ${cfiWindows[0].badgeText.toLowerCase()} 90-day spray window before applying inputs.`;

  const handleWeightChange = (key: keyof PriorityWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  const handleConstraintChange = (key: keyof FieldConstraints, value: boolean) => {
    setConstraints((previous) => ({ ...previous, [key]: value }));
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopFieldAdvisorySpeech();
      setIsSpeaking(false);
      return;
    }

    const riskText = isDroughtCondition
      ? `Urgent water stress advisory: ${t.droughtAlertBanner}`
      : `Spray window status: ${cfiWindows[0].badgeText}. ${cfiWindows[0].farmerActionAdvisory}`;
    const speechText = `${farm.name}, ${evaluation.climate.monthLabel}. ${riskText} Draft strategy: ${planStrategyObj.name}, scoring ${planScore.fariScore.toFixed(1)} out of 100. ${planStrategyObj.explanations.whySuggested} Local review alert: ${planStrategyObj.explanations.localReviewAlerts}`;
    setIsSpeaking(true);
    speakFieldAdvisory(speechText, 'en', () => setIsSpeaking(false));
  };

  const handleCopyBrief = async () => {
    let copied = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fieldBrief);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied && typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = fieldBrief;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      textarea.remove();
    }
    setCopiedSms(copied);
    setCopyFailed(!copied);
    if (copied) window.setTimeout(() => setCopiedSms(false), 2500);
  };

  const handlePrintBrief = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  const projectedImpactCards = [
    {
      metric: planStrategyObj.nFixKgHa > 0 ? '+35 to +80 kg N/ha' : 'No legume N modeled',
      title: 'Biological Nitrogen Fixation',
      detail: `The literature range applies to legume systems. This strategy has ${planStrategyObj.nFixKgHa} kg N/ha configured as a modeled input; actual fixation depends on field conditions and nodulation.`,
      source: 'FAO / IRRI tropical grain-legume biological N-fixation range',
    },
    {
      metric: planStrategyObj.nFixKgHa > 0 ? '25-40% potential' : 'Not modeled for baseline',
      title: 'Synthetic Urea Reduction Potential',
      detail: 'Literature range for legume residue systems in a following cropping cycle. Confirm soil N and fertilizer needs with a local test; this is not a fertilizer prescription.',
      source: 'PCARRD / DA-BAR legume-cereal rotation trials',
    },
    {
      metric: farmId === 'bukidnon' ? 'Up to 75%' : 'Bukidnon trial reference',
      title: 'Slope Soil Erosion Reduction',
      detail: `The up-to-75% literature estimate comes from contour-trial context on 8-15% Bukidnon slopes. It is not a measured or guaranteed reduction at ${farm.name} (${farm.slopePct}% configured slope).`,
      source: 'World Agroforestry (ICRAF) NVS contour trials in Bukidnon (8-15% slopes)',
    },
    {
      metric: farmId === 'guimaras' ? 'PHP 15,000-35,000/ha potential' : 'Guimaras mango reference',
      title: 'Potential Avoided Spray Washout Loss',
      detail: farmId === 'guimaras'
        ? 'A literature-range cost exposure for mango spray washout. The 90-day historical screen flags periods to verify with a current local forecast; it cannot guarantee zero washout or savings.'
        : 'This cost range refers to Guimaras mango flower-induction and foliar-spray context. It is not an estimate for this farm or crop system.',
      source: 'BPI-NMRDC Guimaras mango induction & smallholder input cost benchmarks',
    },
  ];

  return (
    <section
      id="fari-engine"
      aria-labelledby="fari-engine-heading"
      className="scroll-mt-28 space-y-6 rounded-2xl border border-[#D4DDD0] bg-white p-5 shadow-xs sm:p-7"
    >
      <PrintableFieldBrief
        farm={farm}
        place={PLACES_BY_ID[farmId]}
        climate={evaluation.climate}
        monthlyTelemetry={monthlyTelemetry}
        strategyScores={evaluation.rankedStrategies}
        strategyById={strategyById}
        selectedStrategy={planStrategyObj}
        selectedScore={planScore}
        hasFarmerChoice={selectedStrategyId !== null}
        weights={evaluation.normalizedWeights}
        constraints={evaluation.constraints}
        cfiWindows={cfiWindows}
        droughtAlert={isDroughtCondition ? t.droughtAlertBanner : undefined}
      />
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
            {displayMode === 'controls' ? 'Set priorities for this season' : displayMode === 'compare' ? 'Compare three crop strategies' : isReview ? 'Your draft field plan' : t.fariSectionTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#536458]">
            {displayMode === 'controls'
              ? 'Tell FieldShift what matters on this field, then test a climate scenario. Scores recalculate from these choices.'
              : displayMode === 'compare'
                ? 'See how each strategy performs under the priorities and scenario you selected. Expand the evidence before deciding what to review locally.'
                : isReview
                  ? 'A detailed, printable field-planning report with data, assumptions, all three strategy scores, the 90-day screen, and local verification steps.'
                  : t.fariSectionSubtitle}
          </p>
        </div>

        {/* Field Extension / Voice / SMS Actions */}
        {displayMode !== 'controls' && <div className="flex flex-wrap items-center gap-2">
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
          <span aria-live="polite" className="text-xs font-semibold text-[#536458]">
            {copiedSms ? 'Brief copied.' : copyFailed ? 'Copy unavailable in this browser.' : ''}
          </span>
          <button
            type="button"
            onClick={handlePrintBrief}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>{t.printBriefButton}</span>
          </button>
        </div>}
        {copyFailed && (
          <span role="status" className="sr-only">Copy failed. Select and copy the brief from the printable version.</span>
        )}
      </div>

      {/* English Drought / Low-Moisture Action Banner */}
      <div
        role="region"
        aria-label="Field moisture & spray advisory banner"
        className={`rounded-xl border p-4 ${
          isDroughtCondition
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
              </div>
              <p className="mt-1 text-sm font-bold text-[#1F2937]">
                {fieldAdvisory}
              </p>
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

      {showControls && <div className="grid gap-5 lg:grid-cols-12">
        <ScenarioControls
          weights={weights}
          normalizedWeights={evaluation.normalizedWeights}
          constraints={constraints}
          slopePct={farm.slopePct}
          labels={t}
          onWeightChange={handleWeightChange}
          onConstraintChange={handleConstraintChange}
          onResetWeights={() => setWeights({ water: 25, erosion: 25, nutrients: 25, market: 25 })}
        />
        <StressToggles
          scenario={stressScenario}
          climate={evaluation.climate}
          cfiWindows={cfiWindows}
          slopePct={farm.slopePct}
          labels={t}
          onScenarioChange={setStressScenario}
        />
      </div>}
      {isReview && (
        <section aria-labelledby="draft-plan-heading" className="overflow-hidden rounded-2xl border border-[#BCD3C2] bg-[#F3F7F0]">
          <div className="grid lg:grid-cols-[1fr_0.72fr]">
            <div className="p-5 sm:p-7">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#52715E]">{selectedStrategyId ? 'Your draft choice' : 'Leading option to consider'} · {farm.name}</p>
              <h3 id="draft-plan-heading" className="mt-2 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-[#17271D] sm:text-3xl">{planStrategyObj.name}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#465A4E]">{selectedStrategyId ? 'You selected this option as a starting point. Review its trade-offs and confirm it with a local farmer or extension officer before planting.' : 'This option currently ranks highest for your priorities and scenario. Return to Compare rotations to choose this or another option for your draft.'}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {planStrategyObj.crops.map((crop) => <span key={crop} className="rounded-full border border-[#C8D7C7] bg-white px-3 py-1.5 text-xs font-semibold text-[#263B2E]">{crop}</span>)}
              </div>
            </div>
            <div className="bg-[#10251B] p-5 text-white sm:p-7">
              <div className="flex items-end justify-between gap-3 border-b border-white/15 pb-4">
                <div><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#C5D5C5]">FARI · 0–100</p><p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-[#D4E6A7]">{planScore.fariScore.toFixed(1)}</p></div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{selectedStrategyId ? `Rank #${planScore.rank} · your choice` : 'Highest score · not selected'}</span>
              </div>
              <p className="mt-4 text-sm font-semibold">{evaluation.climate.scenarioLabel} · {evaluation.climate.monthLabel}</p>
              <p className="mt-1 text-xs leading-5 text-[#D0DAD1]">Historical NASA POWER / GPM IMERG baseline with the selected what-if adjustments.</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#D4E6A7]">Before planting, confirm locally</p>
                <p className="mt-1.5 text-xs leading-5 text-white/85">Soil pH and N-P-K, seed access, water supply, drainage, labor, and current local advice.</p>
              </div>
            </div>
          </div>
          <p className="border-t border-[#D8E2D4] px-5 py-3 text-xs leading-5 text-[#526257] sm:px-7">The score ranks the options using your selected weights. It does not guarantee yield or account for every field condition.</p>
        </section>
      )}
      {/* 3-Strategy Side-by-Side Comparison Cards (S1, S2, S3) */}
      {showComparison && <>
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
                  selectedStrategyId === strategy.id
                    ? 'border-2 border-[#1D6B46] bg-[#F3FAF5] shadow-md'
                    : isTopRanked
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
                          <dt>Configured slope context</dt>
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
                        Map imagery is shown separately and does not enter these farm-level scores. Scores use historical climate data and clearly labeled what-if adjustments.
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
                {displayMode === 'compare' && (
                  <button
                    type="button"
                    aria-pressed={selectedStrategyId === strategy.id}
                    onClick={() => onSelectStrategy?.(strategy.id)}
                    className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${selectedStrategyId === strategy.id ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'}`}
                  >
                    {selectedStrategyId === strategy.id ? 'Selected for my draft' : 'Use as my draft plan'}
                  </button>
                )}
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
                  <Info
                    className="h-4 w-4 text-[#9A6B0D]"
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
      </>}
    </section>
  );
};
