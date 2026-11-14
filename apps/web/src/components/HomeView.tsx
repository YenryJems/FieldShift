import React from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Compass, Leaf, Satellite } from 'lucide-react';

interface HomeViewProps {
  onEnterWorkspace: () => void;
}

const overviewStats = [
  { value: '05', label: 'study locations' },
  { value: '15', label: 'crop rotation strategies' },
  { value: '04', label: 'decision dimensions' },
];

const planningSteps = [
  { number: '01', title: 'Choose a field', description: 'Start with a study location, its soil context, and the farming system already in place.' },
  { number: '02', title: 'Read the season', description: 'Explore historical NASA climate signals and the seasonal conditions that shape risk.' },
  { number: '03', title: 'Compare and review', description: 'Set priorities, compare rotations, and prepare a plan to discuss locally.' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onEnterWorkspace }) => (
  <main id="top" className="min-h-screen overflow-hidden bg-[#F2F3F0] text-[#17231C]">
    <div className="mx-auto min-h-screen max-w-[1440px] border-x border-[#E2E4DF] bg-[#FBFCFA] shadow-[0_18px_70px_rgba(34,46,37,0.08)]">
      <header className="relative z-20 mx-auto flex min-h-[74px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332] text-white"><Compass className="h-[18px] w-[18px]" aria-hidden="true" /></span>
          <span>
            <span className="block text-[15px] font-extrabold tracking-tight">FieldShift</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.16em] text-[#748178] sm:block">Earth data · farm choices</span>
          </span>
        </a>

        <nav aria-label="Introduction sections" className="hidden items-center gap-1 rounded-full border border-[#E2E5DF] bg-white p-1 text-[11px] font-semibold text-[#5C685F] shadow-[0_2px_10px_rgba(31,45,35,0.04)] md:flex">
          <a href="#overview" className="rounded-full bg-[#F1F4EF] px-4 py-2 text-[#25372B]">Overview</a>
          <a href="#approach" className="rounded-full px-4 py-2 transition-colors hover:bg-[#F5F7F3] hover:text-[#1B4332]">How it works</a>
          <a href="#data" className="rounded-full px-4 py-2 transition-colors hover:bg-[#F5F7F3] hover:text-[#1B4332]">Data</a>
        </nav>

        <button type="button" onClick={onEnterWorkspace} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-[#1B4332] px-4 text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#285A40] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1B4332] sm:px-5 sm:text-xs">
          Enter the field workspace <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>

      <section id="overview" className="landing-hero relative isolate flex min-h-[570px] flex-col items-center overflow-hidden px-5 pt-16 text-center sm:min-h-[640px] sm:px-8 sm:pt-20 lg:min-h-[700px] lg:pt-24">
        <div aria-hidden="true" className="landing-hero-art absolute inset-0 -z-20" />
        <div aria-hidden="true" className="landing-hero-wash absolute inset-0 -z-10" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#DCE4D9] bg-white/80 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#48604E] shadow-sm backdrop-blur-sm sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5D9163]" /> NASA Space Apps Challenge · The Next Frontier
          </p>
          <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#1C2820] sm:text-6xl lg:text-[4.75rem]">
            A changing season.<br className="hidden sm:block" /> A clearer next step.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#536157] sm:text-base sm:leading-8">
            Explore how historical climate patterns shape crop-rotation choices, then carry a grounded draft into a local conversation.
          </p>
          <button type="button" onClick={onEnterWorkspace} className="mt-7 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#1C2820] px-6 text-sm font-bold text-white shadow-[0_8px_22px_rgba(22,38,27,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#31523B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]">
            Enter the field workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <a href="#approach" className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-xs font-semibold text-[#526458] transition-colors hover:text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]">
            See the three-step journey <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="relative z-10 mt-auto flex w-full max-w-[1120px] items-end justify-between gap-4 pb-5 pt-12 text-left text-white sm:pb-7 sm:pt-16">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">A planning companion for real fields</p>
            <p className="mt-1 text-xs font-semibold sm:text-sm">From historical signals to farmer-reviewed choices.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/35 bg-black/15 px-3 py-1.5 font-mono text-[9px] font-semibold text-white/90 backdrop-blur-sm sm:inline-flex">
            <Satellite className="h-3 w-3" aria-hidden="true" /> Regional context · not a forecast
          </span>
        </div>
      </section>

      <section aria-label="FieldShift at a glance" className="border-y border-[#E6E9E3] bg-white">
        <div className="mx-auto grid max-w-[1120px] grid-cols-3 divide-x divide-[#E8EBE6] px-4 py-5 sm:px-8 sm:py-7">
          {overviewStats.map((item) => (
            <div key={item.label} className="px-3 text-center sm:px-6">
              <p className="font-mono text-2xl font-semibold tracking-tight text-[#1D2D22] sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-[9px] font-medium text-[#738078] sm:text-xs">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="approach" className="scroll-mt-20 bg-[#FBFCFA] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="max-w-sm">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#64806A]">A calm, guided workflow</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#1C2820] sm:text-3xl">One decision at a time.</h2>
            <p className="mt-3 text-sm leading-6 text-[#667269]">The workspace walks from field context to a plan worth reviewing. You choose when to move to each step.</p>
          </div>
          <ol className="divide-y divide-[#E4E8E2] border-y border-[#E4E8E2]">
            {planningSteps.map((step) => (
              <li key={step.number} className="grid gap-2 py-4 sm:grid-cols-[52px_1fr] sm:gap-4 sm:py-5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-[#74917A]">{step.number}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#26372B] sm:text-base">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#69766D] sm:text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="data" className="scroll-mt-20 border-t border-[#E6E9E3] bg-[#F5F7F3] px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#64806A]">Evidence with limits in view</p>
            <p className="mt-2 text-sm leading-6 text-[#58675D]">NASA POWER historical climate baselines, GPM IMERG rainfall estimates, and satellite map context support discussion—not live farm measurement or a weather forecast.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-[#DDE4DB] bg-white px-3 py-2 text-[10px] font-bold text-[#49604E] sm:self-auto">
            <Leaf className="h-3.5 w-3.5" aria-hidden="true" /> Farmer judgment stays central
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E6E9E3] bg-white px-5 py-6 text-[10px] leading-5 text-[#778179] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-bold text-[#38513E]">FieldShift · Team Overachiever · NASA Space Apps Challenge</span>
          <span>Educational decision support · pair climate information with local forecasts and extension expertise.</span>
        </div>
      </footer>
    </div>
  </main>
);
