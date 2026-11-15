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
      className="space-y-5 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#F0F9FF]">
          Simulate your priorities
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-400/25 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:bg-[#132240] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
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
                  className="font-semibold text-[#F0F9FF]"
                >
                  {label}
                </label>
                <span className="tabular-nums text-[#94A3B8]">
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
                className="fieldshift-slider min-h-10 w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              />
            </div>
          );
        })}

        {allZero && (
          <p
            role="status"
            className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          >
            All priority sliders are at 0 — defaulting to equal 25% share across all four pillars.
          </p>
        )}
      </div>

      <div className="space-y-2.5 border-t border-sky-400/15 pt-4">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#7DD3FC]">
          What-if climate &amp; seed toggles
        </p>

        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-sky-400/15 bg-[#0D182E]/85 px-3 py-2 text-xs text-[#F0F9FF] transition-colors hover:border-sky-400/35">
          <input
            type="checkbox"
            checked={shocks.rainfallShock}
            onChange={(e) => onShockChange('rainfallShock', e.target.checked)}
            className="h-4 w-4 rounded accent-amber-400"
          />
          <span className="font-medium">−20% Rainfall Drought Shock</span>
        </label>

        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-sky-400/15 bg-[#0D182E]/85 px-3 py-2 text-xs text-[#F0F9FF] transition-colors hover:border-sky-400/35">
          <input
            type="checkbox"
            checked={shocks.heatShock}
            onChange={(e) => onShockChange('heatShock', e.target.checked)}
            className="h-4 w-4 rounded accent-amber-400"
          />
          <span className="font-medium">+2°C Heatwave Shock</span>
        </label>

        <label className="flex min-h-10 cursor-pointer items-start gap-2.5 rounded-xl border border-sky-400/15 bg-[#0D182E]/85 px-3 py-2 text-xs text-[#F0F9FF] transition-colors hover:border-sky-400/35">
          <input
            type="checkbox"
            checked={shocks.localSeedFallback}
            onChange={(e) => onShockChange('localSeedFallback', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-emerald-400"
          />
          <div>
            <span className="block font-medium">Local Seed Fallback</span>
            <span className="mt-0.5 block text-[11px] text-[#94A3B8]">
              Substitutes commercial hybrids with farmer-reproducible OPVs (e.g., Pag-asa 7 Mungbean, Tiniguib White Corn, Super Bureau Camote) where applicable.
            </span>
          </div>
        </label>
      </div>

      <p className="text-[11px] leading-relaxed text-[#94A3B8]">
        What-if shocks are modeled adjustments to historical averages, not forecasts.
      </p>
    </section>
  );
};
