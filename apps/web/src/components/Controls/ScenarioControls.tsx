import React from 'react';
import { Sliders } from 'lucide-react';
import type { FieldConstraints, PriorityWeights } from '@fieldshift/climate-data';
import type { TranslationStrings } from '../../context/LanguageContext';

type ScenarioControlLabels = Pick<
  TranslationStrings,
  | 'prioritySlidersTitle'
  | 'waterPriorityLabel'
  | 'erosionPriorityLabel'
  | 'nutrientsPriorityLabel'
  | 'marketPriorityLabel'
  | 'constraintsTitle'
  | 'constraintRainfed'
  | 'constraintManual'
  | 'constraintFastCash'
>;

interface ScenarioControlsProps {
  weights: PriorityWeights;
  normalizedWeights: PriorityWeights;
  constraints: FieldConstraints;
  slopePct: number;
  labels: ScenarioControlLabels;
  onWeightChange: (key: keyof PriorityWeights, value: number) => void;
  onConstraintChange: (key: keyof FieldConstraints, value: boolean) => void;
  onResetWeights: () => void;
}

const WEIGHT_CONTROLS = [
  { key: 'water', label: 'waterPriorityLabel', color: 'accent-[#2563EB]' },
  { key: 'erosion', label: 'erosionPriorityLabel', color: 'accent-[#D97706]' },
  { key: 'nutrients', label: 'nutrientsPriorityLabel', color: 'accent-[#1B4332]' },
  { key: 'market', label: 'marketPriorityLabel', color: 'accent-[#7C3AED]' },
] as const satisfies ReadonlyArray<{
  key: keyof PriorityWeights;
  label: 'waterPriorityLabel' | 'erosionPriorityLabel' | 'nutrientsPriorityLabel' | 'marketPriorityLabel';
  color: string;
}>;

const CONSTRAINT_CONTROLS = [
  { key: 'rainfedOnly', label: 'constraintRainfed' },
  { key: 'manualToolsOnly', label: 'constraintManual' },
  { key: 'fastCashNeeded', label: 'constraintFastCash' },
] as const satisfies ReadonlyArray<{
  key: keyof FieldConstraints;
  label: 'constraintRainfed' | 'constraintManual' | 'constraintFastCash';
}>;

export const ScenarioControls: React.FC<ScenarioControlsProps> = ({
  weights,
  normalizedWeights,
  constraints,
  slopePct,
  labels,
  onWeightChange,
  onConstraintChange,
  onResetWeights,
}) => (
  <section aria-labelledby="farmer-priority-controls" className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 sm:p-5 lg:col-span-6">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
        <h3 id="farmer-priority-controls" className="text-sm font-extrabold text-[#17271D]">
          {labels.prioritySlidersTitle}
        </h3>
      </div>
      <button
        type="button"
        onClick={onResetWeights}
        className="text-xs font-bold text-[#2D6A4F] underline hover:text-[#1B4332]"
      >
        Reset 25% each
      </button>
    </div>
    <p className="mt-1 text-xs text-[#65766A]">
      Set priorities from 0–100. Scores use normalized shares that always total 100%.
      {slopePct <= 3 && (
        <span> On this relatively flat site ({slopePct}% slope), erosion differences may be smaller than on sloped farms.</span>
      )}
    </p>
    {weights.water + weights.erosion + weights.nutrients + weights.market === 0 && (
      <p role="status" className="mt-2 rounded-md bg-blue-50 p-2 text-[11px] text-blue-900">
        All raw weights are zero, so the scoring engine uses its equal 25% fallback for each pillar.
      </p>
    )}

    <div role="group" aria-label="Farmer priority weights" className="mt-4 space-y-3">
      {WEIGHT_CONTROLS.map(({ key, label, color }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label htmlFor={`slider-${key}`} className="font-bold text-[#263B2E]">
              {labels[label]}
            </label>
            <span className="font-mono text-[11px] font-bold text-[#1B4332]">
              {Math.round(normalizedWeights[key] * 100)}% of FARI
            </span>
          </div>
          <input
            id={`slider-${key}`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={weights[key]}
            onChange={(event) => onWeightChange(key, Number(event.currentTarget.value))}
            className={`h-2 w-full cursor-pointer rounded-lg bg-[#DCE5D8] ${color}`}
          />
        </div>
      ))}
    </div>

    <div className="mt-5 border-t border-[#DCE5D8] pt-3">
      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#52715E]">
        {labels.constraintsTitle}
      </h4>
      <div role="group" aria-label="Farm operating constraints" className="mt-2 grid gap-2 sm:grid-cols-3">
        {CONSTRAINT_CONTROLS.map(({ key, label }) => (
          <label key={key} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#C7D5C5] bg-white px-3 py-2 text-xs font-semibold text-[#263B2E]">
            <input
              type="checkbox"
              checked={constraints[key]}
              onChange={(event) => onConstraintChange(key, event.currentTarget.checked)}
              className="h-4 w-4 accent-[#1B4332]"
            />
            <span>{labels[label]}</span>
          </label>
        ))}
      </div>
    </div>
  </section>
);
