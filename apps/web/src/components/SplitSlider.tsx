import React from 'react';

interface SplitSliderProps {
  value: number;
  onChange: (value: number) => void;
}

/** Illustrative baseline-versus-rotation comparison displayed over the map. */
export const SplitSlider: React.FC<SplitSliderProps> = ({ value, onChange }) => (
    <div
      aria-label="Illustrative baseline and resilient rotation comparison"
      className="pointer-events-none absolute inset-0 z-[900] select-none overflow-hidden"
    >
      <div
        className="absolute inset-y-0 left-0 overflow-hidden bg-gradient-to-br from-orange-600/40 via-amber-800/30 to-red-700/40"
        style={{ width: `${value}%` }}
      >
        <div className="absolute inset-x-1/4 bottom-[22%] h-14 -rotate-6 rounded-[45%] border border-amber-200/70 bg-amber-950/55" />
        <div className="absolute inset-x-0 bottom-[18%] h-1 rotate-[-8deg] bg-orange-100/80" />
        <div className="absolute left-1/4 top-1/2 h-1 w-1/3 rotate-12 bg-orange-100/70" />
        <div className="absolute left-3 top-3 max-w-[46%] rounded-lg border border-orange-300 bg-orange-950/90 px-2.5 py-1.5 text-[11px] text-orange-100 shadow sm:left-4 sm:top-4 sm:max-w-[38%] sm:px-3 sm:py-2">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-orange-300">
            S1 Baseline · Illustrative / modeled
          </p>
          <p className="font-semibold">Heat stress · exposed soil · runoff risk</p>
          <span className="mt-1 inline-block rounded bg-amber-900/80 px-1.5 py-0.5 text-[9px]">
            Conceptual bare-soil patch and runoff path
          </span>
        </div>
      </div>
      <div
        className="absolute inset-y-0 right-0 overflow-hidden bg-gradient-to-bl from-emerald-700/40 via-teal-600/30 to-blue-700/40"
        style={{ width: `${100 - value}%` }}
      >
        <div className="absolute inset-x-1/4 bottom-[20%] h-10 rounded-[45%] border border-teal-100/80 bg-blue-800/45" />
        <div className="absolute inset-x-1/3 bottom-[11%] h-12 rounded-b-full border-x-2 border-b-2 border-amber-100/80" />
        <div className="absolute bottom-[14%] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-200 ring-4 ring-amber-100/50" />
        <div className="absolute right-3 top-3 max-w-[46%] rounded-lg border border-emerald-300 bg-emerald-950/90 px-2.5 py-1.5 text-right text-[11px] text-emerald-100 shadow sm:right-4 sm:top-4 sm:max-w-[38%] sm:px-3 sm:py-2">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
            S2/S3 Rotation · Illustrative / modeled
          </p>
          <p className="font-semibold">Retained moisture · canopy cover · legume roots</p>
          <span className="mt-1 inline-block rounded bg-emerald-900/80 px-1.5 py-0.5 text-[9px]">
            Conceptual root nodules; not observed
          </span>
        </div>
      </div>
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.7)]"
        style={{ left: `${value}%` }}
      />
      <div className="pointer-events-auto absolute inset-x-4 bottom-3 flex items-center gap-2 rounded-lg border border-white/70 bg-slate-950/90 px-3 py-2 text-xs shadow sm:inset-x-8 sm:gap-3">
        <span className="font-bold text-orange-300">S1</span>
        <input
          type="range"
          min={10}
          max={90}
          value={value}
          aria-label="Split comparison: baseline monoculture and resilient rotation"
          aria-valuetext={`${value}% baseline, ${100 - value}% rotation`}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          className="h-2 min-w-0 flex-1 cursor-ew-resize accent-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span className="font-bold text-emerald-300">S2/S3</span>
        <span className="hidden rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900 sm:inline">
          Illustrative / modeled
        </span>
      </div>
    </div>
);
