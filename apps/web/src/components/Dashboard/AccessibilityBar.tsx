import React, { useEffect, useRef, useState } from 'react';
import { Copy, MapPin, Volume2, VolumeX } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard';
import { MONTH_SHORT } from '../../utils/dashboard';
import {
  isSpeechSynthesisSupported,
  speakFieldAdvisory,
  stopFieldAdvisorySpeech,
} from '../../utils/speech';

export interface AccessibilityBarProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  plainEnglish: boolean;
  onPlainEnglishChange: (plainEnglish: boolean) => void;
  readAloudText: string;
  smsText: string;
  locationName: string;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  selectedMonth,
  onMonthChange,
  plainEnglish,
  onPlainEnglishChange,
  readAloudText,
  smsText,
  locationName,
}) => {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported());
    return () => {
      stopFieldAdvisorySpeech();
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (speaking) {
      stopFieldAdvisorySpeech();
      setSpeaking(false);
      return;
    }
    const started = speakFieldAdvisory(readAloudText, 'en', () => setSpeaking(false));
    setSpeaking(started);
  };

  const handleCopySms = async () => {
    if (copyTimerRef.current !== null) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    const ok = await copyTextToClipboard(smsText);
    setCopyStatus(ok ? 'copied' : 'failed');
    copyTimerRef.current = setTimeout(() => {
      setCopyStatus('idle');
      copyTimerRef.current = null;
    }, 2500);
  };

  const activeMonthLabel = MONTH_SHORT[selectedMonth - 1] ?? MONTH_SHORT[0];

  return (
    <div className="space-y-3 rounded-2xl border border-sky-400/20 bg-[#0B1426]/85 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] ring-1 ring-sky-400/25">
            <MapPin className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span>{locationName}</span>
          </span>
          <span className="text-xs text-[#94A3B8]">
            Change location on the map or in the Farm step
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={plainEnglish}
            onClick={() => onPlainEnglishChange(!plainEnglish)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/25 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:bg-[#132240] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <span>Farmer Plain-English</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                plainEnglish
                  ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                  : 'bg-[#08101F] text-[#94A3B8] ring-1 ring-sky-400/20'
              }`}
            >
              {plainEnglish ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            disabled={!speechSupported}
            onClick={handleToggleSpeech}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-400/25 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:bg-[#132240] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            {speaking ? (
              <VolumeX className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
            )}
            <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySms}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-400/25 bg-[#0D182E] px-3 text-xs font-semibold text-[#F0F9FF] transition-colors hover:bg-[#132240] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <Copy className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            <span>Copy SMS Field Brief</span>
          </button>

          {copyStatus === 'copied' && (
            <span
              role="status"
              className="inline-flex min-h-10 items-center rounded-full bg-emerald-400/15 px-3 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
            >
              Copied!
            </span>
          )}
          {copyStatus === 'failed' && (
            <span
              role="status"
              className="inline-flex min-h-10 items-center rounded-full bg-rose-400/15 px-3 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30"
            >
              Copy failed
            </span>
          )}
        </div>
      </div>

      <div>
        <div
          role="group"
          aria-label="Select month"
          className="hidden gap-1.5 overflow-x-auto pb-1 sm:flex"
        >
          {MONTH_SHORT.map((label, index) => {
            const monthNum = index + 1;
            const active = selectedMonth === monthNum;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => onMonthChange(monthNum)}
                className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                  active
                    ? 'bg-sky-400/20 text-[#7DD3FC] ring-1 ring-sky-400/40'
                    : 'bg-[#0D182E] text-[#CBD5E1] hover:bg-[#132240] hover:text-[#F0F9FF]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <label htmlFor="dash-month-range" className="text-xs font-semibold text-[#CBD5E1]">
            Month: {activeMonthLabel}
          </label>
          <input
            id="dash-month-range"
            type="range"
            min={1}
            max={12}
            step={1}
            value={selectedMonth}
            aria-label="Select month"
            aria-valuetext={activeMonthLabel}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="fieldshift-slider min-h-10 flex-1"
          />
        </div>
      </div>
    </div>
  );
};
