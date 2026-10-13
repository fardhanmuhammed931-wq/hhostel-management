import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse rounded-lg bg-slate-800/60 border border-white/5 ${className}`}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4 animate-pulse">
    <div className="h-4 w-28 bg-slate-800 rounded" />
    <div className="h-8 w-44 bg-slate-800 rounded" />
    <div className="h-3 w-36 bg-slate-800 rounded" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3 w-full">
    <div className="h-10 bg-slate-800/40 rounded-xl" />
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="flex gap-4 py-3 border-b border-white/5">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <div key={cIdx} className="h-5 bg-slate-800/60 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);
