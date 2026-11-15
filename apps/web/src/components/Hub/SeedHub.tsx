import React, { useMemo, useState } from 'react';
import { AlertTriangle, Sprout } from 'lucide-react';
import { getFarmById, type CultivarOption, type FarmId, type StrategyId } from '@fieldshift/climate-data';

interface SeedHubProps {
  farmId: FarmId;
  strategyId: StrategyId;
}

export const SeedHub: React.FC<SeedHubProps> = ({ farmId, strategyId }) => {
  const [commercialSupplyDisrupted, setCommercialSupplyDisrupted] = useState(false);
  const farm = getFarmById(farmId);
  const strategy = farm.strategies.find((item) => item.id === strategyId) ?? farm.strategies[0];
  const fallbackOptions = useMemo(
    () => strategy.cultivars.filter((cultivar) => cultivar.type === 'open-pollinated'),
    [strategy],
  );
  const displayedCultivars = commercialSupplyDisrupted
    ? fallbackOptions
    : strategy.cultivars;
  const hasCommercialOption = strategy.cultivars.some((cultivar) => cultivar.type === 'commercial');

  return (
    <section aria-labelledby="seed-hub-heading" className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-3 border-b border-sky-400/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
              Climate-matched seed and cultivar options
            </span>
          </div>
          <h3 id="seed-hub-heading" className="mt-1 text-xl font-extrabold text-[#F0F9FF]">
            Seed Hub · Strategy {strategy.id}
          </h3>
          <p className="mt-1 text-xs text-[#94A3B8]">{strategy.name}</p>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 py-2 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50">
          <input
            type="checkbox"
            checked={commercialSupplyDisrupted}
            onChange={(event) => setCommercialSupplyDisrupted(event.currentTarget.checked)}
            className="h-4 w-4 accent-[#38BDF8]"
            aria-label="Use open-pollinated and farmer-saved seed fallback options"
          />
          Commercial supply disrupted
        </label>
      </div>

      {commercialSupplyDisrupted && (
        <p role="status" className="mt-3 flex gap-2 rounded-lg border border-amber-400/35 bg-[#0D182E] p-3 text-xs leading-5 text-[#CBD5E1]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" aria-hidden="true" />
          Showing open-pollinated, farmer-saved, or vegetatively propagated local options for this strategy. Check local seed-bank stock, germination, varietal identity, planting-material health, and certification rules with the MAO or cooperative before planting.
        </p>
      )}

      {displayedCultivars.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {displayedCultivars.map((cultivar) => (
            <article key={cultivar.name} className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded border border-sky-400/20 bg-[#0B1426] px-2 py-0.5 font-mono text-[10px] font-bold text-[#38BDF8]">{cultivar.crop}</span>
                <span className="rounded-full border border-sky-400/20 bg-[#0B1426] px-2 py-0.5 font-mono text-[10px] font-bold text-[#7DD3FC]">
                    {getMaterialLabel(cultivar)}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-extrabold text-[#F0F9FF]">{cultivar.name}</h4>
              <p className="mt-1 text-xs leading-5 text-[#CBD5E1]">{cultivar.traitHighlight}</p>
              <dl className="mt-3 grid gap-1 border-t border-sky-400/20 pt-2 text-[11px] text-[#94A3B8]">
                <div className="flex justify-between gap-3"><dt>Maturity reference</dt><dd className="font-mono text-[#F0F9FF]">{cultivar.maturityDays} days</dd></div>
                <div><dt className="font-bold text-[#CBD5E1]">Suggested source</dt><dd className="mt-0.5">{cultivar.seedSourceNote}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p role="alert" className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 text-xs text-[#F0F9FF]">
          No open-pollinated fallback is listed for this strategy. Ask the local MAO or seed cooperative for an agronomically suitable substitute; do not assume a different crop is interchangeable.
        </p>
      )}

      {!commercialSupplyDisrupted && !hasCommercialOption && (
        <p className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 text-[11px] leading-5 text-[#CBD5E1]">
          This strategy currently lists open-pollinated or vegetatively propagated options only; confirm planting-material availability and health locally.
        </p>
      )}
      <p className="mt-3 text-[10px] leading-4 text-[#94A3B8]">
        Cultivar profiles are planning references, not live inventory. Availability, seed class, and suitability vary by locality and season.
      </p>
    </section>
  );
};

function getMaterialLabel(cultivar: CultivarOption): string {
  const description = `${cultivar.crop} ${cultivar.name}`.toLowerCase();
  const mango = description.includes('mango');
  const peanut = description.includes('peanut');
  if (mango && peanut) return 'Grafted mango + seed-planted intercrop';
  if (mango) return 'Grafted mango planting material';
  if (description.includes('camote') || description.includes('sweet potato')) {
    return 'Vegetative vine cuttings';
  }
  return cultivar.type === 'open-pollinated'
    ? 'Open-pollinated / farmer-saved'
    : 'Commercial / certified line';
}
