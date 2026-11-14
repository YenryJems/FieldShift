import React from 'react';
import { ArrowDown, ArrowRight, Globe2, Leaf, Satellite } from 'lucide-react';
import { WorkspaceView } from './WorkspaceView';

const steps = [
  {
    number: '01',
    title: 'Read the season',
    description: 'Review historical heat, rainfall, and root-zone wetness patterns for the selected study location.',
  },
  {
    number: '02',
    title: 'Compare rotations',
    description: 'See how three crop strategies score as you change priorities, field constraints, and climate scenarios.',
  },
  {
    number: '03',
    title: 'Verify locally',
    description: 'Bring the evidence and open questions to a farmer, soil laboratory, or agricultural extension officer.',
  },
];

interface HomeViewProps {
  plannerStep: number;
  onPlannerStepChange: (step: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ plannerStep, onPlannerStepChange }) => (
  <main>
    <section className="field-hero relative isolate overflow-hidden bg-[#11281D] text-white">
      <div aria-hidden="true" className="field-hero-photo absolute inset-0 -z-20" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#10251B]/95 via-[#10251B]/78 to-[#10251B]/20" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[#10251B]/70 to-transparent" />

      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:min-h-[520px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#10251B]/35 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#E2EBDD] sm:text-xs">
            <Satellite className="h-3.5 w-3.5 text-[#AFCB82]" aria-hidden="true" />
            Earth data · field decisions
          </div>
          <h1 className="mt-6 max-w-xl text-[2.65rem] font-semibold leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-[4.4rem]">
            Plan for a season that keeps changing.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
            Compare climate-resilient crop rotations with historical NASA Earth-observation data, farm priorities, and local field context.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#field-demo" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#D4E6A7] px-5 text-sm font-extrabold text-[#14271B] transition-colors hover:bg-[#E2F0C4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Start your field plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#approach" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              How it works <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <p className="mt-7 max-w-xl text-xs leading-5 text-white/75">
            An educational decision-support prototype. Historical point data and modeled scenarios support planning; they are not live field conditions or forecasts.
          </p>
        </div>

        <aside className="rounded-2xl border border-white/20 bg-[#10251B]/75 p-5 shadow-2xl backdrop-blur-sm sm:p-6" aria-label="FieldShift data approach">
          <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#C6D8B9]">A clearer view of risk</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">From orbit to the field</h2>
            </div>
            <span className="rounded-full border border-[#D4E6A7]/45 bg-[#D4E6A7]/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#E6F1D0]">2001–2025 context</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { value: '05', label: 'study locations' },
              { value: '15', label: 'crop strategies' },
              { value: '04', label: 'FARI pillars' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3">
                <p className="font-mono text-2xl font-semibold tabular-nums text-[#D4E6A7]">{item.value}</p>
                <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-xs">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0B1C15]/75 p-4">
            <div className="flex items-center gap-2 text-[#D8E7C6]">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Decision pathway</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {['Observe', 'Compare', 'Verify'].map((item, index) => (
                <div key={item} className="relative rounded-lg bg-white/[0.07] px-2 py-3">
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#D4E6A7] text-xs font-extrabold text-[#14271B]">{index + 1}</span>
                  <p className="mt-2 text-xs font-bold">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-white/70">NASA POWER and GPM IMERG historical baselines inform the comparison. Ground truth still matters.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
            <Leaf className="h-4 w-4 text-[#D4E6A7]" aria-hidden="true" />
            Farmer judgment and local soil testing stay at the center.
          </div>
        </aside>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
    </section>

    <section id="approach" className="scroll-mt-28 bg-[#F3F5EF]">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#52715E] sm:text-xs">A practical planning sequence</p>
            <h2 className="mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight text-[#17271D] sm:text-3xl">Useful climate context, connected to farm choices.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-xl border border-[#DCE3D8] bg-white p-4 sm:p-5">
                <span className="font-mono text-[11px] font-bold text-[#477251]">{step.number}</span>
                <h3 className="mt-3 text-sm font-extrabold text-[#17271D] sm:text-base">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#536458] sm:text-sm">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section id="field-demo" className="scroll-mt-24 border-t border-[#E2E8DF] bg-[#F8FAF7]">
      <div className="mx-auto max-w-[1280px] px-4 pb-2 pt-12 sm:px-6 sm:pt-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E5EDDF] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#315D3E]">
              <Leaf className="h-3 w-3" aria-hidden="true" /> Interactive decision workspace
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#17271D] sm:text-3xl">Start with the farm. Compare what could work.</h2>
            <p className="mt-2 text-sm leading-6 text-[#536458]">Choose a study location, review the strategy scores, then explore historical climate patterns and modeled risks.</p>
          </div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64756A]">NASA POWER · 2020–2025 static baseline</span>
        </div>
      </div>
      <WorkspaceView plannerStep={plannerStep} onPlannerStepChange={onPlannerStepChange} />
    </section>

    <footer className="border-t border-[#30443A] bg-[#10251B] text-[#D1DDD4]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-8 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2"><span className="font-extrabold text-white">FieldShift</span><span aria-hidden="true">·</span><span>Team Overachiever · NASA Space Apps Challenge</span></div>
        <p className="max-w-xl leading-5 text-[#C1CEC4]">Educational decision support. Pair climate information with local forecasts, field observations, and farmer or extension expertise.</p>
      </div>
    </footer>
  </main>
);
