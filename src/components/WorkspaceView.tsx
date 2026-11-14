import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, OctagonAlert } from 'lucide-react';

type SamplePlotKey = 'plot-a' | 'plot-b';
type OverlayKey = 'smap' | 'ndvi' | 'gpm' | 'srtm';

interface SamplePlot {
  id: SamplePlotKey;
  label: string;
  title: string;
  meta: string;
  metrics: Array<{ label: string; value: string }>;
  monthlyRain: number[];
  monthlyNdvi: number[];
}

const SAMPLE_PLOTS: Record<SamplePlotKey, SamplePlot> = {
  'plot-a': {
    id: 'plot-a',
    label: 'Plot A · Lowland Basin',
    title: 'Rain-Fed Corn & Rice Basin',
    meta: '15.482° N, 120.712° E · 4.2 ha · 1.8% slope · Silty Clay Loam',
    metrics: [
      { label: 'SMAP Moisture Low', value: '15% vol.' },
      { label: 'MODIS Mean NDVI', value: '0.45' },
      { label: 'GPM Peak Rain', value: '365 mm' },
      { label: 'ECOSTRESS Peak Heat', value: '39.1°C' },
    ],
    monthlyRain: [22, 14, 18, 36, 165, 268, 342, 365, 295, 210, 88, 38],
    monthlyNdvi: [0.32, 0.22, 0.19, 0.21, 0.29, 0.48, 0.71, 0.79, 0.76, 0.54, 0.44, 0.37],
  },
  'plot-b': {
    id: 'plot-b',
    label: 'Plot B · Sloped Upland',
    title: 'Volcanic Foothill Upland Farm',
    meta: '15.614° N, 120.438° E · 2.8 ha · 13.4% slope · Sandy Clay Loam',
    metrics: [
      { label: 'SMAP Moisture Low', value: '13% vol.' },
      { label: 'MODIS Mean NDVI', value: '0.39' },
      { label: 'GPM Peak Rain', value: '410 mm' },
      { label: 'ECOSTRESS Peak Heat', value: '39.8°C' },
    ],
    monthlyRain: [16, 11, 15, 42, 215, 318, 395, 410, 310, 175, 64, 28],
    monthlyNdvi: [0.28, 0.21, 0.17, 0.20, 0.26, 0.44, 0.66, 0.73, 0.68, 0.42, 0.31, 0.29],
  },
};

