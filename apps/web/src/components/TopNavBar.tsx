import React, { useEffect, useState } from 'react';
import { Compass, Globe, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const navigation = [
  { href: '#top', label: 'Mission' },
  { href: '#approach', label: 'How it works' },
  { href: '#field-sites', label: 'Field sites' },
  { href: '#fari-engine', label: 'Strategy lab' },
  { href: '#field-map', label: 'Climate & map' },
  { href: '#seasonal-analysis', label: 'Seasonal outlook' },
  { href: '#agronomic-suite', label: 'Insights' },
  { href: '#data-sources', label: 'Data & trust' },
];

export const TopNavBar: React.FC = () => {
  const { t } = useLanguage();
  const [activeHref, setActiveHref] = useState('#top');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const targets = navigation
      .map(({ href }) => document.querySelector<HTMLElement>(href))
      .filter((element): element is HTMLElement => element !== null);
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement && visible.target.id) {
          setActiveHref(`#${visible.target.id}`);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.15, 0.35, 0.6] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <aside className="portfolio-rail fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#080B0E] px-7 py-7 text-white lg:flex">
        <a href="#top" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9ED5E8]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#174733] text-[#E5F0DA]"><Compass className="h-5 w-5" aria-hidden="true" /></span>
          <span><span className="block text-base font-extrabold tracking-tight">FieldShift</span><span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#A2ADB7]">Earth data · farm choices</span></span>
        </a>

        <p className="mt-14 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#8995A1]">Navigation</p>
        <nav aria-label="Page navigation" className="relative mt-5 flex-1">
          <span aria-hidden="true" className="absolute bottom-5 left-[5px] top-5 w-px bg-[#26333E]" />
          <ol className="relative space-y-2">
            {navigation.map((item, index) => {
              const active = activeHref === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-current={active ? 'location' : undefined}
                    onClick={() => setActiveHref(item.href)}
                    className={`group flex min-h-12 items-center gap-3 rounded-lg px-0.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9ED5E8] ${active ? 'text-white' : 'text-[#A6ADB4] hover:text-white'}`}
                  >
                    <span className={`relative z-10 h-[7px] w-[7px] shrink-0 rounded-full ring-4 ring-[#080B0E] transition-colors ${active ? 'bg-[#A6DFF1]' : 'bg-[#45535F] group-hover:bg-[#98B1C0]'}`} />
                    <span className={`font-mono text-[10px] tabular-nums ${active ? 'text-[#A6DFF1]' : 'text-[#77838E]'}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : ''}`}>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#9FB3BF]">The Next Frontier</p>
          <p className="mt-1 text-xs leading-5 text-[#CCD2D7]">NASA Space Apps Challenge · 2026</p>
        </div>
      </aside>

      <header className="portfolio-mobile-header sticky top-0 z-40 border-b border-[#DCE3D8] bg-[#F8FAF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[58px] max-w-[1280px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <a href="#top" className="flex shrink-0 items-center gap-2.5 rounded-md text-[#1B4332] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-white"><Compass className="h-[18px] w-[18px]" aria-hidden="true" /></span>
            <span className="text-lg font-extrabold tracking-tight">FieldShift</span>
          </a>
          <div className="flex items-center gap-2">
            <div aria-label="Interface language" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C7D5C5] bg-white px-2.5 text-xs font-bold text-[#465A4E]"><Globe className="h-3.5 w-3.5 text-[#52715E]" aria-hidden="true" /><span>{t.languageName}</span></div>
            <a href="#field-sites" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#1B4332] px-3 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] sm:px-4 sm:text-sm"><Sprout className="h-4 w-4" aria-hidden="true" /><span>Explore fields</span></a>
          </div>
        </div>
        <nav aria-label="Section navigation" className="flex items-center gap-5 overflow-x-auto border-t border-[#E2E8DF] px-4 py-2 text-[11px] font-semibold text-[#465A4E] lg:hidden">
          {navigation.map((item, index) => (
            <a key={item.href} href={item.href} aria-current={activeHref === item.href ? 'location' : undefined} onClick={() => setActiveHref(item.href)} className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${activeHref === item.href ? 'text-[#1B4332]' : 'text-[#65766A]'}`}>
              <span className="font-mono text-[9px] text-[#52715E]">{String(index + 1).padStart(2, '0')}</span>{item.label}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
};
