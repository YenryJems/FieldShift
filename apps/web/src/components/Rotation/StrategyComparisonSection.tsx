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
  DEFAULT_PRIORITY_WEIGHTS,
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

const INITIAL_PRIORITY_WEIGHTS: PriorityWeights = {
  water: Math.round(DEFAULT_PRIORITY_WEIGHTS.water * 100),
  erosion: Math.round(DEFAULT_PRIORITY_WEIGHTS.erosion * 100),
  nutrients: Math.round(DEFAULT_PRIORITY_WEIGHTS.nutrients * 100),
  market: Math.round(DEFAULT_PRIORITY_WEIGHTS.market * 100),
};

interface StrategyComparisonSectionProps {
  farmId: FarmId;
  selectedMonth: number;
  onSelectMonth?: (month: number) => void;
  displayMode?: 'all' | 'controls' | 'compare' | 'review';
  selectedStrategyId?: StrategyId | null;
  onSelectStrategy?: (strategyId: StrategyId) => void;
  weights?: PriorityWeights;
  onWeightsChange?: (weights: PriorityWeights) => void;
  stressScenario?: StressScenarioId;
  onStressScenarioChange?: (scenario: StressScenarioId) => void;
  constraints?: FieldConstraints;
  onConstraintsChange?: (constraints: FieldConstraints) => void;
  onEditPriorities?: () => void;
}

