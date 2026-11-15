import React from 'react';
import type { PlotStrategyResult, PriorityWeights } from '@fieldshift/climate-data';
import { sanitizePlainTelemetryCodes } from '../../utils/dashboard';

export interface StrategyAuditDrawerProps {
  result: PlotStrategyResult;
  normalizedWeights: PriorityWeights;
  plainEnglish: boolean;
}

const PILLAR_LABELS: Record<keyof PriorityWeights, string> = {
  water: 'Water Resilience',
  erosion: 'Erosion Control',
  nutrients: 'Soil Nutrients',
  market: 'Market Viability',
};

export const StrategyAuditDrawer: React.FC<StrategyAuditDrawerProps> = ({
  result,
  normalizedWeights,
  plainEnglish,
}) => {
  const { explanations } = result.strategy;
  const whySuggested = sanitizePlainTelemetryCodes(explanations.whySuggested, plainEnglish);
  const supportingEvidence = sanitizePlainTelemetryCodes(explanations.supportingEvidence, plainEnglish);
  const dataGaps = sanitizePlainTelemetryCodes(explanations.dataGaps, plainEnglish);
  const localReviewAlerts = sanitizePlainTelemetryCodes(explanations.localReviewAlerts, plainEnglish);
  const topPillars = (Object.keys(normalizedWeights) as Array<keyof PriorityWeights>)
    .map((key) => ({
      key,
      label: PILLAR_LABELS[key],
      weightPct: Math.round(normalizedWeights[key] * 100),
      score: result.breakdown.pillars[key],
    }))
    .sort((a, b) => b.weightPct - a.weightPct)
    .slice(0, 2);

  return (
    <details className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-3 text-xs text-[#3B4D41]">
      <summary className="min-h-8 cursor-pointer select-none font-bold text-[#1B4332] hover:text-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
        Show audit trail
      </summary>

      <div className="mt-3 space-y-3 border-t border-[#E2E8DF] pt-3 leading-relaxed">
        <section>
          <h4 className="font-bold text-[#17271D]">Why It Was Suggested</h4>
          {result.isDerivedVariant && (
            <p className="mt-1 rounded-lg border border-[#F3D9A4] bg-[#FFFBEB] px-2.5 py-1.5 text-[#92400E]">
              Derived from {result.sourceStrategyId}: same crops, residue sold as fodder instead of mulched (illustrative).
            </p>
          )}
          <p className="mt-1 text-[#3B4D41]">{whySuggested}</p>
          <p className="mt-1 text-[#65766A]">
            Top weighted pillars:{' '}
            {topPillars
              .map((p) => `${p.label} (${p.weightPct}% weight, ${(p.score * 100).toFixed(0)}/100)`)
              .join(' · ')}
          </p>
        </section>

        <section>
          <h4 className="font-bold text-[#17271D]">
            Multi-Sensor NASA Telemetry Evidence
          </h4>
          <p className="mt-1 text-[#3B4D41]">{supportingEvidence}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[#536458]">
            <li>NASA POWER (2020–2025 monthly climatology) &amp; MERRA-2 meteorology source</li>
            <li>GPM IMERG precipitation cross-check for heavy-rain days</li>
            <li>SMAP L4 root-zone soil moisture shown as map context only (not a FARI scoring input)</li>
            <li>NASA SRTM slope context for erosion risk</li>
          </ul>
        </section>

        <section>
          <h4 className="font-bold text-[#17271D]">
            Spatial Resolution &amp; Uncertainty Guardrail
          </h4>
          <p className="mt-1 text-[#3B4D41]">{dataGaps}</p>
          <p className="mt-1 text-[#65766A]">
            NASA POWER resolves a regional ~0.5° × 0.625° (~50 km) grid and cannot capture field-level micro-relief, drainage ditches, or soil texture. Values reflect 2020–2025 monthly means and any modeled what-if shocks, not a live seasonal forecast.
          </p>
        </section>

        <section>
          <h4 className="font-bold text-[#17271D]">
            Mandatory Local Validation Checklist
          </h4>
          <p className="mt-1 text-[#3B4D41]">{localReviewAlerts}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[#536458]">
            <li>Run a BSWM soil pH and N-P-K test before purchasing fertilizer</li>
            <li>Consult your Municipal Agriculture Office (MAO) or local extension technician</li>
            <li>Confirm local seed availability, cultivar maturity, and buyer market before planting</li>
          </ul>
        </section>
      </div>
    </details>
  );
};
