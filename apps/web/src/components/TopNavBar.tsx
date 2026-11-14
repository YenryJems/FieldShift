import React from 'react';
import { Compass, Sprout } from 'lucide-react';

const navigation = [
  { href: '#top', label: 'Overview' },
  { href: '#approach', label: 'How it works' },
  { href: '#field-demo', label: 'Field demo' },
];

export const TopNavBar: React.FC = () => (
  <header className="sticky top-0 z-40 border-b border-[#E2E8DF] bg-[#F8FAF7]/95 backdrop-blur-sm">
    <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
      <a
        href="#top"
        className="flex shrink-0 items-center gap-2.5 rounded-md text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-white">
          <Compass className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">FieldShift</span>
      </a>

      <nav
        aria-label="Primary navigation"
        className="hidden items-center gap-7 text-sm font-medium text-[#465A4E] md:flex"
      >
        {navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="whitespace-nowrap transition-colors hover:text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <a
        href="#field-demo"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#1B4332] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] sm:px-4 sm:text-sm"
      >
        <Sprout className="h-4 w-4" aria-hidden="true" />
        <span>Explore demo</span>
      </a>
    </div>

    <nav
      aria-label="Mobile navigation"
      className="flex items-center justify-center gap-8 border-t border-[#E2E8DF] px-4 py-2.5 text-xs font-semibold text-[#465A4E] md:hidden"
    >
      {navigation.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="whitespace-nowrap transition-colors hover:text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
        >
          {item.label}
        </a>
      ))}
    </nav>
  </header>
);