const OVERLAYS: Array<{ id: OverlayKey; label: string; tint: string }> = [
  { id: 'smap', label: 'SMAP Moisture', tint: 'rgba(11, 61, 145, 0.16)' },
  { id: 'ndvi', label: 'MODIS Cover', tint: 'rgba(27, 67, 50, 0.20)' },
  { id: 'gpm', label: 'GPM Rainfall', tint: 'rgba(2, 132, 199, 0.18)' },
  { id: 'srtm', label: 'SRTM Slope', tint: 'rgba(217, 119, 6, 0.18)' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REPRESENTATIVE_STRATEGIES = [
  {
    rank: '#1 Best Fit',
    title: 'Soil & Water Regenerator',
    crop: 'Monsoon Rice → Mungbean / Cowpea Cover',
    score: 91,
    water: 'Low Water',
    soil: 'Rebuilds Nitrogen',
    cost: 'Low–Moderate Cost',
    windowStatus: 'optimal' as const,
    windowText: 'Plant cover into Nov residual moisture; hold urea before Jul storms.',
    coverBar: ['cover', 'cover', 'mulch', 'mulch', 'mulch', 'main', 'main', 'main', 'main', 'main', 'cover', 'cover'],
  },
  {
    rank: '#2 Alternative',
    title: 'Climate-Resilient Cash Crop',
    crop: 'Monsoon Rice → Sorghum / Sweet Potato',
    score: 84,
    water: 'Low Water',
    soil: 'Deep Root Structure',
    cost: 'Moderate Cost',
    windowStatus: 'caution' as const,
    windowText: 'Sow deep-rooting crop before Feb dry-down below 18% moisture.',
    coverBar: ['cash', 'cash', 'cash', 'cash', 'mulch', 'main', 'main', 'main', 'main', 'main', 'cash', 'cash'],
  },
  {
    rank: '#3 Baseline',
    title: 'Current Practice (Unadapted)',
    crop: 'Monsoon Rice → Unprotected Bare Fallow',
    score: 42,
    water: 'High Demand',
    soil: 'Depleting Topsoil',
    cost: 'Moderate Cost',
    windowStatus: 'hold' as const,
    windowText: 'Bare-field erosion window in May–Jun; high fertilizer runoff risk.',
    coverBar: ['bare', 'bare', 'bare', 'bare', 'bare', 'main', 'main', 'main', 'main', 'main', 'bare', 'bare'],
  },
];

export const WorkspaceView: React.FC = () => {
  const [plotKey, setPlotKey] = useState<SamplePlotKey>('plot-a');
  const [overlay, setOverlay] = useState<OverlayKey>('smap');
  const [droughtOn, setDroughtOn] = useState(false);
  const [heatOn, setHeatOn] = useState(false);

  const plot = SAMPLE_PLOTS[plotKey];
  const overlayTint = OVERLAYS.find((o) => o.id === overlay)?.tint ?? 'rgba(11, 61, 145, 0.16)';

  // SVG Timeline path
  const W = 840;
  const H = 200;
  const padX = 36;
  const padY = 24;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const colW = chartW / 12;

  const ndviPoints = plot.monthlyNdvi
    .map((val, i) => {
      const x = padX + i * colW + colW / 2;
      const y = padY + chartH - val * chartH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-6 space-y-12">
      {/* Header & Plot Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#E2E8DF] pb-6">
        <div>
          <p className="font-mono text-xs text-[#465A4E]">{plot.meta}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111C16]">
            {plot.title}
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Sample farm plots"
          className="inline-flex self-start rounded-lg border border-[#CBD5C7] bg-[#EEF2EC] p-1"
        >
          {(['plot-a', 'plot-b'] as SamplePlotKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={plotKey === key}
              onClick={() => setPlotKey(key)}
              className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                plotKey === key ? 'bg-white text-[#111C16] shadow-xs' : 'text-[#465A4E]'
              }`}
            >
              {SAMPLE_PLOTS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Visual Map & Key Telemetry Representation */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-8 rounded-xl border border-[#D4DDD0] bg-white overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8DF] px-4 py-2.5">
            {OVERLAYS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOverlay(item.id)}
                className={`h-8 rounded-md px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  overlay === item.id
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#354A3E] hover:bg-[#F3F6F1]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-h-[240px] bg-[#EDF2EA]">
            <svg viewBox="0 0 800 320" className="h-full w-full block" role="img" aria-label="Sample field map representation">
              <rect width="800" height="320" fill="#EDF2EA" />
              {/* Subtle overlay tint */}
              <rect width="800" height="320" fill={overlayTint} />
              {/* Contour lines */}
              <g fill="none" stroke="#8FA897" strokeWidth="1" strokeDasharray="4 4" opacity="0.7">
                <path d="M 0 80 Q 260 65, 520 110 T 800 75" />
                <path d="M 0 160 Q 280 140, 540 190 T 800 155" />
                <path d="M 0 240 Q 250 220, 500 265 T 800 235" />
              </g>
              {/* Plot A Polygon */}
              <path
                d="M 150 95 L 330 82 L 355 205 L 170 225 Z"
                fill={plotKey === 'plot-a' ? 'rgba(27, 67, 50, 0.28)' : 'rgba(255,255,255,0.4)'}
                stroke={plotKey === 'plot-a' ? '#1B4332' : '#5A6D62'}
                strokeWidth={plotKey === 'plot-a' ? 2.5 : 1.2}
              />
              <circle cx="250" cy="152" r="6" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
              <text x="264" y="156" fontSize="12" fontWeight="700" fill="#111C16">
                Plot A
              </text>

              {/* Plot B Polygon */}
              <path
                d="M 465 65 L 645 85 L 620 210 L 445 185 Z"
                fill={plotKey === 'plot-b' ? 'rgba(27, 67, 50, 0.28)' : 'rgba(255,255,255,0.4)'}
                stroke={plotKey === 'plot-b' ? '#1B4332' : '#5A6D62'}
                strokeWidth={plotKey === 'plot-b' ? 2.5 : 1.2}
              />
              <circle cx="545" cy="135" r="6" fill="#1B4332" stroke="#FFFFFF" strokeWidth="2" />
              <text x="559" y="139" fontSize="12" fontWeight="700" fill="#111C16">
                Plot B
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-[#D4DDD0] bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-[#2D6A4F] font-mono">Sample Telemetry</div>
            <p className="mt-1 text-sm text-[#354A3E]">
              Representative NASA satellite readings for the selected farm plot.
            </p>
          </div>

          <dl className="mt-5 divide-y divide-[#E2E8DF] border-t border-[#E2E8DF] text-sm">
            {plot.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-3">
                <dt className="text-[#465A4E]">{m.label}</dt>
                <dd className="font-mono font-bold text-[#111C16] tabular-nums">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. Seasonal Timeline Representation */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-extrabold text-[#111C16]">12-Month Stress Timeline</h2>
          <span className="text-xs text-[#465A4E]">Shaded months indicate bare-soil storm risk</span>
        </div>

        <div className="rounded-xl border border-[#D4DDD0] bg-white p-4 overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px] h-auto block">
            {MONTHS.map((month, i) => {
              const x0 = padX + i * colW;
              const cx = x0 + colW / 2;
              const barH = (plot.monthlyRain[i] / 450) * chartH;
              const isRisk = plot.monthlyNdvi[i] < 0.3 && plot.monthlyRain[i] >= 120;

              return (
                <g key={month}>
                  {isRisk && (
                    <rect
                      x={x0 + 2}
                      y={padY}
                      width={colW - 4}
                      height={chartH}
                      rx="3"
                      fill="rgba(220, 38, 38, 0.08)"
                    />
                  )}
                  <rect
                    x={cx - 12}
                    y={padY + chartH - barH}
                    width="24"
                    height={barH}
                    rx="2"
                    fill="rgba(11, 61, 145, 0.20)"
                  />
                  <text
                    x={cx}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#465A4E"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {month}
                  </text>
                </g>
              );
            })}
            <path d={ndviPoints} fill="none" stroke="#1B4332" strokeWidth="2.5" />
          </svg>
        </div>
      </section>

      {/* 3. Priorities & Scenario Toggles (Representation) */}
      <section className="rounded-xl border border-[#D4DDD0] bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4 text-sm">
            {[
              { label: 'Conserve Water', val: 70 },
              { label: 'Stop Erosion', val: 80 },
              { label: 'Soil Nutrients', val: 75 },
              { label: 'Extra Income', val: 60 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#111C16]">{item.label}</span>
                  <span className="font-mono text-xs text-[#1B4332] tabular-nums">{item.val}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E2E8DF] overflow-hidden">
                  <div className="h-full bg-[#1B4332]" style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-[#E2E8DF] pt-4 lg:pt-0 lg:pl-6 text-xs font-semibold text-[#111C16]">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={droughtOn}
                onChange={(e) => setDroughtOn(e.target.checked)}
                className="h-4 w-4 accent-[#D97706]"
              />
              <span>-20% Rainfall</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={heatOn}
                onChange={(e) => setHeatOn(e.target.checked)}
                className="h-4 w-4 accent-[#DC2626]"
              />
              <span>+2°C Heatwave</span>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Representative Strategy Cards */}
      <section>
        <h2 className="mb-4 text-lg font-extrabold text-[#111C16]">
          Representative Crop Rotation Strategies
        </h2>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {REPRESENTATIVE_STRATEGIES.map((s) => {
            const isTop = s.rank.startsWith('#1');
            return (
              <div
                key={s.title}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 ${
                  isTop ? 'border-[#1B4332] ring-1 ring-[#1B4332]' : 'border-[#D4DDD0]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-bold text-[#2D6A4F]">{s.rank}</div>
                      <h3 className="mt-1 text-base font-extrabold text-[#111C16]">{s.title}</h3>
                      <p className="mt-0.5 text-xs text-[#465A4E]">{s.crop}</p>
                    </div>
                    <div className="font-mono text-xl font-extrabold text-[#111C16] tabular-nums">
                      {s.score}
                      <span className="text-xs font-normal text-[#465A4E]">/100</span>
                    </div>
                  </div>

                  {/* Thin 12-Month Cover Strip */}
                  <div className="mt-4 grid grid-cols-12 gap-0.5 h-1.5 rounded-xs overflow-hidden">
                    {s.coverBar.map((phase, idx) => (
                      <div
                        key={idx}
                        className={
                          phase === 'bare'
                            ? 'bg-[#DC2626]'
                            : phase === 'cover'
                              ? 'bg-[#1B4332]'
                              : phase === 'cash'
                                ? 'bg-[#0B3D91]'
                                : phase === 'mulch'
                                  ? 'bg-[#D97706]'
                                  : 'bg-[#94A39A]'
                        }
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#354A3E]">
                    <span>{s.water}</span>
                    <span>·</span>
                    <span>{s.soil}</span>
                    <span>·</span>
                    <span>{s.cost}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 border-t border-[#E2E8DF] pt-3.5 text-xs text-[#1F2E25]">
                  {s.windowStatus === 'optimal' && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden="true" />
                  )}
                  {s.windowStatus === 'caution' && (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" aria-hidden="true" />
                  )}
                  {s.windowStatus === 'hold' && (
                    <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden="true" />
                  )}
                  <span>{s.windowText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="border-t border-[#E2E8DF] pt-6 text-xs text-[#465A4E]">
        Interface representation for FieldShift (Team Overachiever · NASA Space Apps Challenge). Supports—and never replaces—farmer judgment and local extension expertise.
      </p>
    </div>
  );
};
