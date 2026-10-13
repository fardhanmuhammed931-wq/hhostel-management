import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  limit?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  limit,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-sm text-slate-400">
      <div>
        {totalRecords !== undefined && limit !== undefined && (
          <span>
            Showing <strong className="text-white font-semibold">{(currentPage - 1) * limit + 1}</strong> to{' '}
            <strong className="text-white font-semibold">
              {Math.min(currentPage * limit, totalRecords)}
            </strong>{' '}
            of <strong className="text-white font-semibold">{totalRecords}</strong> entries
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            const prev = arr[idx - 1];
            return (
              <React.Fragment key={page}>
                {prev && page - prev > 1 && <span className="px-2 text-slate-600">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-xl font-medium text-sm transition-all duration-200 border ${
                    currentPage === page
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/25 font-bold'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/30'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
