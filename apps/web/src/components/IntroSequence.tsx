import React, { useEffect, useState } from 'react';
import { ArrowRight, Orbit } from 'lucide-react';

export const IntroSequence: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('fieldshift-intro-seen') === 'yes') {
        setIsOpen(false);
        return;
      }
      window.sessionStorage.setItem('fieldshift-intro-seen', 'yes');
    } catch {
      // The intro remains available when browser storage is disabled.
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setIsOpen(false), reducedMotion ? 600 : 4200);
    return () => window.clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="mission-intro fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#05080A] px-6 text-white" role="dialog" aria-modal="true" aria-label="FieldShift introduction">
      <div aria-hidden="true" className="mission-intro-grain absolute inset-0" />
      <div aria-hidden="true" className="mission-orbit mission-orbit-one" />
      <div aria-hidden="true" className="mission-orbit mission-orbit-two" />
      <div aria-hidden="true" className="mission-horizon absolute inset-x-0 bottom-0 h-[38vh]" />

      <div className="mission-intro-copy relative z-10 mx-auto w-full max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C8D4DB] sm:text-[10px]">
          <Orbit className="h-3.5 w-3.5 text-[#9ED5E8]" aria-hidden="true" />
          NASA Space Apps Challenge · 2026
        </div>
        <p className="mission-kicker mt-9 font-mono text-xs font-bold uppercase tracking-[0.35em] text-[#9ED5E8] sm:text-sm">The Next Frontier</p>
        <h1 className="mission-title mt-4 text-5xl font-semibold tracking-[-0.06em] sm:text-7xl lg:text-8xl">FieldShift</h1>
        <p className="mission-subtitle mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
          Turning Earth observations into more resilient choices for the next growing season.
        </p>
        <button autoFocus type="button" onClick={() => setIsOpen(false)} className="mission-skip mt-9 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 text-xs font-bold text-white transition-colors hover:border-[#9ED5E8] hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9ED5E8]">
          Enter the field workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">A Team Overachiever project · Educational decision support</p>
      </div>
      <div aria-hidden="true" className="mission-coordinate absolute bottom-7 left-6 font-mono text-[9px] uppercase tracking-wider text-white/40 sm:left-10">From orbit · to the field</div>
      <div aria-hidden="true" className="mission-coordinate absolute bottom-7 right-6 font-mono text-[9px] uppercase tracking-wider text-white/40 sm:right-10">15° 40′ N · 120° 53′ E</div>
    </div>
  );
};
