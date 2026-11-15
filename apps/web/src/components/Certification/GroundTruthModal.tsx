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
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#040811]/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ground-truth-modal-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-sky-400/25 bg-[#08101F] p-5 text-[#F0F9FF] shadow-[0_0_28px_rgba(56,189,248,0.18)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sky-400/20 pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-300/75">
              Orbital data and field kit comparison · {telemetry.month}
            </p>
            <h3 id="ground-truth-modal-title" className="mt-1 text-xl font-extrabold text-[#F0F9FF]">
              Compare gridded indicators with field measurements
            </h3>
          </div>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-sky-400/20 bg-[#0D182E] px-3 text-sm font-bold text-[#F0F9FF] transition-colors hover:border-sky-400/50 hover:bg-[#0B1426] focus-visible:outline-2 focus-visible:outline-sky-400">
            Close
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
          Enter optional readings from a soil probe, rain gauge, or canopy thermometer. These values are only shown here and do not change the certificate score. POWER wetness and rainfall values are gridded product summaries, not measurements at this field.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-sky-400/20 bg-[#0D182E] font-mono text-[10px] uppercase text-sky-300/75">
                <th className="p-2.5">Indicator</th>
                <th className="p-2.5">Available gridded context</th>
                <th className="p-2.5">Field measurement</th>
                <th className="p-2.5">What it can establish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-400/20">
              <ComparisonRow
                label="Soil moisture"
                orbital={`Surface Moisture ${telemetry.surfaceSoilMoisturePct}% · Root-Zone Moisture ${telemetry.rootZoneMoisturePct}%`}
                result="Percentages scale NASA POWER wetness indices (0–100%); they do not equal volumetric water content."
              >
                <NumberInput label="Probe moisture (%)" value={soilMoisture} onChange={setSoilMoisture} min="0" max="100" />
              </ComparisonRow>
              <ComparisonRow
                label="Rainfall"
                orbital={`Daily Rainfall ${telemetry.dailyRainfallMm.toFixed(2)} · GPM IMERG ${telemetry.imergRainfallMmDay.toFixed(2)} mm/day`}
                result="Field gauge readings can resolve local rain differences that the grid may miss."
              >
                <NumberInput label="Rain gauge (mm/day)" value={rainGauge} onChange={setRainGauge} min="0" max="1000" />
              </ComparisonRow>
              <ComparisonRow
                label="Soil chemistry"
                orbital="Not directly measured by these satellite / gridded climate products."
                result="A soil laboratory or test kit is needed for pH and available N-P-K."
              >
                <p className="font-mono text-[10px] leading-5 text-[#CBD5E1]">
                  pH {formatValue(chemistry.pH)} · N {formatValue(chemistry.nitrogenKgHa)} kg/ha · P {formatValue(chemistry.phosphorusPpm)} ppm · K {formatValue(chemistry.potassiumPpm)} ppm
                </p>
              </ComparisonRow>
              <ComparisonRow
                label="Canopy temperature"
                orbital={`Air Temperature ${telemetry.airTempCelsius.toFixed(1)}°C is estimated air temperature at 2 m, not a crop-canopy temperature.`}
                result="A canopy sensor or infrared thermometer is needed for a plant-temperature reading."
              >
                <NumberInput label="Canopy temp. (°C)" value={canopyTemperature} onChange={setCanopyTemperature} min="-50" max="80" />
              </ComparisonRow>
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-lg border border-sky-400/20 bg-[#0D182E] p-3 text-[11px] leading-5 text-[#94A3B8]">
          NASA POWER values describe a gridded study location, while the field readings above must be entered from a soil test or on-site instrument. This comparison is educational; it is not laboratory certification, a credit decision, or a buyer guarantee.
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
    <th scope="row" className="p-2.5 align-top font-bold text-[#F0F9FF]">{label}</th>
    <td className="p-2.5 align-top text-[#CBD5E1]">{orbital}</td>
    <td className="p-2.5 align-top">{children}</td>
    <td className="p-2.5 align-top text-[#94A3B8]">{result}</td>
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
  <label className="block text-[10px] font-semibold text-[#CBD5E1]">
    {label}
    <input
      type="number"
      min={min}
      max={max}
      step="any"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="mt-1 w-full min-w-28 rounded border border-sky-400/20 bg-[#0D182E] px-2 py-1 font-mono text-xs text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-sky-400"
    />
  </label>
);

const formatValue = (value: number | null): string =>
  value === null ? 'not entered' : String(value);
