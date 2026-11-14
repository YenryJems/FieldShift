import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import {
  evaluateTwoTierSoilCertificate,
  FARMS_BY_ID,
  type FarmId,
  type SoilTextureClass,
  type StrategyId,
} from '@fieldshift/climate-data';
import { GroundTruthModal } from './GroundTruthModal';
import { getSentinelNdviAtPoint, type SentinelNdviObservation } from '../../utils/satelliteObservations';

interface SoilCertificateProps {
  farmId: FarmId;
  strategyId: StrategyId;
  month: number;
}

const TEXTURE_CLASSES: SoilTextureClass[] = [
  'sand',
  'loamy-sand',
  'sandy-loam',
  'loam',
  'silt-loam',
  'clay-loam',
  'clay',
];

export const SoilCertificate: React.FC<SoilCertificateProps> = ({ farmId, strategyId, month }) => {
  const [measuredPh, setMeasuredPh] = useState('');
  const [measuredN, setMeasuredN] = useState('');
  const [measuredP, setMeasuredP] = useState('');
  const [measuredK, setMeasuredK] = useState('');
  const [measuredOm, setMeasuredOm] = useState('');
  const [soilTextureClass, setSoilTextureClass] = useState<SoilTextureClass | ''>('');
  const [textureVerified, setTextureVerified] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [sentinelNdvi, setSentinelNdvi] = useState<SentinelNdviObservation | null>(null);
  const [sentinelStatus, setSentinelStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');

  useEffect(() => {
    const farm = FARMS_BY_ID[farmId];
    const controller = new AbortController();
    setSentinelNdvi(null);
    setSentinelStatus('loading');
    getSentinelNdviAtPoint(farm.latitude, farm.longitude, controller.signal)
      .then((observation) => {
        setSentinelNdvi(observation);
        setSentinelStatus(observation ? 'ready' : 'unavailable');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSentinelStatus('error');
      });
    return () => controller.abort();
  }, [farmId]);

  const measured = useMemo(() => ({
    measuredPh: parseBounded(measuredPh, 3.5, 9),
    measuredNitrogenKgHa: parseBounded(measuredN, 0, 1000),
    measuredPhosphorusPpm: parseBounded(measuredP, 0, 5000),
    measuredPotassiumPpm: parseBounded(measuredK, 0, 5000),
    measuredOrganicMatterPct: parseBounded(measuredOm, 0, 15),
    soilTextureClass: soilTextureClass || null,
    soilTextureVerified: textureVerified,
  }), [measuredPh, measuredN, measuredP, measuredK, measuredOm, soilTextureClass, textureVerified]);

  const certificate = evaluateTwoTierSoilCertificate(
    farmId,
    strategyId,
    month,
    'baseline',
    measured,
  );

  const invalidFields = [
    hasInvalid(measuredPh, 3.5, 9) ? 'pH must be between 3.5 and 9.0.' : null,
    hasInvalid(measuredN, 0, 1000) ? 'Nitrogen must be between 0 and 1,000 kg/ha.' : null,
    hasInvalid(measuredP, 0, 5000) ? 'Phosphorus must be between 0 and 5,000 ppm.' : null,
    hasInvalid(measuredK, 0, 5000) ? 'Potassium must be between 0 and 5,000 ppm.' : null,
    hasInvalid(measuredOm, 0, 15) ? 'Organic matter must be between 0 and 15%.' : null,
  ].filter((message): message is string => message !== null);

  return (
    <section aria-labelledby="soil-certificate-heading" className="rounded-2xl border border-[#D4DDD0] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 border-b border-[#E2E8DF] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
              Two-Tier Soil Resilience &amp; Terroir Assessment
            </span>
          </div>
          <h3 id="soil-certificate-heading" className="mt-1 text-xl font-extrabold text-[#17271D]">
            Tier 1 Orbital Assessment (80%) + Tier 2 Ground-Truth Field Kit Verification (20%)
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-extrabold ${certificate.groundTruthVerified ? 'bg-[#1B4332] text-white' : 'bg-[#FFF3CD] text-[#92400E]'}`}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {certificate.badgeStatus}
        </span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 lg:col-span-7">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
            <h4 className="text-sm font-extrabold text-[#17271D]">Tier 2: enter actual soil-test results</h4>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#536458]">
            Fields start blank. Enter results from a soil test kit or laboratory report; regional reference values are never copied into the verified form.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Measured pH" value={measuredPh} onChange={setMeasuredPh} min="3.5" max="9" step="0.1" />
            <Input label="Available N (kg/ha)" value={measuredN} onChange={setMeasuredN} min="0" max="1000" step="any" />
            <Input label="Available P (ppm)" value={measuredP} onChange={setMeasuredP} min="0" max="5000" step="any" />
            <Input label="Available K (ppm)" value={measuredK} onChange={setMeasuredK} min="0" max="5000" step="any" />
            <Input label="Organic matter (%)" value={measuredOm} onChange={setMeasuredOm} min="0" max="15" step="0.1" />
            <label className="block text-xs font-bold text-[#263B2E]">
              Observed soil texture
              <select
                value={soilTextureClass}
                onChange={(event) => setSoilTextureClass(event.currentTarget.value as SoilTextureClass | '')}
                className="mt-1 w-full rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-2 font-sans text-xs"
              >
                <option value="">Select texture</option>
                {TEXTURE_CLASSES.map((texture) => <option key={texture} value={texture}>{texture}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-semibold text-[#1B4332]">
            <input type="checkbox" checked={textureVerified} onChange={(event) => setTextureVerified(event.currentTarget.checked)} className="mt-0.5 h-4 w-4 accent-[#1B4332]" />
            <span>I confirm these are measured values and the selected texture was checked in the field or by an extension/lab professional.</span>
          </label>
          {invalidFields.length > 0 && (
            <p role="alert" className="mt-2 text-[11px] font-semibold text-red-800">{invalidFields.join(' ')}</p>
          )}

          <button type="button" onClick={() => setComparisonOpen(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C7D5C5] bg-white px-3 py-2 text-xs font-bold text-[#1B4332] hover:bg-[#F3F6F1] focus-visible:outline-2">
            <Info className="h-4 w-4" aria-hidden="true" />
            Compare orbital context with field readings
          </button>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-[#C7D5C5] bg-white p-3 text-center font-mono">
            <Score label="Orbital tier · 80%" value={certificate.tier1OrbitalScore} />
            <Score label="Field tier · 20%" value={certificate.tier2GroundTruthScore} />
            <Score label="Combined" value={certificate.combinedCertificateScore} emphasis />
          </div>
        </div>

        <div className="rounded-xl border border-[#D4DDD0] bg-[#F8FAF7] p-4 lg:col-span-5">
          <h4 className="text-sm font-extrabold text-[#17271D]">What the orbital tier uses—and what is missing</h4>
          <p className="mt-1 text-xs leading-5 text-[#536458]">
            The preliminary score is the selected strategy’s FARI result, weighted at 80%. It uses NASA POWER gridded climate and wetness indices plus the configured slope for the study location.
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-[#3B4D41]">
            <li className="rounded-lg bg-white p-2.5">Scored inputs: NASA POWER gridded wetness, rainfall and temperature plus the configured study-location slope. POWER values are historical baselines.</li>
            <li className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-sky-950">
              <strong>Live Sentinel-2 L2A point sample (10 m): </strong>
              {sentinelStatus === 'loading' && 'Searching recent clear scenes…'}
              {sentinelStatus === 'unavailable' && 'No clear, usable scene at this farm point in the last 90 days.'}
              {sentinelStatus === 'error' && 'Live catalog or raster access failed; try again when online.'}
              {sentinelNdvi && (
                <>
                  NDVI {sentinelNdvi.ndvi.toFixed(2)} · {sentinelNdvi.ndvi < 0.2 ? 'low vegetation signal at the sampled point' : 'vegetation signal at the sampled point'} · scene {new Date(sentinelNdvi.acquisitionDate).toLocaleDateString()} · {sentinelNdvi.cloudCoverPct.toFixed(1)}% scene cloud cover. This updates the bare-soil monitoring context; the point value is not included in the FARI certificate score or treated as a parcel average.
                </>
              )}
              <span className="mt-1 block text-[10px]">Source: <a className="underline" href="https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a" target="_blank" rel="noreferrer">Earth Search Sentinel-2 L2A catalog</a>; NDVI derived from red/NIR reflectance and screened with scene classification.</span>
            </li>
            <li className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-sky-950">The SMAP map layer shows estimated surface moisture in pixels about 9 km wide. It cannot measure moisture inside this field or the crop root zone, and it does not change this score.</li>
            <li className="rounded-lg bg-white p-2.5">Field tests are required for pH, available N-P-K, organic matter and soil texture.</li>
          </ul>
          <p className="mt-3 text-[10px] leading-4 text-[#65766A]">
            This prototype badge is not an accredited soil certificate and does not guarantee buyer contracts, premiums, or credit eligibility. Those decisions remain with labs, buyers, lenders, and local agricultural authorities.
          </p>
        </div>
      </div>

      <GroundTruthModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        farmId={farmId}
        month={month}
        chemistry={{
          pH: measured.measuredPh,
          nitrogenKgHa: measured.measuredNitrogenKgHa,
          phosphorusPpm: measured.measuredPhosphorusPpm,
          potassiumPpm: measured.measuredPotassiumPpm,
        }}
      />
    </section>
  );
};

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
  step: string;
}

const Input: React.FC<InputProps> = ({ label, value, onChange, min, max, step }) => (
  <label className="block text-xs font-bold text-[#263B2E]">
    {label}
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="mt-1 w-full rounded-lg border border-[#C7D5C5] bg-white px-2.5 py-2 font-mono text-xs"
    />
  </label>
);

interface ScoreProps {
  label: string;
  value: number;
  emphasis?: boolean;
}

const Score: React.FC<ScoreProps> = ({ label, value, emphasis = false }) => (
  <div className={emphasis ? 'rounded bg-[#E8F3EC] p-1' : ''}>
    <p className="text-[10px] uppercase text-[#65766A]">{label}</p>
    <p className={`mt-0.5 text-lg font-extrabold ${emphasis ? 'text-[#1B4332]' : 'text-[#17271D]'}`}>{value}/100</p>
  </div>
);

const parseBounded = (raw: string, min: number, max: number): number | null => {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
};

const hasInvalid = (raw: string, min: number, max: number): boolean => {
  if (!raw.trim()) return false;
  const value = Number(raw);
  return !Number.isFinite(value) || value < min || value > max;
};
