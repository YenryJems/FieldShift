import React from 'react';
import type {
  ApplicationWindowLevel,
  PlotStrategyEvaluation,
} from '@fieldshift/climate-data';
import {
  cropDisplayName,
  formatGain,
  MONTH_SHORT,
  strategyBadges,
  type Tone,
} from '../../utils/dashboard';
import { StrategyAuditDrawer } from '../Dashboard/StrategyAuditDrawer';

export interface CropStrategyBoardProps {
  evaluation: PlotStrategyEvaluation;
  plainEnglish: boolean;
  farmName: string;
}

const BADGE_TONE_CLASSES: Record<Tone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  slate: 'bg-slate-800 text-slate-300 ring-1 ring-slate-700',
};

const WINDOW_STYLES: Record<
  ApplicationWindowLevel,
  { container: string; pill: string; label: string }
> = {
  green: {
    container: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    pill: 'bg-emerald-500/20 text-emerald-300',
    label: 'GREEN',
  },
  amber: {
    container: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    pill: 'bg-amber-500/20 text-amber-300',
    label: 'AMBER',
  },
  red: {
    container: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    pill: 'bg-rose-500/20 text-rose-300',
    label: 'RED',
  },
};

export const CropStrategyBoard: React.FC<CropStrategyBoardProps> = ({
  evaluation,
  plainEnglish,
  farmName,
}) => {
  const monthLabel = MONTH_SHORT[evaluation.month - 1] ?? MONTH_SHORT[0];

  return (
    <section aria-label={`Crop strategy ranking for ${farmName}`} className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-100">
          Crop strategy ranking — {monthLabel}
        </h3>
        <p className="text-xs text-slate-400">{farmName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {evaluation.ranked.map((result) => {
          const gainTone: Tone =
            result.gainVsBaselinePct !== null && result.gainVsBaselinePct > 0
              ? 'emerald'
              : result.gainVsBaselinePct !== null && result.gainVsBaselinePct < 0
                ? 'rose'
                : 'slate';
          const windowStyle = WINDOW_STYLES[result.applicationWindow.level];
          const badges = strategyBadges(result, plainEnglish);

          return (
            <article
              key={result.key}
              data-strategy-key={result.key}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-200 ring-1 ring-slate-700">
                        Rank #{result.rank}
                      </span>
                      {result.isDerivedVariant && (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                          Derived variant
                        </span>
                      )}
                      {result.seedFallbackApplied && (
                        <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-500/30">
                          Local seed
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">
                      {result.title}
                    </h4>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-slate-100">
                      {result.fariScore.toFixed(1)}%
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_TONE_CLASSES[gainTone]}`}
                    >
                      {formatGain(result)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                  <p className="font-semibold text-slate-100">
                    {cropDisplayName(result.strategy, plainEnglish)}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Cultivars: {result.displayCultivars.map((c) => c.name).join(', ')}
                  </p>
                  <p className="mt-1 text-slate-400">
                    Root depth {result.strategy.rootDepthCm} cm · Days to harvest{' '}
                    {result.strategy.cashTurnaroundDays}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.label}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5"
                    >
                      <p className="text-[11px] text-slate-400">{badge.label}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_TONE_CLASSES[badge.tone]}`}
                      >
                        {badge.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  role="note"
                  className={`rounded-xl border p-3 text-xs ${windowStyle.container}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${windowStyle.pill}`}
                    >
                      {windowStyle.label}
                    </span>
                    <span className="font-bold">{result.applicationWindow.title}</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed opacity-90">
                    {result.applicationWindow.advice}
                  </p>
                </div>
              </div>

              <StrategyAuditDrawer
                result={result}
                normalizedWeights={evaluation.normalizedWeights}
                plainEnglish={plainEnglish}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
};