const STAGE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  'main-crop': {
    bg: 'bg-sky-400',
    text: 'text-[#040811]',
    label: 'Primary Crop',
  },
  'legume-relay': {
    bg: 'bg-sky-400/25 border border-sky-400/40',
    text: 'text-[#F0F9FF]',
    label: 'N-Fixing Legume Relay',
  },
  'resilient-relay': {
    bg: 'bg-[#0D182E] border border-sky-300/40',
    text: 'text-[#7DD3FC]',
    label: 'Drought/Slope Resilient Relay',
  },
  'cover-mulch': {
    bg: 'bg-emerald-400/20 border border-emerald-400/35',
    text: 'text-emerald-200',
    label: 'Protective Cover / Mulch',
  },
  'harvest-transition': {
    bg: 'bg-[#0D182E] border border-sky-400/20',
    text: 'text-[#CBD5E1]',
    label: 'Harvest & Residue Return',
  },
  'bare-fallow': {
    bg: 'bg-[#08101F] border border-dashed border-sky-400/25',
    text: 'text-[#94A3B8]',
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
  weights: controlledWeights,
  onWeightsChange,
  stressScenario: controlledStressScenario,
  onStressScenarioChange,
  constraints: controlledConstraints,
  onConstraintsChange,
  onEditPriorities,
}) => {
  const { t } = useLanguage();
  const [internalWeights, setInternalWeights] = useState<PriorityWeights>(
    INITIAL_PRIORITY_WEIGHTS,
  );
  const [internalStressScenario, setInternalStressScenario] =
    useState<StressScenarioId>('baseline');
  const [internalConstraints, setInternalConstraints] = useState<FieldConstraints>(
    DEFAULT_FIELD_CONSTRAINTS,
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const weights = controlledWeights ?? internalWeights;
  const stressScenario = controlledStressScenario ?? internalStressScenario;
  const constraints = controlledConstraints ?? internalConstraints;

  const updateWeights = (next: PriorityWeights) => {
    if (controlledWeights === undefined) {
      setInternalWeights(next);
    }
    onWeightsChange?.(next);
  };

  const updateStressScenario = (next: StressScenarioId) => {
    if (controlledStressScenario === undefined) {
      setInternalStressScenario(next);
    }
    onStressScenarioChange?.(next);
  };

  const updateConstraints = (next: FieldConstraints) => {
    if (controlledConstraints === undefined) {
      setInternalConstraints(next);
    }
    onConstraintsChange?.(next);
  };

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
    evaluation.climate.adjustedRootZoneMoisturePct < 60 ||
    evaluation.climate.adjustedSurfaceMoisturePct < 55;

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
    updateWeights({
      ...weights,
      [key]: Math.max(0, Math.min(100, value)),
    });
  };

  const handleConstraintChange = (key: keyof FieldConstraints, value: boolean) => {
    updateConstraints({ ...constraints, [key]: value });
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
      className="scroll-mt-28 space-y-6 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-7"
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
      <div className="flex flex-col gap-4 border-b border-sky-400/20 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-[#0D182E] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#7DD3FC]">
              <Sprout className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
              FARI Multi-Criteria Engine · 0–100 Scale
            </span>
            {farm.isBenchmarkPlot && (
              <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#CBD5E1]">
                Global Space Agency Benchmark Plot ({farm.country})
              </span>
            )}
          </div>
          <h2
            id="fari-engine-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-[#F0F9FF] sm:text-3xl"
          >
            {displayMode === 'controls' ? 'Set priorities for this season' : displayMode === 'compare' ? 'Compare three crop strategies' : isReview ? 'Your draft field plan' : t.fariSectionTitle}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
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
                  ? 'border-sky-400 bg-sky-400 text-[#040811]'
                  : 'border-sky-400/20 bg-[#0D182E] text-[#F0F9FF] hover:border-sky-400/50 hover:bg-[#0B1426]'
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 py-2 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#0B1426]"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            <span>{copiedSms ? 'Copied SMS brief!' : t.copySmsBriefButton}</span>
          </button>
          <span aria-live="polite" className="text-xs font-semibold text-[#7DD3FC]">
            {copiedSms ? 'Brief copied.' : copyFailed ? 'Copy unavailable in this browser.' : ''}
          </span>
          <button
            type="button"
            onClick={handlePrintBrief}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-sky-400 px-3 py-2 text-xs font-bold text-[#040811] transition-colors hover:bg-sky-300"
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
            ? 'border-amber-400/40 bg-[#0D182E]'
            : 'border-sky-400/20 bg-[#0D182E]'
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`mt-0.5 h-5 w-5 shrink-0 ${isDroughtCondition ? 'text-[#FBBF24]' : 'text-[#38BDF8]'}`}
              aria-hidden="true"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
                  Field Action Advisory · {t.languageName}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-[#F0F9FF]">
                {fieldAdvisory}
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-sky-400/20 bg-[#0B1426] px-3 py-2 font-mono text-xs text-[#CBD5E1]">
            <div>
              Root-Zone Moisture: <strong className="text-[#38BDF8]">{evaluation.climate.adjustedRootZoneMoisturePct}%</strong>
            </div>
            <div>
              Surface Moisture: <strong className="text-[#38BDF8]">{evaluation.climate.adjustedSurfaceMoisturePct}%</strong>
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
          onResetWeights={() => updateWeights(INITIAL_PRIORITY_WEIGHTS)}
        />
        <StressToggles
          scenario={stressScenario}
          climate={evaluation.climate}
          cfiWindows={cfiWindows}
          slopePct={farm.slopePct}
          labels={t}
          onScenarioChange={updateStressScenario}
        />
      </div>}
      {isReview && (
        <section aria-labelledby="draft-plan-heading" className="overflow-hidden rounded-2xl border border-sky-400/20 bg-[#0D182E]">
          <div className="grid lg:grid-cols-[1fr_0.72fr]">
            <div className="p-5 sm:p-7">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300/75">{selectedStrategyId ? 'Your draft choice' : 'Leading option to consider'} · {farm.name}</p>
              <h3 id="draft-plan-heading" className="mt-2 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-[#F0F9FF] sm:text-3xl">{planStrategyObj.name}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">{selectedStrategyId ? 'You selected this option as a starting point. Review its trade-offs and confirm it with a local farmer or extension officer before planting.' : 'This option currently ranks highest for your priorities and scenario. Return to Priorities & Rotations to choose this or another option for your draft.'}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {planStrategyObj.crops.map((crop) => <span key={crop} className="rounded-full border border-sky-400/20 bg-[#0B1426] px-3 py-1.5 text-xs font-semibold text-[#F0F9FF]">{crop}</span>)}
              </div>
              <div className="mt-4 rounded-xl border border-sky-400/20 bg-[#0B1426] p-3.5 text-xs text-[#94A3B8]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
                    Active priority weights &amp; constraints
                  </span>
                  {onEditPriorities && (
                    <button
                      type="button"
                      onClick={onEditPriorities}
                      className="inline-flex min-h-8 items-center rounded-md border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 text-[11px] font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#08101F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    >
                      Edit priorities or change draft →
                    </button>
                  )}
                </div>
                <p className="mt-2 font-mono text-[11px] font-bold text-[#38BDF8]">
                  W {Math.round(evaluation.normalizedWeights.water * 100)}% / E {Math.round(evaluation.normalizedWeights.erosion * 100)}% / N {Math.round(evaluation.normalizedWeights.nutrients * 100)}% / M {Math.round(evaluation.normalizedWeights.market * 100)}%
                </p>
                <p className="mt-1 text-[11px] text-[#94A3B8]">
                  Constraints:{' '}
                  {[
                    constraints.rainfedOnly ? 'Rainfed Only' : null,
                    constraints.manualToolsOnly ? 'Manual Tools Only' : null,
                    constraints.fastCashNeeded ? 'Fast 60-Day Cash Needed' : null,
                  ]
                    .filter((item): item is string => item !== null)
                    .join(' · ') || 'None active'}
                </p>
              </div>
            </div>
            <div className="border-t border-sky-400/20 bg-[#08101F] p-5 text-[#F0F9FF] lg:border-l lg:border-t-0 sm:p-7">
              <div className="flex items-end justify-between gap-3 border-b border-sky-400/20 pb-4">
                <div><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">FARI · 0–100</p><p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-[#38BDF8]">{planScore.fariScore.toFixed(1)}</p></div>
                <span className="rounded-full border border-sky-400/25 bg-[#0D182E] px-3 py-1.5 text-xs font-bold text-[#7DD3FC]">{selectedStrategyId ? `Rank #${planScore.rank} · your choice` : 'Highest score · not selected'}</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-[#F0F9FF]">{evaluation.climate.scenarioLabel} · {evaluation.climate.monthLabel}</p>
              <p className="mt-1 text-xs leading-5 text-[#94A3B8]">Historical NASA POWER / GPM IMERG baseline with the selected what-if adjustments.</p>
              <div className="mt-4 rounded-xl border border-sky-400/20 bg-[#0D182E] p-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-sky-300/75">Before planting, confirm locally</p>
                <p className="mt-1.5 text-xs leading-5 text-[#CBD5E1]">Soil pH and N-P-K, seed access, water supply, drainage, labor, and current local advice.</p>
              </div>
            </div>
          </div>
          <p className="border-t border-sky-400/20 px-5 py-3 text-xs leading-5 text-[#94A3B8] sm:px-7">The score ranks the options using your selected weights. It does not guarantee yield or account for every field condition.</p>
        </section>
      )}
      {/* 3-Strategy Side-by-Side Comparison Cards (S1, S2, S3) */}
      {showComparison && <>
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#F0F9FF]">
            {t.strategyComparisonTitle} — {farm.name} ({farm.locationLabel})
          </h3>
          <span className="font-mono text-xs font-semibold text-sky-300/75">
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
                className={`flex flex-col justify-between rounded-xl border p-5 ${
                  selectedStrategyId === strategy.id
                    ? 'border-2 border-sky-400 bg-[#0D182E] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                    : isTopRanked
                    ? 'border-2 border-sky-400/60 bg-[#0B1426]/90'
                    : 'border-sky-400/20 bg-[#0B1426]/85'
                }`}
              >
                <div>
                  {/* Strategy Top Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                        isTopRanked
                          ? 'bg-sky-400 text-[#040811]'
                          : 'border border-sky-400/20 bg-[#0D182E] text-[#CBD5E1]'
                      }`}
                    >
                      {isTopRanked && <Award className="h-3.5 w-3.5" aria-hidden="true" />}
                      Rank #{scoreData.rank} · {strategy.id}{' '}
                      {strategy.isBaseline ? '(Baseline Practice)' : '(Adaptive Rotation)'}
                    </span>
                    <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-2 py-1 text-[10px] font-semibold text-[#7DD3FC]">
                      {STRATEGY_ROLE_LABELS[strategy.id]}
                    </span>

                    {!strategy.isBaseline && (
                      <span
                        className={`font-mono text-xs font-extrabold ${
                          scoreData.deltaVsBaseline >= 0
                            ? 'text-[#34D399]'
                            : 'text-[#94A3B8]'
                        }`}
                      >
                        {scoreData.deltaVsBaseline >= 0 ? '+' : ''}
                        {scoreData.deltaVsBaseline.toFixed(1)} vs S1
                      </span>
                    )}
                  </div>

                  {/* Title & FARI Score */}
                  <div className="mt-3 flex items-baseline justify-between gap-3 border-b border-sky-400/20 pb-3">
                    <div>
                      <h4 className="text-base font-extrabold text-[#F0F9FF]">
                        {strategy.name}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {strategy.crops.map((crop) => (
                          <span
                            key={crop}
                            className="rounded-md border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 text-[11px] font-semibold text-[#CBD5E1]"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[10px] font-bold uppercase text-sky-300/75">
                        FARI Score
                      </p>
                      <p className="font-mono text-3xl font-extrabold tabular-nums text-[#38BDF8]">
                        {scoreData.fariScore.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* 4 Pillar Breakdown Bars (W, E, N, M) */}
                  <div className="mt-3 space-y-2 border-b border-sky-400/20 pb-3">
                    {(
                      [
                        {
                          label: 'Water (W)',
                          val: scoreData.pillars.water,
                          barClass: 'bg-sky-400',
                        },
                        {
                          label: 'Erosion (E)',
                          val: scoreData.pillars.erosion,
                          barClass: 'bg-sky-300',
                        },
                        {
                          label: 'Nutrients (N)',
                          val: scoreData.pillars.nutrients,
                          barClass: 'bg-slate-400',
                        },
                        {
                          label: 'Market (M)',
                          val: scoreData.pillars.market,
                          barClass: 'bg-slate-500',
                        },
                      ] as const
                    ).map((pillar) => {
                      const pct = Math.round(pillar.val * 100);
                      return (
                        <div key={pillar.label} className="text-xs">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-semibold text-[#CBD5E1]">
                              {pillar.label}
                            </span>
                            <span className="font-bold text-[#F0F9FF]">
                              {pct}/100
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#0D182E]">
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
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-b border-sky-400/20 pb-3 font-mono text-[11px]">
                    <div className="rounded border border-sky-400/15 bg-[#0D182E] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-sky-300/75">Root Depth</dt>
                      <dd className="font-bold text-[#F0F9FF]">
                        {strategy.rootDepthCm} cm (Ideal {scoreData.diagnostics.idealRootCm} cm)
                      </dd>
                    </div>
                    <div className="rounded border border-sky-400/15 bg-[#0D182E] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-sky-300/75">N-Fixation</dt>
                      <dd className="font-bold text-[#F0F9FF]">
                        +{strategy.nFixKgHa} kg N/ha
                        {strategy.nFixKgHa > 0 && (
                          <span
                            title="Projected estimate: modeled biological nitrogen fixation, not a measured field result."
                            className="ml-1 rounded border border-sky-400/20 bg-[#0B1426] px-1 py-0.5 text-[8px] font-bold text-[#7DD3FC]"
                          >
                            Projected estimate
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="rounded border border-sky-400/15 bg-[#0D182E] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-sky-300/75">Canopy Closure</dt>
                      <dd className="font-bold text-[#F0F9FF]">
                        {strategy.canopyClosureDays} days
                      </dd>
                    </div>
                    <div className="rounded border border-sky-400/15 bg-[#0D182E] px-2.5 py-1.5">
                      <dt className="text-[9px] uppercase text-sky-300/75">Cash Turnaround</dt>
                      <dd className="font-bold text-[#F0F9FF]">
                        {strategy.cashTurnaroundDays} days
                      </dd>
                    </div>
                  </dl>

                  <details className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-2.5 text-xs text-[#CBD5E1]">
                    <summary className="cursor-pointer select-none font-bold text-[#F0F9FF]">
                      Configured cultivars &amp; seed notes ({strategy.cultivars.length})
                    </summary>
                    <ul className="mt-2 space-y-2 border-t border-sky-400/20 pt-2">
                      {strategy.cultivars.map((cultivar) => (
                        <li
                          key={`${strategy.id}-${cultivar.crop}-${cultivar.name}`}
                          className="rounded-md border border-sky-400/20 bg-[#0B1426] p-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-bold text-[#F0F9FF]">
                              {cultivar.crop}: {cultivar.name}
                            </span>
                            <span className="rounded border border-sky-400/20 bg-[#0D182E] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#7DD3FC]">
                              {cultivar.type} · {cultivar.maturityDays} days
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-4 text-[#CBD5E1]">
                            {cultivar.traitHighlight}
                          </p>
                          <p className="mt-1 text-[10px] text-[#94A3B8]">
                            {cultivar.seedSourceNote}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] font-medium text-[#94A3B8]">
                      Seed stock not verified locally — confirm local availability and germination with your MAO or cooperative.
                    </p>
                  </details>

                  {/* All 5 Mandatory Rubric Explanations */}
                  <details className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-2.5 text-xs leading-5">
                    <summary className="cursor-pointer select-none font-bold text-[#F0F9FF]">
                      Evidence, science &amp; local review rubric (5 parts)
                    </summary>
                    <div className="mt-2.5 space-y-2.5 border-t border-sky-400/20 pt-2.5">
                      <div>
                        <p className="font-bold text-[#F0F9FF]">
                          {t.whySuggestedLabel}
                        </p>
                        <p className="text-[#CBD5E1]">
                          {strategy.explanations.whySuggested}
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-[#F0F9FF]">
                          {t.supportingEvidenceLabel}
                        </p>
                        <p className="text-[#CBD5E1]">
                          {strategy.explanations.supportingEvidence}
                        </p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-sky-400/20 bg-[#0B1426] p-2 font-mono text-[10px] text-[#94A3B8] sm:grid-cols-3">
                          <div>
                            <dt>Air Temperature</dt>
                            <dd className="font-bold text-[#F0F9FF]">{monthlyTelemetry.airTempCelsius.toFixed(1)}°C</dd>
                          </div>
                          <div>
                            <dt>Daily Rainfall</dt>
                            <dd className="font-bold text-[#F0F9FF]">{monthlyTelemetry.dailyRainfallMm.toFixed(2)} mm/day</dd>
                          </div>
                          <div>
                            <dt>GPM IMERG rainfall</dt>
                            <dd className="font-bold text-[#F0F9FF]">{monthlyTelemetry.imergRainfallMmDay.toFixed(2)} mm/day</dd>
                          </div>
                          <div>
                            <dt>Root-Zone Moisture</dt>
                            <dd className="font-bold text-[#F0F9FF]">{monthlyTelemetry.rootZoneMoisturePct}%</dd>
                          </div>
                          <div>
                            <dt>Surface Moisture</dt>
                            <dd className="font-bold text-[#F0F9FF]">{monthlyTelemetry.surfaceSoilMoisturePct}%</dd>
                          </div>
                          <div>
                            <dt>Configured slope context</dt>
                            <dd className="font-bold text-[#F0F9FF]">{farm.slopePct}% slope</dd>
                          </div>
                        </dl>
                        {stressScenario !== 'baseline' && (
                          <p className="mt-1 text-[10px] text-[#CBD5E1]">
                            Scenario-adjusted inputs: Air Temp {evaluation.climate.adjustedTempC.toFixed(1)}°C, rain{' '}
                            {evaluation.climate.adjustedDailyRainfallMm.toFixed(2)} mm/day, Root-Zone Moisture{' '}
                            {evaluation.climate.adjustedRootZoneMoisturePct}%.
                            <span className="ml-1 rounded border border-sky-400/20 bg-[#0B1426] px-1 font-bold text-[#7DD3FC]">Illustrative / modeled</span>
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-[#94A3B8]">
                          Map imagery is shown separately and does not enter these farm-level scores. Scores use historical climate data and clearly labeled what-if adjustments.
                        </p>
                      </div>
                      <div>
                        <p className="font-bold text-[#F0F9FF]">
                          {t.expectedBenefitsLabel}
                        </p>
                        <p className="text-[#CBD5E1]">
                          {strategy.explanations.expectedBenefits}
                        </p>
                      </div>
                      <div className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5">
                        <p className="font-bold text-[#F0F9FF]">
                          {t.dataGapsLabel}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#CBD5E1]">
                          {strategy.explanations.dataGaps}
                        </p>
                      </div>
                      <div className="rounded-lg border border-sky-400/25 bg-[#0B1426] p-2.5">
                        <p className="font-bold text-[#F0F9FF]">
                          {t.localReviewAlertsLabel}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#CBD5E1]">
                          {strategy.explanations.localReviewAlerts}
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
                {showComparison && (
                  <button
                    type="button"
                    aria-pressed={selectedStrategyId === strategy.id}
                    onClick={() => onSelectStrategy?.(strategy.id)}
                    className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-extrabold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                      selectedStrategyId === strategy.id
                        ? 'border-sky-400 bg-[#0D182E] text-[#38BDF8] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                        : 'border-sky-400 bg-sky-400 text-[#040811] hover:bg-sky-300'
                    }`}
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
      <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <h3 className="text-base font-extrabold text-[#F0F9FF]">
                {t.timelineTitle}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Ground-cover estimates show bare-field exposure; the shield marks a planned pest/disease management interval. Click a month to inspect its telemetry.
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">{PEST_DISRUPTION_NOTES[farmId]}</p>
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
              <tr className="border-b border-sky-400/20 font-mono text-[10px] uppercase text-sky-300/75">
                <th className="py-2 pr-3 font-bold">Strategy</th>
                {farm.strategies[0].monthlySchedule.map((item) => (
                  <th key={item.month} className="px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectMonth?.(item.month)}
                      className={`w-full rounded px-1.5 py-1 font-bold transition-colors ${
                        selectedMonth === item.month
                          ? 'bg-sky-400 text-[#040811]'
                          : 'text-[#CBD5E1] hover:bg-[#0B1426]'
                      }`}
                    >
                      {item.monthLabel}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-400/20">
              {farm.strategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td className="py-2.5 pr-3 font-bold text-[#F0F9FF]">
                    <div className="font-mono text-[10px] text-sky-300/75">
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
                              ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-[#0D182E]'
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
                                className="inline-flex items-center rounded bg-[#040811]/25 px-1 font-bold"
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
            <TrendingUp className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-[#F0F9FF]">
              {t.projectedImpactsTitle}
            </h3>
          </div>
          <span
            title={t.projectedEstimateTooltip}
            className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-[#0D182E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#7DD3FC]"
          >
            <Info className="h-3 w-3 text-[#38BDF8]" aria-hidden="true" />
            {t.projectedEstimateBadge} — Hover or read note for scientific bounds
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projectedImpactCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col justify-between rounded-xl border border-sky-400/20 bg-[#0D182E] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    title={t.projectedEstimateTooltip}
                    className="inline-flex items-center gap-1 rounded border border-sky-400/20 bg-[#0B1426] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7DD3FC]"
                  >
                    {t.projectedEstimateBadge}
                  </span>
                  <Info
                    className="h-4 w-4 text-[#94A3B8]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2.5 font-mono text-xl font-extrabold text-[#38BDF8]">
                  {card.metric}
                </p>
                <h4 className="mt-1 text-xs font-extrabold text-[#F0F9FF]">
                  {card.title}
                </h4>
                <p className="mt-1.5 text-xs leading-5 text-[#CBD5E1]">
                  {card.detail}
                </p>
              </div>
              <div className="mt-3 border-t border-sky-400/20 pt-2 text-[10px] leading-4 text-[#94A3B8]">
                <p className="font-semibold text-[#CBD5E1]">
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
