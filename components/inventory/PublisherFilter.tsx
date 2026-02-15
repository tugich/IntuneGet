'use client';

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublisherFilterProps {
  publishers: string[];
  selectedPublisher: string | null;
  onPublisherChange: (publisher: string | null) => void;
}

export function PublisherFilter({
  publishers,
  selectedPublisher,
  onPublisherChange,
}: PublisherFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (publisher: string | null) => {
    onPublisherChange(publisher);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
          selectedPublisher
            ? 'border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan'
            : 'border-overlay/10 bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-overlay/20'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Building2 className="w-4 h-4" />
        <span className="truncate max-w-[160px]">
          {selectedPublisher || 'All Publishers'}
        </span>
        {selectedPublisher ? (
          <X
            className="w-3.5 h-3.5 hover:text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onPublisherChange(null);
            }}
          />
        ) : (
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-64 bg-bg-elevated border border-overlay/10 rounded-xl shadow-soft-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Publisher filter"
        >
          <div className="max-h-60 overflow-y-auto p-1">
            <button
              onClick={() => handleSelect(null)}
              role="option"
              aria-selected={selectedPublisher === null}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                selectedPublisher === null
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              )}
            >
              All Publishers
            </button>
            {publishers.map((publisher) => (
              <button
                key={publisher}
                onClick={() => handleSelect(publisher)}
                role="option"
                aria-selected={selectedPublisher === publisher}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate',
                  selectedPublisher === publisher
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                )}
              >
                {publisher}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
