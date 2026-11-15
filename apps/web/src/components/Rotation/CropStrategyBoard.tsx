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
  emerald: 'bg-[#E3F2E8] text-[#1B4332] border border-[#B7DFC5]',
  sky: 'bg-[#E6F0FA] text-[#1D4E89] border border-[#B8D4F0]',
  amber: 'bg-[#FFF3CD] text-[#92400E] border border-[#F3D9A4]',
  rose: 'bg-[#FDE2E4] text-[#991B1B] border border-[#F5B7BD]',
  slate: 'bg-[#EEF2EC] text-[#465A4E] border border-[#D4DDD0]',
};

const WINDOW_STYLES: Record<
  ApplicationWindowLevel,
  { container: string; pill: string; label: string }
> = {
  green: {
    container: 'border-[#B7DFC5] bg-[#F2FAF5] text-[#1B4332]',
    pill: 'bg-[#1B4332] text-white',
    label: 'GREEN',
  },
  amber: {
    container: 'border-[#F3D9A4] bg-[#FFFBEB] text-[#92400E]',
    pill: 'bg-[#D97706] text-white',
    label: 'AMBER',
  },
  red: {
    container: 'border-[#F5B7BD] bg-[#FEF2F2] text-[#991B1B]',
    pill: 'bg-[#DC2626] text-white',
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
        <h3 className="text-base font-extrabold text-[#17271D]">
          Crop strategy ranking — {monthLabel}
        </h3>
        <p className="text-xs font-semibold text-[#52715E]">{farmName}</p>
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
              className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:p-5 ${
                result.rank === 1
                  ? 'border-2 border-[#1B4332] bg-[#F6FBF7]'
                  : 'border-[#D4DDD0] bg-white'
              }`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                          result.rank === 1
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-[#EEF2EC] text-[#263B2E]'
                        }`}
                      >
                        Rank #{result.rank}
                      </span>
                      {result.isDerivedVariant && (
                        <span className="rounded-full border border-[#F3D9A4] bg-[#FFFBEB] px-2.5 py-0.5 text-[11px] font-semibold text-[#92400E]">
                          Derived variant
                        </span>
                      )}
                      {result.seedFallbackApplied && (
                        <span className="rounded-full border border-[#B8D4F0] bg-[#E6F0FA] px-2.5 py-0.5 text-[11px] font-semibold text-[#1D4E89]">
                          Local seed
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-[#17271D]">
                      {result.title}
                    </h4>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-2xl font-extrabold tabular-nums text-[#1B4332]">
                      {result.fariScore.toFixed(1)}%
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_TONE_CLASSES[gainTone]}`}
                    >
                      {formatGain(result)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8DF] bg-[#F8FAF7] p-3 text-xs">
                  <p className="font-bold text-[#17271D]">
                    {cropDisplayName(result.strategy, plainEnglish)}
                  </p>
                  <p className="mt-1 text-[#536458]">
                    Cultivars: {result.displayCultivars.map((c) => c.name).join(', ')}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[#65766A]">
                    Root depth {result.strategy.rootDepthCm} cm · Days to harvest{' '}
                    {result.strategy.cashTurnaroundDays}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.label}
                      className="rounded-xl border border-[#E2E8DF] bg-white p-2.5"
                    >
                      <p className="text-[11px] font-semibold text-[#65766A]">{badge.label}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_TONE_CLASSES[badge.tone]}`}
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
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${windowStyle.pill}`}
                    >
                      {windowStyle.label}
                    </span>
                    <span className="font-bold">{result.applicationWindow.title}</span>
                  </div>
                  <p className="mt-1.5 leading-relaxed">
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
