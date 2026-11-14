import React from 'react';
import { CalendarClock, ThermometerSnowflake } from 'lucide-react';
import {
  calculateCfiSprayCalendar,
  type FarmId,
} from '@fieldshift/climate-data';
import { useLanguage } from '../../context/LanguageContext';

interface SprayValidatorProps {
  farmId: FarmId;
  startMonth: number;
}

/** Historical 90-day climatology screen; never a live spray forecast. */
export const SprayValidator: React.FC<SprayValidatorProps> = ({ farmId, startMonth }) => {
  const { t } = useLanguage();
  const windows = calculateCfiSprayCalendar(farmId, startMonth, 'baseline');

  return (
    <section
      aria-labelledby="cfi-spray-calendar-heading"
      className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2 border-b border-[#E2E8DF] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
              NASA POWER daily climatology (2020–2025 UTC) · GPM IMERG precipitation · T2M_MAX / T2M_MIN
            </span>
          </div>
          <h3 id="cfi-spray-calendar-heading" className="mt-1 text-xl font-extrabold text-[#17271D]">
            90-Day Climatological Flower Induction (CFI) &amp; Foliar Spray Risk Validator
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#536458]">
            Counts how often heavy rain (≥14 mm/day), heat (≥33°C), and cold (≤2°C) appeared in the historical record across three months starting in <strong>{windows[0].monthLabel}</strong>. It cannot tell you what the weather will be today or next week. Check PAGASA or your local weather service before applying KNO₃ or foliar sprays.
          </p>
        </div>
        <span
          title={t.projectedEstimateTooltip}
          className="shrink-0 rounded-full border border-[#D97706]/40 bg-[#FFFBEB] px-3 py-1 font-mono text-[10px] font-bold text-[#92400E]"
        >
          Avoided Spray Loss: PHP 15,000–35,000/ha ({t.projectedEstimateBadge})
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {windows.map((window, index) => {
          const colors = window.riskLevel === 'green'
            ? 'border-[#2D6A4F] bg-[#EDF7F0] text-[#1B4332]'
            : window.riskLevel === 'amber'
              ? 'border-[#D97706] bg-[#FFFBEB] text-[#92400E]'
              : 'border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]';

          return (
            <article key={window.month} className="flex flex-col justify-between rounded-xl border border-[#D4DDD0] bg-[#FAFBF9] p-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#52715E]">
                    Window Month {index + 1} · {window.monthLabel}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${colors}`}>
                    {window.badgeText}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                  <Metric label="Heavy storm days (≥14 mm)" value={`${window.stormDaysGe14Mm.toFixed(1)} days/mo`} />
                  <Metric label="Dry days (<3 mm)" value={`${window.dryDaysLt3Mm.toFixed(1)} days/mo`} />
                  <Metric label="Heat days (≥33°C)" value={`${window.heatStressDaysGe33C.toFixed(1)} days · Tmax ${window.t2mMaxC.toFixed(1)}°C`} />
                  <div className="rounded border border-[#E2E8DF] bg-white p-2">
                    <dt className="flex items-center gap-1 text-[10px] text-[#65766A]">
                      <ThermometerSnowflake className="h-3 w-3 text-[#2563EB]" aria-hidden="true" />
                      Cold days (≤2°C)
                    </dt>
                    <dd className="mt-0.5 text-sm font-extrabold text-[#1D4E89]">
                      {window.coldDaysLe2C.toFixed(1)} days · Tmin {window.t2mMinC.toFixed(1)}°C
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 border-t border-[#E2E8DF] pt-2.5 text-xs leading-5 text-[#3B4D41]">
                <strong className="text-[#17271D]">Field action: </strong>{window.farmerActionAdvisory}
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
  <div className="rounded border border-[#E2E8DF] bg-white p-2">
    <dt className="text-[10px] text-[#65766A]">{label}</dt>
    <dd className="mt-0.5 text-sm font-extrabold text-[#17271D]">{value}</dd>
  </div>
);
