'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

function visiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(1, currentPage - 2), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export default function AdminPagination({
  page,
  pageSize,
  totalItems,
  itemLabel = 'items',
  onPageChange,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  if (totalItems <= pageSize) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      data-admin-pagination
    >
      <p className="text-center text-sm text-gray-500 sm:text-left">
        Showing <span className="font-semibold text-gray-900">{firstItem}&ndash;{lastItem}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center justify-center gap-1" aria-label={`Page ${currentPage} of ${totalPages}`}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {visiblePages(currentPage, totalPages).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
            aria-label={`Page ${pageNumber}`}
            className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold transition ${
              pageNumber === currentPage
                ? 'bg-purple-600 text-white shadow-sm'
                : 'border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
