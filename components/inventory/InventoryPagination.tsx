'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InventoryPaginationProps {
  page: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function InventoryPagination({
  page,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  canGoNext,
  canGoPrev,
  onNextPage,
  onPrevPage,
}: InventoryPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="glass-light rounded-xl p-3 border border-overlay/5 flex items-center justify-between">
      <span className="text-sm text-text-muted">
        Showing {startIndex + 1}-{endIndex} of {totalItems}
      </span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!canGoPrev}
          className="border-overlay/10 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-text-muted">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
          className="border-overlay/10 text-text-secondary hover:text-text-primary"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
