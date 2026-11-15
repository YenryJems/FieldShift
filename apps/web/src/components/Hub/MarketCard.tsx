import React, { useMemo, useState } from 'react';
import { Leaf, TrendingUp } from 'lucide-react';
import { getFarmById, type DataStatus, type FarmId, type StrategyId } from '@fieldshift/climate-data';

interface MarketCardProps {
  farmId: FarmId;
  strategyId: StrategyId;
}

interface PriceBenchmark {
  commodity: string;
  value: number;
  unit: string;
  period: string;
  source: string;
  citationUrl: string;
  status: DataStatus;
  retrievalDate: string;
}

const PSA_SOURCE = 'Philippine Statistics Authority';
const USDA_SOURCE = 'USDA AMS Market News';
const PHILIPPINE_BENCHMARKS: PriceBenchmark[] = [
  { commodity: 'Palay, national farmgate', value: 20.84, unit: 'PHP/kg', period: 'September 2026', source: PSA_SOURCE, citationUrl: 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20July%20to%20September%202026.pdf', status: 'static-baseline', retrievalDate: '2026-11-14' },
  { commodity: 'Yellow corn, national farmgate', value: 19.84, unit: 'PHP/kg', period: 'September 2026', source: PSA_SOURCE, citationUrl: 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20July%20to%20September%202026.pdf', status: 'static-baseline', retrievalDate: '2026-11-14' },
  { commodity: 'White corn, national farmgate', value: 18.92, unit: 'PHP/kg', period: 'September 2026', source: PSA_SOURCE, citationUrl: 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20July%20to%20September%202026.pdf', status: 'static-baseline', retrievalDate: '2026-11-14' },
];

const ILLINOIS_BENCHMARKS: PriceBenchmark[] = [
  { commodity: 'Corn, Central Illinois country elevator average', value: 4.26, unit: 'USD/bu', period: 'November 13, 2026', source: USDA_SOURCE, citationUrl: 'https://www.ams.usda.gov/mnreports/ams_3192.pdf', status: 'static-baseline', retrievalDate: '2026-11-14' },
  { commodity: 'Soybeans, Central Illinois country elevator average', value: 12.02, unit: 'USD/bu', period: 'November 13, 2026', source: USDA_SOURCE, citationUrl: 'https://www.ams.usda.gov/mnreports/ams_3192.pdf', status: 'static-baseline', retrievalDate: '2026-11-14' },
];

const PSA_REPORT_URL = 'https://psa.gov.ph/sites/default/files/infographics/Palay%20and%20Corn%20Statistics%2C%20July%20to%20September%202026.pdf';
const PSA_OPENSTAT_URL = 'https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__2M__NFG/';
const USDA_AMS_REPORT_URL = 'https://www.ams.usda.gov/mnreports/ams_3192.pdf';

export const MarketCard: React.FC<MarketCardProps> = ({ farmId, strategyId }) => {
  const [dryMatterYield, setDryMatterYield] = useState('');
  const [replacementPrice, setReplacementPrice] = useState('');
  const farm = getFarmById(farmId);
  const strategy = farm.strategies.find((item) => item.id === strategyId) ?? farm.strategies[0];
  const baseline = farm.strategies.find((item) => item.isBaseline) ?? farm.strategies[0];
  const benchmarks = farm.country === 'Philippines' ? PHILIPPINE_BENCHMARKS : ILLINOIS_BENCHMARKS;
  const currencyPrefix = farm.country === 'Philippines' ? 'PHP' : 'USD';
  const grossFeedReplacement = useMemo(() => {
    const yieldTons = parseOptionalNumber(dryMatterYield);
    const pricePerTon = parseOptionalNumber(replacementPrice);
    return yieldTons === null || pricePerTon === null ? null : yieldTons * pricePerTon;
  }, [dryMatterYield, replacementPrice]);
  const forageChange = Math.round((strategy.forageValue - baseline.forageValue) * 100);
  const currency = new Intl.NumberFormat(farm.country === 'Philippines' ? 'en-PH' : 'en-US', {
    maximumFractionDigits: 2,
  });

  return (
    <section aria-labelledby="market-card-heading" className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-2 border-b border-sky-400/20 pb-4">
        <TrendingUp className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">Forage and market economics</p>
          <h3 id="market-card-heading" className="mt-1 text-xl font-extrabold text-[#F0F9FF]">Post-harvest value · Strategy {strategy.id}</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <h4 className="text-sm font-extrabold text-[#F0F9FF]">Livestock forage and residue trade-off</h4>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-sky-400/20 bg-[#0B1426] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wide text-[#CBD5E1]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            Modeled strategy profile · not a feed assay
          </p>
          <p className="mt-2 text-xs leading-5 text-[#CBD5E1]">{strategy.forageSummary}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Index label="Modeled forage index" value={Math.round(strategy.forageValue * 100)} />
            <Index label="Residue cover index" value={Math.round(strategy.residueMulch * 100)} />
            <Index label="vs. baseline" value={forageChange} signed />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#94A3B8]">
            These are strategy indices, not measured forage yield, feed quality, or monetary value. Removing stalks or vines can reduce soil cover; confirm feed safety and residue needs with local livestock and extension advisers.
          </p>

          <div className="mt-4 border-t border-sky-400/20 pt-3">
            <h5 className="text-xs font-bold text-[#F0F9FF]">Estimate feed replacement from your own numbers</h5>
            <p className="mt-1 text-[10px] leading-4 text-[#94A3B8]">Enter harvestable dry matter and the local purchased-feed price. This is a gross equivalent before harvest, storage, transport, spoilage, and ration costs.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <NumberField label="Usable dry matter (tonnes/ha)" value={dryMatterYield} onChange={setDryMatterYield} min="0" />
              <NumberField label={`Feed replacement price (${currencyPrefix}/tonne)`} value={replacementPrice} onChange={setReplacementPrice} min="0" />
            </div>
            <p aria-live="polite" className="mt-2 rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5 font-mono text-xs text-[#F0F9FF]">
              Gross feed replacement equivalent:{' '}
              <strong className="text-[#38BDF8]">{grossFeedReplacement === null ? 'enter both values' : `${currencyPrefix} ${currency.format(grossFeedReplacement)}/ha`}</strong>
              <span className="mt-1 block font-sans text-[10px] text-[#94A3B8]">Farmer-entered planning estimate; not a quoted market price or guaranteed income.</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-[#F0F9FF]">Official commodity benchmarks</h4>
              <p className="mt-1 text-[10px] text-[#94A3B8]">Published reference snapshots · farmgate or elevator price, not your farm’s offer.</p>
            </div>
            <span className="rounded-full border border-sky-400/20 bg-[#0B1426] px-2 py-1 font-mono text-[9px] font-bold text-[#7DD3FC]">Static published data</span>
          </div>
          <div className="mt-3 divide-y divide-sky-400/20">
            {benchmarks.map((benchmark) => (
              <div key={benchmark.commodity} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-[#F0F9FF]">{benchmark.commodity}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">{benchmark.period}</p>
                  <p className="mt-0.5 text-[9px] text-[#94A3B8]">
                    <a className="text-sky-300 underline" href={benchmark.citationUrl} target="_blank" rel="noreferrer">{benchmark.source}</a>
                    {' · '}{benchmark.status} snapshot checked {benchmark.retrievalDate}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-extrabold text-[#38BDF8]">{benchmark.value.toFixed(2)} <span className="text-[10px] text-[#7DD3FC]">{benchmark.unit}</span></p>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-lg border border-sky-400/15 bg-[#0B1426] p-3 text-[10px] leading-4 text-[#CBD5E1]">
            {farm.country === 'Philippines'
              ? 'PSA national September 2026 farmgate figures; they are not province-level quotes and do not include mungbean, mango, peanut, or forage prices.'
              : 'USDA AMS Central Illinois country-elevator averages. Bids vary with delivery point, moisture, grade, freight, and basis; call a local buyer for a current offer.'}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold text-sky-300">
            {farm.country === 'Philippines' ? (
              <>
                <a className="underline hover:text-sky-200" href={PSA_REPORT_URL} target="_blank" rel="noreferrer">PSA Q3 2026 palay &amp; corn release</a>
                <a className="underline hover:text-sky-200" href={PSA_OPENSTAT_URL} target="_blank" rel="noreferrer">PSA OpenSTAT price tables</a>
              </>
            ) : (
              <a className="underline hover:text-sky-200" href={USDA_AMS_REPORT_URL} target="_blank" rel="noreferrer">USDA AMS Illinois Grain Bids report</a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

interface IndexProps {
  label: string;
  value: number;
  signed?: boolean;
}

const Index: React.FC<IndexProps> = ({ label, value, signed = false }) => (
  <div className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2">
    <p className="text-[9px] leading-3 text-sky-300/75">{label}</p>
    <p className="mt-1 font-mono text-sm font-extrabold text-[#38BDF8]">{signed && value > 0 ? '+' : ''}{value}{signed ? ' pts' : '/100'}</p>
  </div>
);

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, onChange, min }) => (
  <label className="block text-[10px] font-semibold text-[#CBD5E1]">
    {label}
    <input
      type="number"
      inputMode="decimal"
      min={min}
      step="any"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="mt-1 w-full rounded-lg border border-sky-400/20 bg-[#0B1426] px-2.5 py-2 font-mono text-xs text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-sky-400"
    />
  </label>
);

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
