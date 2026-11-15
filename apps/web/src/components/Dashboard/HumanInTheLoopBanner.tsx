import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const HumanInTheLoopBanner: React.FC = () => (
  <aside
    role="note"
    aria-label="Human-in-the-loop advisory"
    className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs leading-relaxed text-emerald-100"
  >
    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
    <p>
      FieldShift is advisory decision support. It supports, and never replaces, farmer judgment and certified local agricultural expertise.
    </p>
  </aside>
);
