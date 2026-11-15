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
  emerald: 'bg-[#E3F2E8] text-[#1B4332] border border-[#B7DFC5]',
  sky: 'bg-[#E6F0FA] text-[#1D4E89] border border-[#B8D4F0]',
  amber: 'bg-[#FFF3CD] text-[#92400E] border border-[#F3D9A4]',
  rose: 'bg-[#FDE2E4] text-[#991B1B] border border-[#F5B7BD]',
  slate: 'bg-[#EEF2EC] text-[#465A4E] border border-[#D4DDD0]',
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
            {termLabel('temp', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className="font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {climate.adjustedTempC.toFixed(1)}°C
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE_CLASSES[tempBadge.tone]}`}>
            {tempBadge.label}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[#65766A]">
          Daily max {climate.adjustedMaxTempC.toFixed(1)}°C · 2m mean
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
            {termLabel('rain', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <p className="font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {climate.adjustedDailyPrecipMm.toFixed(1)} mm/day
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE_CLASSES[rainBadge.tone]}`}>
            {rainBadge.label}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[#65766A]">
          Heavy-rain days (&gt;=14 mm): {climate.stormDaysGe14Mm.toFixed(1)}/mo
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-white p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
            {termLabel('rootMoisture', plainEnglish)}
          </h3>
          {isWhatIf && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TONE_CLASSES.amber}`}>
              What-if
            </span>
          )}
        </div>
        <div className="mt-2.5">
          <p className="font-mono text-2xl font-extrabold tabular-nums text-[#17271D]">
            {moisturePct}%
          </p>
          <div
            role="progressbar"
            aria-label="Root-zone soil moisture index"
            aria-valuenow={moisturePct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E6ECE4]"
          >
            <div
              className="h-full rounded-full bg-[#2D6A4F] transition-all"
              style={{ width: `${moisturePct}%` }}
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-[#65766A]">
          Modeled wetness index (% of saturation), not a soil test
        </p>
      </article>

      <article className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#F5F9F3] p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
            {termLabel('fari', plainEnglish)}
          </h3>
        </div>
        <div className="mt-2.5">
          <p className="font-mono text-2xl font-extrabold tabular-nums text-[#1B4332]">
            {topResult.fariScore.toFixed(1)}%
          </p>
        </div>
        <p className="mt-1.5 text-xs font-bold text-[#263B2E]">
          Best: {topResult.title}
        </p>
      </article>
    </div>
  );
};
