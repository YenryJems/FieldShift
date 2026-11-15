import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const HumanInTheLoopBanner: React.FC = () => (
  <aside
    role="note"
    aria-label="Human-in-the-loop advisory"
    className="flex items-start gap-3 rounded-xl border border-[#C7D5C5] bg-[#F4F8F2] p-3.5 text-xs leading-relaxed text-[#263B2E]"
  >
    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden="true" />
    <p>
      FieldShift is advisory decision support. It supports, and never replaces, farmer judgment and certified local agricultural expertise.
    </p>
  </aside>
);
