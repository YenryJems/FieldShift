import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  CloudRain,
  Droplets,
  Leaf,
  ThermometerSun,
} from 'lucide-react';
import { WorkspaceView } from './WorkspaceView';

const planningSignals = [
  {
    icon: ThermometerSun,
    title: 'Heat',
    description: 'Spot hotter stretches that can stress crops and shift field work.',
    color: 'bg-[#FDE8D6] text-[#A7471B]',
  },
  {
    icon: CloudRain,
    title: 'Rain',
    description: 'See wet and dry windows before choosing when to sow or protect soil.',
    color: 'bg-[#DCEBFA] text-[#245A8D]',
  },
  {
    icon: Droplets,
    title: 'Soil moisture',
    description: 'Connect changing conditions to practical water and ground cover choices.',
    color: 'bg-[#E3EFDF] text-[#2D6A4F]',
  },
];

const steps = [
  {
    number: '01',
    title: 'Read the season',
    description:
      'Bring temperature, rainfall, and soil signals together in one view instead of hunting across separate charts.',
  },
  {
    number: '02',
    title: 'Explore a what-if',
    description:
      'Try a hotter or drier season and see how the outlook changes before committing to a planting plan.',
  },
  {
    number: '03',
    title: 'Plan with local knowledge',
    description:
      'Use the patterns as a conversation starter with farmers and extension experts—not a replacement for their judgment.',
  },
];

