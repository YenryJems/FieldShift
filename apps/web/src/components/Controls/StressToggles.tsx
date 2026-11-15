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
    <section aria-labelledby="stress-scenario-heading" className="flex flex-col gap-4 rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md sm:p-5 lg:col-span-6">
      <div>
        <h3 id="stress-scenario-heading" className="text-sm font-extrabold text-[#F0F9FF]">
          {labels.stressPresetsTitle}
        </h3>
        <p className="mt-1 text-xs text-[#94A3B8]">
          These drought, heat, and heavy-rain settings simulate possible changes to the {climate.monthLabel} historical baseline. They do not predict actual weather. Strategy scores, rankings, and the 90-day risk screen update when a setting changes.
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
                className={`flex min-h-[76px] flex-col items-start rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  active
                    ? 'border-sky-400 bg-[#0D182E] text-[#F0F9FF] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                    : 'border-sky-400/20 bg-[#0D182E]/70 text-[#CBD5E1] hover:border-sky-400/50 hover:text-[#F0F9FF]'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} aria-hidden="true" />
                <span className="mt-1.5 text-xs font-extrabold">{preset.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 text-xs text-[#94A3B8]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[#F0F9FF]">{climate.scenarioLabel} · {climate.monthLabel}</span>
            <span className="inline-flex items-center gap-1.5 rounded border border-sky-400/20 bg-[#0B1426] px-2 py-0.5 font-mono text-[10px] font-bold text-[#CBD5E1]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${scenario === 'baseline' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                aria-hidden="true"
              />
              {scenario === 'baseline' ? 'Static baseline · NASA POWER/GPM' : labels.illustrativeModeledBadge}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">{climate.scenarioDescription}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-sky-400/20 pt-2 font-mono text-[10px] text-[#94A3B8] sm:grid-cols-3">
            <ClimateValue label="Air Temperature / Max" baseline={`${climate.baselineTempC.toFixed(1)}° / ${climate.baselineMaxTempC.toFixed(1)}°C`} adjusted={`${climate.adjustedTempC.toFixed(1)}° / ${climate.adjustedMaxTempC.toFixed(1)}°C`} />
            <ClimateValue label="Daily Rainfall" baseline={`${climate.baselineDailyRainfallMm.toFixed(1)} mm/d`} adjusted={`${climate.adjustedDailyRainfallMm.toFixed(1)} mm/d`} />
            <ClimateValue label="Daily rain burst P95" baseline={`${climate.baselineRainBurstMm.toFixed(0)} mm`} adjusted={`${climate.adjustedRainBurstMm.toFixed(0)} mm`} />
            <ClimateValue label="Surface Moisture (%)" baseline={`${climate.baselineSurfaceMoisturePct}%`} adjusted={`${climate.adjustedSurfaceMoisturePct}%`} />
            <ClimateValue label="Root-Zone Moisture (%)" baseline={`${climate.baselineRootZoneMoisturePct}%`} adjusted={`${climate.adjustedRootZoneMoisturePct}%`} />
            <ClimateValue label="Rainfall scenario" baseline="1.00×" adjusted={`${STRESS_PRESETS[scenario].precipMultiplier.toFixed(2)}×`} />
          </div>
          <div aria-live="polite" role="status" className="mt-2 rounded-md border border-sky-400/15 bg-[#0B1426] p-2 text-[10px] leading-4 text-[#94A3B8]">
            {scenario === 'drought' && (
              <>Drought shock is set to −30% rainfall (the midpoint of the requested −20% to −40% range). Ranking changes depend on this farm, month, priorities, and constraints; the cards below show the recalculated order.</>
            )}
            {scenario === 'heatwave' && (
              <>Thermal-risk check uses adjusted NASA POWER T2M and T2M_MAX to recalculate FARI heat penalties and spray-window alerts. It is a modeled scenario, not a canopy-temperature reading.</>
            )}
            {scenario === 'deluge' && (
              <>Runoff check uses the adjusted extreme-rain burst with this farm’s {slopePct}% terrain slope, canopy closure, root depth, and contour factor to recalculate erosion scores.</>
            )}
            {scenario === 'baseline' && (
              <>No shock is applied. All displayed climate values use the repository’s historical baseline inputs.</>
            )}
            <span className="mt-1 flex flex-wrap items-center gap-3 font-mono font-bold text-[#CBD5E1]">
              <span>90-day windows:</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden="true" />{riskCounts.red} red washout</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />{riskCounts.amber} amber thermal/moisture</span>
              <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />{riskCounts.green} green</span>
            </span>
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
  <div className="rounded border border-sky-400/15 bg-[#0B1426] p-2">
    <p className="font-sans text-[9px] text-sky-300/75">{label}</p>
    <p className="mt-0.5 text-[#94A3B8]">Base {baseline}</p>
    <p className="font-bold text-[#38BDF8]">Now {adjusted}</p>
  </div>
);
