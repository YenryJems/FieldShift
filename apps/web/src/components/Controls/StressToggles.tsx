import React from 'react';
import { CloudRain, Flame, ShieldCheck, Sun } from 'lucide-react';
import {
  STRESS_PRESETS,
  type AdjustedClimateContext,
  type CfiMonthWindow,
  type StressScenarioId,
} from '@fieldshift/climate-data';
import type { TranslationStrings } from '../../context/LanguageContext';

type StressToggleLabels = Pick<TranslationStrings, 'stressPresetsTitle' | 'illustrativeModeledBadge'>;

interface StressTogglesProps {
  scenario: StressScenarioId;
  climate: AdjustedClimateContext;
  cfiWindows: CfiMonthWindow[];
  slopePct: number;
  labels: StressToggleLabels;
  onScenarioChange: (scenario: StressScenarioId) => void;
}

const SCENARIO_OPTIONS = [
  { id: 'baseline', icon: ShieldCheck },
  { id: 'drought', icon: Sun },
  { id: 'heatwave', icon: Flame },
  { id: 'deluge', icon: CloudRain },
] as const;

export const StressToggles: React.FC<StressTogglesProps> = ({
  scenario,
  climate,
  cfiWindows,
  slopePct,
  labels,
  onScenarioChange,
}) => {
  const riskCounts = cfiWindows.reduce(
    (counts, window) => ({ ...counts, [window.riskLevel]: counts[window.riskLevel] + 1 }),
    { green: 0, amber: 0, red: 0 },
  );

  return (
    <section aria-labelledby="stress-scenario-heading" className="flex flex-col gap-4 rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 sm:p-5 lg:col-span-6">
      <div>
        <h3 id="stress-scenario-heading" className="text-sm font-extrabold text-[#17271D]">
          {labels.stressPresetsTitle}
        </h3>
        <p className="mt-1 text-xs text-[#65766A]">
          Runs deterministic what-if shocks against the {climate.monthLabel} NASA POWER and GPM IMERG baseline—not a forecast. Strategy scores, ranks, and the 90-day risk calendar recalculate when a preset changes.
        </p>
        <div role="group" aria-label="Climate stress scenario presets" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCENARIO_OPTIONS.map(({ id, icon: Icon }) => {
            const preset = STRESS_PRESETS[id];
            const active = scenario === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onScenarioChange(id)}
                className={`flex min-h-[76px] flex-col items-start rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${
                  active
                    ? 'border-[#1B4332] bg-[#1B4332] text-white shadow-xs'
                    : 'border-[#C7D5C5] bg-white text-[#263B2E] hover:border-[#1B4332]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="mt-1.5 text-xs font-extrabold">{preset.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg border border-[#DCE5D8] bg-white p-3 text-xs text-[#3B4D41]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[#17271D]">{climate.scenarioLabel} · {climate.monthLabel}</span>
            <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${scenario === 'baseline' ? 'bg-[#E8F3EC] text-[#1B4332]' : 'bg-amber-100 text-amber-900'}`}>
              {scenario === 'baseline' ? 'Static baseline · NASA POWER/GPM' : labels.illustrativeModeledBadge}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#536458]">{climate.scenarioDescription}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#EDF2EB] pt-2 font-mono text-[10px] text-[#3B4D41] sm:grid-cols-3">
            <ClimateValue label="T2M / Tmax" baseline={`${climate.baselineTempC.toFixed(1)}° / ${climate.baselineMaxTempC.toFixed(1)}°C`} adjusted={`${climate.adjustedTempC.toFixed(1)}° / ${climate.adjustedMaxTempC.toFixed(1)}°C`} />
            <ClimateValue label="Daily precipitation" baseline={`${climate.baselineDailyPrecipMm.toFixed(1)} mm/d`} adjusted={`${climate.adjustedDailyPrecipMm.toFixed(1)} mm/d`} />
            <ClimateValue label="Daily rain burst P95" baseline={`${climate.baselineRainBurstMm.toFixed(0)} mm`} adjusted={`${climate.adjustedRainBurstMm.toFixed(0)} mm`} />
            <ClimateValue label="GWETTOP index" baseline={climate.baselineGwetTop.toFixed(2)} adjusted={climate.adjustedGwetTop.toFixed(2)} />
            <ClimateValue label="GWETROOT index" baseline={climate.baselineGwetRoot.toFixed(2)} adjusted={climate.adjustedGwetRoot.toFixed(2)} />
            <ClimateValue label="Rainfall scenario" baseline="1.00×" adjusted={`${STRESS_PRESETS[scenario].precipMultiplier.toFixed(2)}×`} />
          </div>
          <div aria-live="polite" role="status" className="mt-2 rounded-md bg-[#F7FAF5] p-2 text-[10px] leading-4 text-[#3B4D41]">
            {scenario === 'drought' && (
              <>Drought shock is set to −30% rainfall (the midpoint of the requested −20% to −40% range). Ranking changes depend on this farm, month, priorities, and constraints; the cards below show the recalculated order.</>
            )}
            {scenario === 'heatwave' && (
              <>Thermal-risk check uses adjusted NASA POWER T2M and T2M_MAX to recalculate FARI heat penalties and spray-window alerts. It is a modeled scenario; no ECOSTRESS site observation is used.</>
            )}
            {scenario === 'deluge' && (
              <>Runoff check uses the adjusted extreme-rain burst with this farm’s {slopePct}% terrain slope, canopy closure, root depth, and contour factor to recalculate erosion scores.</>
            )}
            {scenario === 'baseline' && (
              <>No shock is applied. All displayed climate values use the repository’s historical baseline inputs.</>
            )}
            <span className="mt-1 block font-mono font-bold">90-day windows: {riskCounts.red} red washout · {riskCounts.amber} amber thermal/moisture · {riskCounts.green} green</span>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ClimateValueProps {
  label: string;
  baseline: string;
  adjusted: string;
}

const ClimateValue: React.FC<ClimateValueProps> = ({ label, baseline, adjusted }) => (
  <div className="rounded bg-[#F8FAF7] p-2">
    <p className="font-sans text-[9px] text-[#65766A]">{label}</p>
    <p className="mt-0.5 text-[#65766A]">Base {baseline}</p>
    <p className="font-bold text-[#1B4332]">Now {adjusted}</p>
  </div>
);