export const HomeView: React.FC = () => (
  <main>
    <section className="relative overflow-hidden bg-[#10251B] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-56 h-[36rem] w-[36rem] rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/10"
      />

      <div className="relative mx-auto grid max-w-[1280px] gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9DBCE] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B6D68A]" />
            NASA Space Apps Challenge · Team Overachiever
          </div>

          <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Weather shifts.
            <span className="block text-[#B6D68A]">Plans can, too.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#D1DDD4] sm:text-lg sm:leading-8">
            FieldShift turns Earth-observation signals into a clearer picture of
            what changing heat, rainfall, and soil moisture could mean for the
            next planting season.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#field-demo"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#B6D68A] px-5 text-sm font-bold text-[#10251B] transition-colors hover:bg-[#C9E5A4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore the field demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#approach"
              className="inline-flex h-12 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              How it works
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <p className="mt-8 max-w-lg text-xs leading-5 text-[#ADC0B3]">
            The dashboard uses NASA POWER monthly data from 2020–2025. The
            sample graphic above and what-if scenarios are not forecasts or
            farm-specific advice.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[600px]">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#F8FAF7] p-4 text-[#111C16] shadow-2xl shadow-black/25 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#52715E]">
                  FieldShift · seasonal view
                </p>
                <h2 className="mt-1 text-base font-extrabold sm:text-lg">
                  Plan for the pattern, not the average
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-[#E4F0DC] px-2.5 py-1 font-mono text-[10px] font-bold text-[#315D3E]">
                SAMPLE
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'HEAT', value: 'Rising', color: 'text-[#B4532A]' },
                { label: 'RAINFALL', value: 'Shifting', color: 'text-[#32658E]' },
                { label: 'SOIL', value: 'Monitor', color: 'text-[#376B49]' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#E2E8DF] bg-white px-2.5 py-2.5 sm:px-3"
                >
                  <p className="font-mono text-[9px] font-bold tracking-wider text-[#738278]">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-xs font-extrabold sm:text-sm ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-[#E2E8DF] bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#263B2E]">Season signals</p>
                <p className="font-mono text-[9px] text-[#78877D]">ILLUSTRATIVE</p>
              </div>
              <svg
                viewBox="0 0 520 156"
                className="mt-2 block h-auto w-full"
                role="img"
                aria-label="Illustrative seasonal chart showing rainfall bars and a temperature trend line"
              >
                <path d="M32 20H508M32 58H508M32 96H508M32 134H508" stroke="#E9EEE9" />
                <g fill="#B7D7E9">
                  <rect x="48" y="106" width="17" height="28" rx="3" />
                  <rect x="84" y="112" width="17" height="22" rx="3" />
                  <rect x="120" y="100" width="17" height="34" rx="3" />
                  <rect x="156" y="84" width="17" height="50" rx="3" />
                  <rect x="192" y="62" width="17" height="72" rx="3" />
                  <rect x="228" y="45" width="17" height="89" rx="3" />
                  <rect x="264" y="32" width="17" height="102" rx="3" />
                  <rect x="300" y="38" width="17" height="96" rx="3" />
                  <rect x="336" y="50" width="17" height="84" rx="3" />
                  <rect x="372" y="67" width="17" height="67" rx="3" />
                  <rect x="408" y="88" width="17" height="46" rx="3" />
                  <rect x="444" y="104" width="17" height="30" rx="3" />
                </g>
                <path
                  d="M56 96C80 92 88 88 128 84S184 75 200 70 240 65 272 60 320 56 344 60 392 70 416 74 448 78 452 78"
                  fill="none"
                  stroke="#D16B47"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <g fill="#D16B47" stroke="white" strokeWidth="2">
                  <circle cx="56" cy="96" r="4" />
                  <circle cx="128" cy="84" r="4" />
                  <circle cx="200" cy="70" r="4" />
                  <circle cx="272" cy="60" r="4" />
                  <circle cx="344" cy="60" r="4" />
                  <circle cx="416" cy="74" r="4" />
                </g>
                <g fill="#78877D" fontFamily="JetBrains Mono, monospace" fontSize="9">
                  <text x="46" y="150">JAN</text>
                  <text x="154" y="150">APR</text>
                  <text x="262" y="150">JUL</text>
                  <text x="370" y="150">OCT</text>
                  <text x="440" y="150">DEC</text>
                </g>
              </svg>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#637267]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[#B7D7E9]" />
                  Rainfall pattern
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-[#D16B47]" />
                  Temperature trend
                </span>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-5 -left-4 -z-10 h-24 w-24 rounded-full bg-[#B6D68A]/20 blur-2xl"
          />
        </div>
      </div>
    </section>

    <section className="border-b border-[#E2E8DF] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#52715E] sm:text-xs">
            The signals that shape a season
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#17271D] sm:text-3xl">
            Make climate information easier to act on.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {planningSignals.map(({ icon: Icon, title, description, color }) => (
            <article
              key={title}
              className="flex gap-4 rounded-xl border border-[#E2E8DF] bg-[#FAFCF9] p-5"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-bold text-[#17271D]">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#536458]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section id="approach" className="scroll-mt-24 bg-[#F3F6F1]">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#52715E] sm:text-xs">
              From observation to preparation
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#17271D] sm:text-3xl">
              A clearer starting point for the next season.
            </h2>
            <a
              href="#field-demo"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]"
            >
              Try the interactive demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-xl border border-[#DFE7DD] bg-white p-5"
              >
                <span className="font-mono text-xs font-bold text-[#5C8969]">{step.number}</span>
                <h3 className="mt-4 text-base font-extrabold text-[#17271D]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#536458]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="field-demo" className="scroll-mt-24 border-t border-[#E2E8DF] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 pb-3 pt-14 sm:px-6 sm:pt-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F0E2] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#315D3E]">
              <Leaf className="h-3 w-3" aria-hidden="true" />
              Interactive field demo
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#17271D] sm:text-3xl">
              Explore a season.               Try a different climate scenario.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#536458] sm:text-base">
              Switch locations, inspect six years of seasonal patterns, then
              test how less rain or more heat could change the historical baseline.
            </p>
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#738278]">
            NASA POWER · 2020–2025
          </span>
        </div>
      </div>
      <WorkspaceView />
    </section>

    <footer className="border-t border-[#E2E8DF] bg-[#10251B] text-[#D1DDD4]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white">FieldShift</span>
          <span aria-hidden="true">·</span>
          <span>Team Overachiever · NASA Space Apps Challenge</span>
        </div>
        <p className="max-w-xl leading-5 text-[#ADC0B3]">
          Demonstration only. Always pair climate information with local
          forecasts, field observations, and farmer or extension expertise.
        </p>
      </div>
    </footer>
  </main>
);
