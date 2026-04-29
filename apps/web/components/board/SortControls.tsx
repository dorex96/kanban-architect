'use client';

import { cn } from '@/lib/utils';

export type SortBy = 'position' | 'priority' | 'startDate' | 'endDate' | 'duration';
export type SortDir = 'asc' | 'desc';

const SORT_LABELS: Record<SortBy, string> = {
  position: 'Default order',
  priority: 'Priority',
  startDate: 'Start date',
  endDate: 'End date',
  duration: 'Duration',
};

interface SortControlsProps {
  sortBy: SortBy;
  sortDir: SortDir;
  onSortByChange: (value: SortBy) => void;
  onSortDirToggle: () => void;
}

export function SortControls({ sortBy, sortDir, onSortByChange, onSortDirToggle }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-stone-500">Sort by</span>
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortBy)}
        className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
      >
        {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>

      {sortBy !== 'position' && (
        <button
          onClick={onSortDirToggle}
          className={cn(
            'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-colors',
            'border-stone-200 bg-white text-stone-600 hover:border-violet-300 hover:text-violet-600',
          )}
          title={sortDir === 'asc' ? 'Ascending — click to sort descending' : 'Descending — click to sort ascending'}
        >
          {sortDir === 'asc' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Asc
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Desc
            </>
          )}
        </button>
      )}
    </div>
  );
}
