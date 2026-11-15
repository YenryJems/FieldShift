import React, { useMemo } from 'react';
import {
  clamp,
  DEFAULT_PLOT_SHOCKS,
  evaluatePlotStrategies,
  type FarmId,
  type PlotStrategyEvaluation,
  type PlotStrategyShocks,
  type PriorityWeights,
} from '@fieldshift/climate-data';
import {
  buildReadAloudScript,
  buildSmsFieldBrief,
  MONTH_SHORT,
} from '../../utils/dashboard';
import { CropStrategyBoard } from '../Rotation/CropStrategyBoard';
import { AccessibilityBar } from './AccessibilityBar';
import { HumanInTheLoopBanner } from './HumanInTheLoopBanner';
import { KpiCards } from './KpiCards';
import { SimulationPanel } from './SimulationPanel';

export interface DecisionDashboardProps {
  farmId: FarmId;
  farmName: string;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  weights: PriorityWeights;
  onWeightsChange: (weights: PriorityWeights) => void;
  shocks: PlotStrategyShocks;
  onShocksChange: (shocks: PlotStrategyShocks) => void;
  plainEnglish: boolean;
  onPlainEnglishChange: (plainEnglish: boolean) => void;
}

const DEFAULT_DASHBOARD_WEIGHTS: PriorityWeights = {
  water: 25,
  erosion: 25,
  nutrients: 25,
  market: 25,
};

export const DecisionDashboard: React.FC<DecisionDashboardProps> = ({
  farmId,
  farmName,
  selectedMonth,
  onMonthChange,
  weights,
  onWeightsChange,
  shocks,
  onShocksChange,
  plainEnglish,
  onPlainEnglishChange,
}) => {
  const evaluationResult = useMemo<{
    evaluation: PlotStrategyEvaluation | null;
    error: boolean;
  }>(() => {
    try {
      return {
        evaluation: evaluatePlotStrategies({
          farmId,
          month: selectedMonth,
          weights,
          shocks,
        }),
        error: false,
      };
    } catch {
      return { evaluation: null, error: true };
    }
  }, [farmId, selectedMonth, weights, shocks]);

  if (evaluationResult.error || !evaluationResult.evaluation) {
    return (
      <section
        id="decision-dashboard"
        className="space-y-4 rounded-3xl bg-slate-950 p-4 text-slate-100 sm:p-6"
      >
        <h2 className="text-lg font-extrabold text-slate-100 sm:text-xl">
          Field decision dashboard
        </h2>
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          Climate data unavailable for this month
        </div>
      </section>
    );
  }

  const evaluation = evaluationResult.evaluation;
  const monthLabel = MONTH_SHORT[evaluation.month - 1] ?? MONTH_SHORT[0];

  const smsText = buildSmsFieldBrief({
    farmName,
    monthLabel,
    climate: evaluation.climate,
    top: evaluation.top,
    plainEnglish,
  });

  const readAloudText = buildReadAloudScript({
    farmName,
    monthLabel,
    top: evaluation.top,
    plainEnglish,
  });

  const handleWeightChange = (key: keyof PriorityWeights, value: number) => {
    const clamped = clamp(Math.round(value), 0, 100);
    onWeightsChange({
      ...weights,
      [key]: clamped,
    });
  };

  const handleShockChange = (key: keyof PlotStrategyShocks, value: boolean) => {
    onShocksChange({
      ...shocks,
      [key]: value,
    });
  };

  const handleReset = () => {
    onWeightsChange({ ...DEFAULT_DASHBOARD_WEIGHTS });
    onShocksChange({ ...DEFAULT_PLOT_SHOCKS });
  };

  return (
    <section
      id="decision-dashboard"
      className="space-y-5 rounded-3xl bg-slate-950 p-4 text-slate-100 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold text-slate-100 sm:text-xl">
          Field decision dashboard
        </h2>
        <p className="text-xs text-slate-400">
          NASA POWER 2020–2025 climatology · {monthLabel}
        </p>
      </div>

      <AccessibilityBar
        selectedMonth={evaluation.month}
        onMonthChange={onMonthChange}
        plainEnglish={plainEnglish}
        onPlainEnglishChange={onPlainEnglishChange}
        readAloudText={readAloudText}
        smsText={smsText}
        locationName={farmName}
      />

      <KpiCards
        climate={evaluation.climate}
        topResult={evaluation.top}
        plainEnglish={plainEnglish}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SimulationPanel
          weights={weights}
          normalizedWeights={evaluation.normalizedWeights}
          shocks={shocks}
          onWeightChange={handleWeightChange}
          onShockChange={handleShockChange}
          onReset={handleReset}
        />

        <CropStrategyBoard
          evaluation={evaluation}
          plainEnglish={plainEnglish}
          farmName={farmName}
        />
      </div>

      <HumanInTheLoopBanner />
    </section>
  );
};
