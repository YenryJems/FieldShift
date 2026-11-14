import React from 'react';
import { Compass } from 'lucide-react';

const navigation = [
  { label: 'Farm' },
  { label: 'Season' },
  { label: 'Priorities' },
  { label: 'Rotations' },
  { label: 'Review' },
];

interface TopNavBarProps {
  plannerStep: number;
  onPlannerStepChange: (step: number) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ plannerStep, onPlannerStepChange }) => {
  const navigateToStep = (index: number) => {
    if (index > plannerStep) return;
    onPlannerStepChange(index);
    document.getElementById('workspace-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8DF] bg-[#FBFCFA]/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1B4332]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332] text-white"><Compass className="h-[18px] w-[18px]" aria-hidden="true" /></span>
          <span>
            <span className="block text-[14px] font-extrabold tracking-tight">FieldShift</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-[#78867D] sm:block">Field workspace</span>
          </span>
        </a>

        <nav aria-label="Planning steps" className="flex max-w-[690px] items-center gap-0.5 overflow-x-auto rounded-full border border-[#E0E5DE] bg-white p-1 shadow-[0_2px_12px_rgba(29,47,34,0.05)] sm:gap-1">
          {navigation.map((item, index) => {
            const active = plannerStep === index;
            const complete = plannerStep > index;
            return (
              <button
                key={item.label}
                type="button"
                disabled={index > plannerStep}
                aria-current={active ? 'step' : undefined}
                onClick={() => navigateToStep(index)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1B4332] sm:px-3.5 sm:text-[11px] ${active ? 'bg-[#1B4332] text-white' : complete ? 'text-[#496A50] hover:bg-[#F2F6F0]' : 'cursor-not-allowed text-[#ABB3AC]'}`}
              >
                <span className={`font-mono text-[8px] sm:text-[9px] ${active ? 'text-white/65' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <span className="hidden shrink-0 rounded-full border border-[#E0E5DE] bg-white px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#738078] lg:inline-flex">
          Step {plannerStep + 1} of {navigation.length}
        </span>
      </div>
      <div className="h-[2px] bg-[#EDF0EB]" aria-hidden="true">
        <div className="h-full bg-[#789579] transition-[width] duration-500" style={{ width: `${((plannerStep + 1) / navigation.length) * 100}%` }} />
      </div>
    </header>
  );
};
