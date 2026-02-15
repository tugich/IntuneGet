'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyableCommandProps {
  command: string;
  label: string;
}

export function CopyableCommand({ command, label }: CopyableCommandProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in insecure contexts or if permission denied
    }
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
        <Terminal className="w-3.5 h-3.5" />
        {label}
      </h4>
      <div className="group relative bg-bg-deepest rounded-lg border border-overlay/5">
        <div className="p-3 pr-10 overflow-x-auto">
          <code className="block text-sm font-mono text-text-primary">
            {command}
          </code>
        </div>
        <button
          onClick={copyToClipboard}
          className={cn(
            'absolute top-2.5 right-2.5 p-1.5 rounded-md transition-all duration-200',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            copied
              ? 'text-status-success bg-status-success/10'
              : 'text-text-muted hover:text-text-primary hover:bg-overlay/10'
          )}
          aria-label={copied ? 'Copied!' : `Copy ${label}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
