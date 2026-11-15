import React from 'react';
import type { AdjustedClimateContext, PlotStrategyResult } from '@fieldshift/climate-data';
import {
  classifyRainfall,
  classifyTemperature,
  rootZoneMoisturePct,
  termLabel,
  type Tone,
} from '../../utils/dashboard';

export interface KpiCardsProps {
  climate: AdjustedClimateContext;
  topResult: PlotStrategyResult;
  plainEnglish: boolean;
}

const TONE_CLASSES: Record<Tone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  slate: 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/50',
};

export const KpiCards: React.FC<KpiCardsProps> = ({
  climate,
  topResult,
  plainEnglish,
}) => {
  const tempBadge = classifyTemperature(climate.adjustedTempC);
  const rainBadge = classifyRainfall(climate.adjustedDailyPrecipMm);
  const moisturePct = rootZoneMoisturePct(climate.adjustedGwetRoot);
  const isWhatIf = climate.scenarioId !== 'baseline';

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-400">
            {termLabel('temp', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-slate-100">
            {climate.adjustedTempC.toFixed(1)}°C
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tempBadge.tone]}`}>
            {tempBadge.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Daily max {climate.adjustedMaxTempC.toFixed(1)}°C
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-400">
            {termLabel('rain', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-slate-100">
            {climate.adjustedDailyPrecipMm.toFixed(1)} mm/day
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[rainBadge.tone]}`}>
            {rainBadge.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Heavy-rain days (&gt;=14 mm): {climate.stormDaysGe14Mm.toFixed(1)}/mo
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-400">
            {termLabel('rootMoisture', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums text-slate-100">
            {moisturePct}%
          </p>
          <div
            role="progressbar"
            aria-label="Root-zone soil moisture index"
            aria-valuenow={moisturePct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800"
          >
            <div
              className="h-full rounded-full bg-sky-400 transition-all"
              style={{ width: `${moisturePct}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Modeled wetness index (% of saturation), not a soil test
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-400">
            {termLabel('fari', plainEnglish)}
          </h3>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums text-emerald-300">
            {topResult.fariScore.toFixed(1)}%
          </p>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-300">
          Best: {topResult.title}
        </p>
      </article>
    </div>
  );
};
