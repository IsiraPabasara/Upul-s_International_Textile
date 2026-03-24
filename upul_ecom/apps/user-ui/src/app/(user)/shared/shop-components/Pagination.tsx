'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

function PaginationContent({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.push(`/shop?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) pages.push('...');

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');

      // Always show last page
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-4 mt-16 mb-12">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-gray-400 hover:text-black disabled:opacity-20 transition-all"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex gap-1 items-center">
        {getPageNumbers().map((page, i) => (
          page === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-300">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`w-10 h-10 text-xs font-bold transition-all ${
                page === currentPage 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-black'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-gray-400 hover:text-black disabled:opacity-20 transition-all"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationContent {...props} />
    </Suspense>
  );
}