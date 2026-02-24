'use client';

import { Loader2 } from 'lucide-react';

interface VerificationSceneFallbackProps {
  statusText?: string;
}

export function VerificationSceneFallback({ statusText = 'Verifying permissions...' }: VerificationSceneFallbackProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-accent-cyan/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-accent-cyan to-accent-violet rounded-2xl flex items-center justify-center shadow-glow-cyan">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
      </div>
      <p aria-live="polite" className="text-text-muted text-sm font-medium">
        {statusText}
      </p>
    </div>
  );
}
