import React from 'react';
import { Compass } from 'lucide-react';

export type WorkbenchTab =
  | 'field-season'
  | 'priorities-rotations'
  | 'soil-agronomy'
  | 'sources-brief';

export const WORKBENCH_TABS: ReadonlyArray<{
  id: WorkbenchTab;
  number: string;
  label: string;
}> = [
  { id: 'field-season', number: '01', label: 'Field & Season' },
  { id: 'priorities-rotations', number: '02', label: 'Priorities & Rotations' },
  { id: 'soil-agronomy', number: '03', label: 'Soil & Agronomy' },
  { id: 'sources-brief', number: '04', label: 'Sources & Brief' },
];

export interface TopNavBarProps {
  activeTab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
  onReturnHome: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  onTabChange,
  onReturnHome,
}) => {
  const navigateToTab = (tab: WorkbenchTab) => {
    onTabChange(tab);
    if (typeof document !== 'undefined') {
      document.getElementById('workspace-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-400/20 bg-[#08101F]/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-[68px] max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onReturnHome}
          aria-label="Return to the FieldShift landing page"
          className="flex shrink-0 items-center gap-2.5 rounded-md text-left text-[#F0F9FF] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sky-400"
        >
          <Compass className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
          <span>
            <span className="block text-[14px] font-extrabold tracking-tight text-[#F0F9FF]">FieldShift</span>
            <span className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-sky-300/75 sm:block">
              Field workbench
            </span>
          </span>
        </button>

        <nav
          aria-label="Workbench sections"
          className="flex max-w-[740px] items-center gap-0.5 overflow-x-auto rounded-lg border border-sky-400/20 bg-[#0B1426]/85 p-1 sm:gap-1"
        >
          {WORKBENCH_TABS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                aria-label={`Go to ${item.label}${active ? ', current view' : ''}`}
                onClick={() => navigateToTab(item.id)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400 sm:px-3.5 sm:text-[11px] ${
                  active
                    ? 'border-sky-400 bg-[#0D182E] text-[#F0F9FF] shadow-[0_0_18px_rgba(56,189,248,0.22)]'
                    : 'border-transparent text-slate-400 hover:bg-[#0D182E]/70 hover:text-[#F0F9FF]'
                }`}
              >
                <span className={`font-mono text-[8px] sm:text-[9px] ${active ? 'text-[#38BDF8]' : 'text-slate-500'}`}>
                  {item.number}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <span className="hidden shrink-0 font-mono text-[9px] font-semibold uppercase tracking-wider text-sky-300/75 lg:inline-flex">
          Precision-Agri Workbench
        </span>
      </div>
    </header>
  );
};
