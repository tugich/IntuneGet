'use client';

export function InventoryListHeader() {
  return (
    <div className="bg-bg-surface/50 rounded-lg border border-overlay/5 px-4 py-2.5 flex items-center gap-4">
      {/* Icon spacer */}
      <div className="w-9 flex-shrink-0" />

      {/* App name */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          App
        </span>
      </div>

      {/* Version */}
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider flex-shrink-0">
        Version
      </span>

      {/* Size */}
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider w-16 text-right flex-shrink-0 hidden sm:block">
        Size
      </span>

      {/* Modified */}
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider w-24 text-right flex-shrink-0 hidden md:block">
        Modified
      </span>

      {/* Chevron spacer */}
      <div className="w-4 flex-shrink-0" />
    </div>
  );
}
