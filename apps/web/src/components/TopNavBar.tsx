import React from 'react';
import { Compass, Globe, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const navigation = [
  { href: '#top', label: 'Overview' },
  { href: '#approach', label: 'How it works' },
  { href: '#field-demo', label: 'Field demo' },
  { href: '#fari-engine', label: 'FARI & Strategies' },
  { href: '#agronomic-suite', label: 'Terroir & Certification' },
];

export const TopNavBar: React.FC = () => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8DF] bg-[#F8FAF7]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
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
          className="hidden items-center gap-6 text-sm font-medium text-[#465A4E] lg:flex"
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

        <div className="flex items-center gap-2">
          <div
            aria-label="Interface language"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C7D5C5] bg-white px-2.5 text-xs font-bold text-[#465A4E]"
          >
            <Globe className="h-3.5 w-3.5 text-[#52715E]" aria-hidden="true" />
            <span>{t.languageName}</span>
          </div>

          <a
            href="#field-demo"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#1B4332] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] sm:px-4 sm:text-sm"
          >
            <Sprout className="h-4 w-4" aria-hidden="true" />
            <span>Explore demo</span>
          </a>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-[#E2E8DF] px-4 py-2 text-xs font-semibold text-[#465A4E] lg:hidden"
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
};
