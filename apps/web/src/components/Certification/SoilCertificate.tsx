import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, FlaskConical, Info } from 'lucide-react';
import {
  evaluateTwoTierSoilCertificate,
  FARMS_BY_ID,
  type FarmId,
  type SoilTextureClass,
  type StrategyId,
  type StressScenarioId,
} from '@fieldshift/climate-data';
import { GroundTruthModal } from './GroundTruthModal';
import { getSentinelNdviAtPoint, type SentinelNdviObservation } from '../../utils/satelliteObservations';

export interface SoilGroundTruthFormState {
  measuredPh: string;
  measuredN: string;
  measuredP: string;
  measuredK: string;
  measuredOm: string;
  soilTextureClass: SoilTextureClass | '';
  textureVerified: boolean;
}

export const EMPTY_SOIL_FORM_STATE: SoilGroundTruthFormState = {
  measuredPh: '',
  measuredN: '',
  measuredP: '',
  measuredK: '',
  measuredOm: '',
  soilTextureClass: '',
  textureVerified: false,
};

interface SoilCertificateProps {
  farmId: FarmId;
  strategyId: StrategyId;
  month: number;
  scenario?: StressScenarioId;
  formState?: SoilGroundTruthFormState;
  onFormStateChange?: (next: SoilGroundTruthFormState) => void;
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

export const SoilCertificate: React.FC<SoilCertificateProps> = ({
  farmId,
  strategyId,
  month,
  scenario = 'baseline',
  formState,
  onFormStateChange,
}) => {
  const [internalFormState, setInternalFormState] = useState<SoilGroundTruthFormState>(
    EMPTY_SOIL_FORM_STATE,
  );
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [sentinelNdvi, setSentinelNdvi] = useState<SentinelNdviObservation | null>(null);
  const [sentinelStatus, setSentinelStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');

  const activeForm = formState ?? internalFormState;
  const {
    measuredPh,
    measuredN,
    measuredP,
    measuredK,
    measuredOm,
    soilTextureClass,
    textureVerified,
  } = activeForm;

  const updateFormField = <K extends keyof SoilGroundTruthFormState>(
    key: K,
    value: SoilGroundTruthFormState[K],
  ) => {
    const next: SoilGroundTruthFormState = { ...activeForm, [key]: value };
    if (formState === undefined) {
      setInternalFormState(next);
    }
    onFormStateChange?.(next);
  };

  useEffect(() => {
    const farm = FARMS_BY_ID[farmId];
    const controller = new AbortController();
    setSentinelNdvi(null);
    setSentinelStatus('loading');
    getSentinelNdviAtPoint(farm.latitude, farm.longitude, controller.signal)
      .then((observation) => {
        if (controller.signal.aborted) return;
        setSentinelNdvi(observation);
        setSentinelStatus(observation ? 'ready' : 'unavailable');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
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
    scenario,
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
    <section aria-labelledby="soil-certificate-heading" className="rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-5 backdrop-blur-md sm:p-6">
      <div className="flex flex-col gap-2 border-b border-sky-400/20 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
              Two-Tier Soil Resilience &amp; Terroir Assessment
            </span>
          </div>
          <h3 id="soil-certificate-heading" className="mt-1 text-xl font-extrabold text-[#F0F9FF]">
            Tier 1 Orbital Assessment (80%) + Tier 2 Ground-Truth Field Kit Verification (20%)
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-extrabold ${certificate.groundTruthVerified ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.22)]' : 'border-sky-400/25 bg-[#0D182E] text-[#7DD3FC]'}`}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {certificate.badgeStatus}
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#0D182E]">
        <div className="flex h-full w-full">
          <div className="h-full w-[80%] bg-[#38BDF8]" title="Tier 1 Orbital Assessment (80%)" />
          <div className="h-full w-[20%] bg-[#34D399]" title="Tier 2 Ground-Truth Field Kit Verification (20%)" />
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4 lg:col-span-7">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <h4 className="text-sm font-extrabold text-[#F0F9FF]">Tier 2: enter actual soil-test results</h4>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            Fields start blank. Enter results from a soil test kit or laboratory report; regional reference values are never copied into the verified form.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Measured pH" value={measuredPh} onChange={(val) => updateFormField('measuredPh', val)} min="3.5" max="9" step="0.1" />
            <Input label="Available N (kg/ha)" value={measuredN} onChange={(val) => updateFormField('measuredN', val)} min="0" max="1000" step="any" />
            <Input label="Available P (ppm)" value={measuredP} onChange={(val) => updateFormField('measuredP', val)} min="0" max="5000" step="any" />
            <Input label="Available K (ppm)" value={measuredK} onChange={(val) => updateFormField('measuredK', val)} min="0" max="5000" step="any" />
            <Input label="Organic matter (%)" value={measuredOm} onChange={(val) => updateFormField('measuredOm', val)} min="0" max="15" step="0.1" />
            <label className="block text-xs font-bold text-[#CBD5E1]">
              Observed soil texture
              <select
                value={soilTextureClass}
                onChange={(event) => updateFormField('soilTextureClass', event.currentTarget.value as SoilTextureClass | '')}
                className="mt-1 w-full rounded-lg border border-sky-400/20 bg-[#0B1426] px-2.5 py-2 font-sans text-xs text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <option value="" className="bg-[#08101F] text-[#F0F9FF]">Select texture</option>
                {TEXTURE_CLASSES.map((texture) => <option key={texture} value={texture} className="bg-[#08101F] text-[#F0F9FF]">{texture}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-semibold text-[#CBD5E1]">
            <input type="checkbox" checked={textureVerified} onChange={(event) => updateFormField('textureVerified', event.currentTarget.checked)} className="mt-0.5 h-4 w-4 accent-[#38BDF8]" />
            <span>I confirm these are measured values and the selected texture was checked in the field or by an extension/lab professional.</span>
          </label>
          {invalidFields.length > 0 && (
            <p role="alert" className="mt-2 text-[11px] font-semibold text-[#FB7185]">{invalidFields.join(' ')}</p>
          )}

          <button type="button" onClick={() => setComparisonOpen(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/20 bg-[#0B1426] px-3 py-2 text-xs font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#08101F] focus-visible:outline-2 focus-visible:outline-sky-400">
            <Info className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            Compare orbital context with field readings
          </button>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-sky-400/20 bg-[#0B1426] p-3 text-center font-mono">
            <Score label="Orbital tier · 80%" value={certificate.tier1OrbitalScore} />
            <Score label="Field tier · 20%" value={certificate.tier2GroundTruthScore} />
            <Score label="Combined" value={certificate.combinedCertificateScore} emphasis />
          </div>
        </div>

        <div className="rounded-xl border border-sky-400/20 bg-[#0D182E] p-4 lg:col-span-5">
          <h4 className="text-sm font-extrabold text-[#F0F9FF]">What the orbital tier uses—and what is missing</h4>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            The preliminary score is the selected strategy’s FARI result, weighted at 80%. It uses NASA POWER gridded climate and wetness indices plus the configured slope for the study location.
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-[#CBD5E1]">
            <li className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5">Scored inputs: NASA POWER gridded wetness, rainfall and temperature plus the configured study-location slope. POWER values are historical baselines.</li>
            <li className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5 text-[#F0F9FF]">
              <strong>Live Sentinel-2 L2A point sample (10 m): </strong>
              {sentinelStatus === 'loading' && 'Searching recent clear scenes…'}
              {sentinelStatus === 'unavailable' && 'No clear, usable scene at this farm point in the last 90 days.'}
              {sentinelStatus === 'error' && 'Live catalog or raster access failed; try again when online.'}
              {sentinelNdvi && (
                <>
                  NDVI {sentinelNdvi.ndvi.toFixed(2)} · {sentinelNdvi.ndvi < 0.2 ? 'low vegetation signal at the sampled point' : 'vegetation signal at the sampled point'} · scene {new Date(sentinelNdvi.acquisitionDate).toLocaleDateString()} · {sentinelNdvi.cloudCoverPct.toFixed(1)}% scene cloud cover. This updates the bare-soil monitoring context; the point value is not included in the FARI certificate score or treated as a parcel average.
                </>
              )}
              <span className="mt-1 block text-[10px] text-[#94A3B8]">Source: <a className="text-sky-300 underline" href="https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a" target="_blank" rel="noreferrer">Earth Search Sentinel-2 L2A catalog</a>; NDVI derived from red/NIR reflectance and screened with scene classification.</span>
            </li>
            <li className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5 text-[#CBD5E1]">The SMAP map layer shows estimated surface moisture in pixels about 9 km wide. It cannot measure moisture inside this field or the crop root zone, and it does not change this score.</li>
            <li className="rounded-lg border border-sky-400/20 bg-[#0B1426] p-2.5">Field tests are required for pH, available N-P-K, organic matter and soil texture.</li>
          </ul>
          <p className="mt-3 text-[10px] leading-4 text-[#94A3B8]">
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
  <label className="block text-xs font-bold text-[#CBD5E1]">
    {label}
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="mt-1 w-full rounded-lg border border-sky-400/20 bg-[#0B1426] px-2.5 py-2 font-mono text-xs text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-sky-400"
    />
  </label>
);

interface ScoreProps {
  label: string;
  value: number;
  emphasis?: boolean;
}

const Score: React.FC<ScoreProps> = ({ label, value, emphasis = false }) => (
  <div className={emphasis ? 'rounded border border-sky-400/25 bg-[#0D182E] p-1' : 'p-1'}>
    <p className="text-[10px] uppercase text-sky-300/75">{label}</p>
    <p className={`mt-0.5 text-lg font-extrabold ${emphasis ? 'text-[#38BDF8]' : 'text-[#F0F9FF]'}`}>{value}/100</p>
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
