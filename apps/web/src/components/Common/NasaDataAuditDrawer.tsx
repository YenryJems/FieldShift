import React from 'react';
import { METRIC_LABELS } from '@fieldshift/climate-data';

export interface NasaDataAuditDrawerProps {
  title?: string;
  metricKeys?: string[];
  className?: string;
}

export const NasaDataAuditDrawer: React.FC<NasaDataAuditDrawerProps> = ({
  title = 'NASA & FAO Parameter Audit Drawer',
  metricKeys,
  className = '',
}) => {
  const definitions = metricKeys?.length
    ? metricKeys
        .map((key) => METRIC_LABELS[key])
        .filter((def): def is NonNullable<typeof def> => Boolean(def))
    : Object.values(METRIC_LABELS);

  return (
    <details
      className={`rounded-lg border border-sky-400/20 bg-[#0B1426]/85 text-xs text-[#CBD5E1] backdrop-blur-md ${className}`.trim()}
    >
      <summary className="cursor-pointer select-none px-3 py-2 font-semibold text-[#F0F9FF] hover:bg-[#0D182E]">
        {title} ({definitions.length} metrics)
      </summary>
      <div className="border-t border-sky-400/20 px-3 py-2.5">
        <p className="mb-2 text-[11px] text-[#94A3B8]">
          Raw NASA POWER, GPM IMERG, and FAO EcoCrop parameter codes mapped to plain-English
          FieldShift metrics.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {definitions.map((def) => (
            <div
              key={def.key}
              className="rounded border border-sky-400/20 bg-[#0D182E] px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#F0F9FF]">{def.label}</span>
                <span className="rounded border border-sky-400/20 bg-[#0B1426] px-1.5 py-0.5 font-mono text-[10px] text-[#7DD3FC]">
                  {def.rawCode} · {def.unit}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                {def.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
};
