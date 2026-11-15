import React from 'react';
import { CalendarClock, ThermometerSnowflake } from 'lucide-react';
import {
  calculateCfiSprayCalendar,
  STRESS_PRESETS,
  type FarmId,
  type StressScenarioId,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';

interface SprayValidatorProps {
  farmId: FarmId;
  startMonth: number;
  scenario?: StressScenarioId;
}

/** Historical 90-day climatology screen; never a live spray forecast. */
export const SprayValidator: React.FC<SprayValidatorProps> = ({
  farmId,
  startMonth,
  scenario = 'baseline',
}) => {
  const { t } = useLanguage();
  const windows = calculateCfiSprayCalendar(farmId, startMonth, scenario);

  return (
    <section
      aria-labelledby="cfi-spray-calendar-heading"
      className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6"
    >
      <div className="flex flex-col gap-2 border-b border-sky-400/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
              NASA POWER daily climatology (2020–2025 UTC) · GPM IMERG precipitation · T2M_MAX / T2M_MIN
            </span>
          </div>
          <h3 id="cfi-spray-calendar-heading" className="mt-1 text-xl font-extrabold text-[#F0F9FF]">
            90-Day Climatological Flower Induction (CFI) &amp; Foliar Spray Risk Validator
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            Counts how often heavy rain (≥14 mm/day), heat (≥33°C), and cold (≤2°C) appeared in the historical record across three months starting in <strong className="text-[#F0F9FF]">{windows[0].monthLabel}</strong>. It cannot tell you what the weather will be today or next week. Check PAGASA or your local weather service before applying KNO₃ or foliar sprays.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {scenario !== 'baseline' && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-400/20 bg-[#0D182E] px-3 py-1 font-mono text-[10px] font-bold text-[#F0F9FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              {STRESS_PRESETS[scenario].shortLabel} · {t.illustrativeModeledBadge}
            </span>
          )}
          <span
            title={t.projectedEstimateTooltip}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-normal break-words rounded-full border border-sky-400/20 bg-[#0D182E] px-3 py-1 font-mono text-[10px] font-bold text-[#7DD3FC]"
          >
            Potential Spray Loss Exposure: PHP 15,000-35,000/ha ({t.projectedEstimateBadge})
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {windows.map((window, index) => {
          const dotColor = window.riskLevel === 'green'
            ? 'bg-emerald-400'
            : window.riskLevel === 'amber'
              ? 'bg-amber-400'
              : 'bg-rose-400';

          return (
            <article key={window.month} className="flex flex-col justify-between rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-sky-300/75">
                    Window Month {index + 1} · {window.monthLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-[#0B1426] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#F0F9FF]">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
                    {window.badgeText}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                  <Metric label="Heavy storm days (≥14 mm)" value={`${window.stormDaysGe14Mm.toFixed(1)} days/mo`} />
                  <Metric label="Dry days (<3 mm)" value={`${window.dryDaysLt3Mm.toFixed(1)} days/mo`} />
                  <Metric label="Heat days (≥33°C)" value={`${window.heatStressDaysGe33C.toFixed(1)} days · Tmax ${window.maxTempC.toFixed(1)}°C`} />
                  <div className="rounded border border-sky-400/20 bg-[#0B1426] p-2">
                    <dt className="flex items-center gap-1 text-[10px] text-sky-300/75">
                      <ThermometerSnowflake className="h-3 w-3 text-[#38BDF8]" aria-hidden="true" />
                      Cold days (≤2°C)
                    </dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-[#F0F9FF]">
                      {window.coldDaysLe2C.toFixed(1)} days · Tmin {window.minTempC.toFixed(1)}°C
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 border-t border-sky-400/20 pt-2.5 text-xs leading-5 text-[#CBD5E1]">
                <strong className="text-[#F0F9FF]">Field action: </strong>{window.farmerActionAdvisory}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

interface MetricProps {
  label: string;
  value: string;
}

const Metric: React.FC<MetricProps> = ({ label, value }) => (
  <div className="rounded border border-sky-400/20 bg-[#0B1426] p-2">
    <dt className="text-[10px] text-sky-300/75">{label}</dt>
    <dd className="mt-0.5 text-sm font-extrabold text-[#F0F9FF]">{value}</dd>
  </div>
);
