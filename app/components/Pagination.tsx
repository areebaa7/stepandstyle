'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, totalItems, itemLabel = 'items', onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  if (totalItems <= pageSize) return null;

  const start = Math.min(Math.max(1, currentPage - 2), Math.max(1, totalPages - 4));
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav aria-label={`${itemLabel} pagination`} className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-5">
      <p className="text-sm font-medium text-gray-500">
        Showing <span className="font-bold text-gray-900">{firstItem}&ndash;{lastItem}</span> of <span className="font-bold text-gray-900">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1" aria-label={`Page ${currentPage} of ${totalPages}`}>
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {pageNumbers.map((pageNumber) => (
          <button key={pageNumber} type="button" onClick={() => onPageChange(pageNumber)} aria-current={pageNumber === currentPage ? 'page' : undefined} aria-label={`Page ${pageNumber}`} className={`h-10 min-w-10 rounded-xl px-2 text-sm font-bold transition ${pageNumber === currentPage ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'}`}>
            {pageNumber}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page" className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
