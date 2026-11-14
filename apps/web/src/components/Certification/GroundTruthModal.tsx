import React, { useEffect, useState } from 'react';
import { getMonthlyTelemetry, type FarmId } from '@fieldshift/climate-data';

interface GroundTruthModalProps {
  open: boolean;
  onClose: () => void;
  farmId: FarmId;
  month: number;
  chemistry: {
    pH: number | null;
    nitrogenKgHa: number | null;
    phosphorusPpm: number | null;
    potassiumPpm: number | null;
  };
}

export const GroundTruthModal: React.FC<GroundTruthModalProps> = ({
  open,
  onClose,
  farmId,
  month,
  chemistry,
}) => {
  const [soilMoisture, setSoilMoisture] = useState('');
  const [rainGauge, setRainGauge] = useState('');
  const [canopyTemperature, setCanopyTemperature] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const telemetry = getMonthlyTelemetry(farmId, month);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ground-truth-modal-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8DF] pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#52715E]">
              Orbital data and field kit comparison · {telemetry.month}
            </p>
            <h3 id="ground-truth-modal-title" className="mt-1 text-xl font-extrabold text-[#17271D]">
              Compare gridded indicators with field measurements
            </h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-[#C7D5C5] px-3 text-sm font-bold text-[#1B4332] focus-visible:outline-2">
            Close
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#536458]">
          Enter optional readings from a soil probe, rain gauge, or canopy thermometer. These values are only shown here and do not change the certificate score. POWER wetness and rainfall values are gridded product summaries, not measurements at this field.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4DDD0] bg-[#F3F6F1] font-mono text-[10px] uppercase text-[#52715E]">
                <th className="p-2.5">Indicator</th>
                <th className="p-2.5">Available gridded context</th>
                <th className="p-2.5">Field measurement</th>
                <th className="p-2.5">What it can establish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8DF]">
              <ComparisonRow
                label="Soil moisture"
                orbital={`NASA POWER GWETTOP ${telemetry.gwetTop.toFixed(2)} · GWETROOT ${telemetry.gwetRoot.toFixed(2)} (unitless indices)`}
                result="Indices indicate broad wetness context; they do not equal volumetric water content."
              >
                <NumberInput label="Probe moisture (%)" value={soilMoisture} onChange={setSoilMoisture} min="0" max="100" />
              </ComparisonRow>
              <ComparisonRow
                label="Rainfall"
                orbital={`POWER PRECTOTCORR ${telemetry.precCorr.toFixed(2)} · GPM IMERG ${telemetry.imergPrecipitationMmDay.toFixed(2)} mm/day`}
                result="Field gauge readings can resolve local rain differences that the grid may miss."
              >
                <NumberInput label="Rain gauge (mm/day)" value={rainGauge} onChange={setRainGauge} min="0" max="1000" />
              </ComparisonRow>
              <ComparisonRow
                label="Soil chemistry"
                orbital="Not directly measured by these satellite / gridded climate products."
                result="A soil laboratory or test kit is needed for pH and available N-P-K."
              >
                <p className="font-mono text-[10px] leading-5 text-[#3B4D41]">
                  pH {formatValue(chemistry.pH)} · N {formatValue(chemistry.nitrogenKgHa)} kg/ha · P {formatValue(chemistry.phosphorusPpm)} ppm · K {formatValue(chemistry.potassiumPpm)} ppm
                </p>
              </ComparisonRow>
              <ComparisonRow
                label="Canopy temperature"
                orbital={`NASA POWER T2M ${telemetry.t2m.toFixed(1)}°C is 2 m air temperature; ECOSTRESS canopy LST is not connected.`}
                result="A canopy sensor or infrared thermometer is needed for a plant-temperature reading."
              >
                <NumberInput label="Canopy temp. (°C)" value={canopyTemperature} onChange={setCanopyTemperature} min="-50" max="80" />
              </ComparisonRow>
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">
          Sentinel-2 NDVI, SMAP site measurements, ECOSTRESS land-surface temperature, and PRISM normals are not ingested as verified farm-level inputs in this certificate. Do not use this comparison as laboratory certification, a credit decision, or a buyer guarantee.
        </p>
      </section>
    </div>
  );
};

interface ComparisonRowProps {
  label: string;
  orbital: string;
  result: string;
  children: React.ReactNode;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ label, orbital, result, children }) => (
  <tr>
    <th scope="row" className="p-2.5 align-top font-bold text-[#17271D]">{label}</th>
    <td className="p-2.5 align-top text-[#3B4D41]">{orbital}</td>
    <td className="p-2.5 align-top">{children}</td>
    <td className="p-2.5 align-top text-[#536458]">{result}</td>
  </tr>
);

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, min, max }) => (
  <label className="block text-[10px] font-semibold text-[#536458]">
    {label}
    <input
      type="number"
      min={min}
      max={max}
      step="any"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="mt-1 w-full min-w-28 rounded border border-[#C7D5C5] px-2 py-1 font-mono text-xs"
    />
  </label>
);

const formatValue = (value: number | null): string =>
  value === null ? 'not entered' : String(value);
