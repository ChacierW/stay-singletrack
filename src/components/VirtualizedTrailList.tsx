'use client';

import { TrailPrediction } from '@/lib/types';
import { TrailCard } from './TrailCard';
import { Filter } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface VirtualizedTrailListProps {
  trails: TrailPrediction[];
}

export function VirtualizedTrailList({ trails }: VirtualizedTrailListProps) {
  if (trails.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 bg-[var(--background)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
              <Filter className="w-8 h-8 text-[var(--foreground-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
              No trails match your filters
            </h3>
            <p className="text-[var(--foreground-muted)]">
              Try adjusting your filter settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={trails.length}
      overscan={200}
      components={{
        Header: () => (
          <div className="max-w-3xl mx-auto px-4 pt-4 pb-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {trails.length} Trails
              </h2>
              <span className="text-sm text-[var(--foreground-muted)]">
                Sorted by condition
              </span>
            </div>
          </div>
        ),
        Footer: () => <div className="h-4" />,
      }}
      itemContent={(index) => (
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <TrailCard trail={trails[index]} />
        </div>
      )}
    />
  );
}
