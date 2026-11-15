import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { PlotStrategyShocks, PriorityWeights } from '@fieldshift/climate-data';

export interface SimulationPanelProps {
  weights: PriorityWeights;
  normalizedWeights: PriorityWeights;
  shocks: PlotStrategyShocks;
  onWeightChange: (key: keyof PriorityWeights, value: number) => void;
  onShockChange: (key: keyof PlotStrategyShocks, value: boolean) => void;
  onReset: () => void;
}

const SLIDER_ITEMS: ReadonlyArray<{ key: keyof PriorityWeights; label: string }> = [
  { key: 'water', label: 'Conserve Water' },
  { key: 'erosion', label: 'Stop Soil Erosion' },
  { key: 'nutrients', label: 'Rebuild Soil Nutrients' },
  { key: 'market', label: 'Supplemental Income' },
];

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  weights,
  normalizedWeights,
  shocks,
  onWeightChange,
  onShockChange,
  onReset,
}) => {
  const allZero =
    weights.water === 0 &&
    weights.erosion === 0 &&
    weights.nutrients === 0 &&
    weights.market === 0;

  return (
    <section
      aria-label="Priority and stress simulation"
      className="space-y-5 rounded-2xl border border-[#D4DDD0] bg-[#F7FAF5] p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-[#17271D]">
          Simulate your priorities
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#1B4332] transition-colors hover:bg-[#EEF4EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {SLIDER_ITEMS.map(({ key, label }) => {
          const sharePct = Math.round(normalizedWeights[key] * 100);
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <label
                  htmlFor={`dash-slider-${key}`}
                  className="font-bold text-[#263B2E]"
                >
                  {label}
                </label>
                <span className="font-mono tabular-nums text-[#52715E]">
                  {weights[key]} · {sharePct}% share
                </span>
              </div>
              <input
                id={`dash-slider-${key}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={weights[key]}
                onChange={(e) => onWeightChange(key, Number(e.target.value))}
                className="min-h-8 w-full cursor-pointer accent-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
              />
            </div>
          );
        })}

        {allZero && (
          <p
            role="status"
            className="rounded-xl border border-[#F3D9A4] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]"
          >
            All priority sliders are at 0 — defaulting to equal 25% share across all four pillars.
          </p>
        )}
      </div>

      <div className="space-y-2.5 border-t border-[#DCE5D8] pt-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
          What-if climate &amp; seed toggles
        </p>

        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-[#D4DDD0] bg-white px-3 py-2 text-xs text-[#263B2E] hover:border-[#1B4332]">
          <input
            type="checkbox"
            checked={shocks.rainfallShock}
            onChange={(e) => onShockChange('rainfallShock', e.target.checked)}
            className="h-4 w-4 rounded accent-[#1B4332]"
          />
          <span className="font-semibold">−20% Rainfall Drought Shock</span>
        </label>

        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-[#D4DDD0] bg-white px-3 py-2 text-xs text-[#263B2E] hover:border-[#1B4332]">
          <input
            type="checkbox"
            checked={shocks.heatShock}
            onChange={(e) => onShockChange('heatShock', e.target.checked)}
            className="h-4 w-4 rounded accent-[#1B4332]"
          />
          <span className="font-semibold">+2°C Heatwave Shock</span>
        </label>

        <label className="flex min-h-10 cursor-pointer items-start gap-2.5 rounded-xl border border-[#D4DDD0] bg-white px-3 py-2 text-xs text-[#263B2E] hover:border-[#1B4332]">
          <input
            type="checkbox"
            checked={shocks.localSeedFallback}
            onChange={(e) => onShockChange('localSeedFallback', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-[#1B4332]"
          />
          <div>
            <span className="block font-semibold">Local Seed Fallback</span>
            <span className="mt-0.5 block text-[11px] text-[#65766A]">
              Substitutes commercial hybrids with farmer-reproducible OPVs (e.g., Pag-asa 7 Mungbean, Tiniguib White Corn, Super Bureau Camote) where applicable.
            </span>
          </div>
        </label>
      </div>

      <p className="text-[11px] leading-relaxed text-[#65766A]">
        What-if shocks are modeled adjustments to historical averages, not forecasts.
      </p>
    </section>
  );
};
