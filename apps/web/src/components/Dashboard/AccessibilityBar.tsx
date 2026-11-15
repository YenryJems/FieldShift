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
    <div className="space-y-3 rounded-2xl border border-[#D4DDD0] bg-[#F7FAF5] p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#1B4332]">
            <MapPin className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden="true" />
            <span>{locationName}</span>
          </span>
          <span className="text-xs text-[#536458]">
            Select any month below to update signals, map, and suitability
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={plainEnglish}
            onClick={() => onPlainEnglishChange(!plainEnglish)}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#17271D] transition-colors hover:bg-[#EEF4EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            <span>Farmer Plain-English</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                plainEnglish
                  ? 'bg-[#E3F2E8] text-[#1B4332]'
                  : 'bg-[#E6ECE4] text-[#536458]'
              }`}
            >
              {plainEnglish ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            disabled={!speechSupported}
            onClick={handleToggleSpeech}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#17271D] transition-colors hover:bg-[#EEF4EC] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            {speaking ? (
              <VolumeX className="h-3.5 w-3.5 text-[#B45309]" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
            )}
            <span>{speaking ? 'Stop' : 'Read Aloud'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySms}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#C7D5C5] bg-white px-3 text-xs font-bold text-[#1B4332] transition-colors hover:bg-[#EEF4EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
          >
            <Copy className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden="true" />
            <span>Copy SMS Field Brief</span>
          </button>

          {copyStatus === 'copied' && (
            <span
              role="status"
              className="inline-flex min-h-9 items-center rounded-full bg-[#E3F2E8] px-3 text-xs font-bold text-[#1B4332]"
            >
              Copied!
            </span>
          )}
          {copyStatus === 'failed' && (
            <span
              role="status"
              className="inline-flex min-h-9 items-center rounded-full bg-[#FDE2E4] px-3 text-xs font-bold text-[#991B1B]"
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
          className="hidden grid-cols-12 gap-1 rounded-xl border border-[#D4DDD0] bg-white p-1 sm:grid"
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
                className={`min-h-8 rounded-lg px-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332] ${
                  active
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-[#536458] hover:bg-[#F1F5EF] hover:text-[#1B4332]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <label htmlFor="dash-month-range" className="text-xs font-bold text-[#263B2E]">
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
            className="min-h-9 flex-1 accent-[#1B4332]"
          />
        </div>
      </div>
    </div>
  );
};
