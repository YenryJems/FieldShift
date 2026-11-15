import React from 'react';
import { AlertTriangle, ThermometerSun } from 'lucide-react';
import {
  getExtendedMonthlyRecord,
  getFarmById,
  type FarmId,
} from '@fieldshift/climate-data';

interface FrostIndicatorProps {
  farmId: FarmId;
  month: number;
}

export const FrostIndicator: React.FC<FrostIndicatorProps> = ({ farmId, month }) => {
  const farm = getFarmById(farmId);
  const telemetry = getExtendedMonthlyRecord(farmId, month);
  const coldRisk = telemetry.meanColdDaysLe2C >= 2 || telemetry.t2mMinC <= 2;
  const frostRisk = telemetry.t2mMinC <= 0;
  const heatRisk = telemetry.meanHeatStressDaysGe33C >= 8 || telemetry.t2mMaxC >= 33;

  return (
    <section
      aria-labelledby="thermal-risk-heading"
      className="rounded-xl border border-sky-400/20 bg-[#0B1426]/85 p-4 backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        {heatRisk ? (
          <ThermometerSun className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
        )}
        <h4 id="thermal-risk-heading" className="text-sm font-extrabold text-[#F0F9FF]">
          Cold, frost &amp; heat stress check · {telemetry.label}
        </h4>
        <span className="rounded-full border border-sky-400/20 bg-[#0D182E] px-2 py-0.5 font-mono text-[9px] font-bold text-[#7DD3FC]">
          Historical NASA POWER
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Metric label="Monthly Minimum Temp" value={`${telemetry.t2mMinC.toFixed(1)}°C`} alert={frostRisk} />
        <Metric label="Cold days (≤2°C)" value={`${telemetry.meanColdDaysLe2C.toFixed(1)} days/mo`} alert={coldRisk} />
        <Metric label="Heat days (≥33°C)" value={`${telemetry.meanHeatStressDaysGe33C.toFixed(1)} days/mo · Tmax ${telemetry.t2mMaxC.toFixed(1)}°C`} alert={heatRisk} />
      </div>
      <p className="mt-2 text-[11px] leading-5 text-[#CBD5E1]">
        {coldRisk
          ? 'Cold exposure appears in the historical monthly baseline. Protect sensitive seedlings and consult local extension guidance before planting.'
          : heatRisk
            ? 'High temperature exposure appears in the historical monthly baseline. Maintain soil cover and confirm crop-stage water needs locally.'
            : 'No elevated cold or heat threshold appears in this monthly historical baseline.'}{' '}
        This uses gridded historical climate averages. It cannot tell you whether this exact field will have frost tonight.
      </p>
      <p className="mt-1 text-[10px] text-[#94A3B8]">
        {farmId === 'bukidnon'
          ? 'Bukidnon is the supported highland plot; Benguet is not one of the configured study locations.'
          : farmId === 'usa-midwest'
            ? 'USA Midwest values represent a Central Illinois benchmark coordinate, not a verified private farm.'
            : `Study location: ${farm.name}.`}
      </p>
    </section>
  );
};

interface MetricProps {
  label: string;
  value: string;
  alert: boolean;
}

const Metric: React.FC<MetricProps> = ({ label, value, alert }) => (
  <div className={`rounded-lg border p-2.5 ${alert ? 'border-amber-400/50 bg-[#0D182E]' : 'border-sky-400/20 bg-[#0D182E]'}`}>
    <p className="flex items-center gap-1.5 text-[10px] text-sky-300/75">
      {alert && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
      {label}
    </p>
    <p className="mt-0.5 font-mono text-sm font-extrabold text-[#F0F9FF]">
      {value}
    </p>
  </div>
);
