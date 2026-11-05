'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toBengaliNumber, cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageUrlTemplate?: string;
  createPageUrl?: ((page: number) => string) | string;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
  showSummary?: boolean;
  showPageSizeSelector?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  pageUrlTemplate,
  createPageUrl,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'আইটেম',
  className,
  showSummary = true,
  showPageSizeSelector = true,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // If there are no items and only 1 page, don't show controls unless totalItems summary is requested
  if (safeTotalPages <= 1 && (!totalItems || totalItems === 0) && !onPageSizeChange) {
    return null;
  }

  const effectiveItemsPerPage = itemsPerPage || 10;
  const startIndex = totalItems !== undefined && totalItems > 0 ? (safeCurrentPage - 1) * effectiveItemsPerPage : 0;
  const endIndex = totalItems !== undefined ? Math.min(totalItems, safeCurrentPage * effectiveItemsPerPage) : 0;

  // Resolve URL for link-based navigation (accepts template string or client callback)
  const getPageUrl = (pageNum: number): string => {
    const template =
      pageUrlTemplate || (typeof createPageUrl === 'string' ? createPageUrl : undefined);
    if (template) {
      if (template.includes('[page]')) {
        return template.replace(/\[page\]/g, pageNum.toString());
      }
      if (template.includes('{page}')) {
        return template.replace(/\{page\}/g, pageNum.toString());
      }
      const separator = template.includes('?') ? '&' : '?';
      return `${template}${separator}page=${pageNum}`;
    }
    if (typeof createPageUrl === 'function') {
      return createPageUrl(pageNum);
    }
    return `?page=${pageNum}`;
  };

  const isLinkMode = Boolean(pageUrlTemplate || createPageUrl);

  // Render button or link helper
  const renderPageItem = (
    pageNum: number,
    label: React.ReactNode,
    isActive: boolean,
    isDisabled: boolean,
    title?: string,
    customClass?: string
  ) => {
    const baseClass = cn(
      'flex items-center justify-center transition-all duration-150 select-none font-semibold text-xs rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
      isActive
        ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-sm font-bold scale-105'
        : isDisabled
        ? 'opacity-30 cursor-not-allowed border border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 bg-stone-50 dark:bg-stone-900/50'
        : 'border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-800/90 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700/60 shadow-2xs',
      customClass
    );

    if (isDisabled) {
      return (
        <span className={baseClass} title={title} aria-disabled="true">
          {label}
        </span>
      );
    }

    if (isLinkMode) {
      return (
        <Link
          href={getPageUrl(pageNum)}
          className={baseClass}
          title={title}
          aria-current={isActive ? 'page' : undefined}
        >
          {label}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onPageChange && onPageChange(pageNum)}
        className={baseClass}
        title={title}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </button>
    );
  };

  // Compute visible numbered page pills with smart ellipsis
  const getVisiblePages = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    pages.push(1);

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

    if (start > 2) {
      pages.push('ellipsis-start');
    }

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }

    if (end < safeTotalPages - 1) {
      pages.push('ellipsis-end');
    }

    pages.push(safeTotalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-xs font-bengali transition-colors',
        className
      )}
    >
      {/* Left Section: Item Count Summary & Optional Page Size Dropdown */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-4 text-stone-600 dark:text-stone-400 text-center sm:text-left">
        {showSummary && totalItems !== undefined && (
          <span className="leading-relaxed">
            মোট{' '}
            <strong className="text-stone-900 dark:text-stone-100 font-bold font-sans">
              {toBengaliNumber(totalItems)}
            </strong>
            টি {itemName}-এর মধ্যে{' '}
            <strong className="text-stone-900 dark:text-stone-100 font-bold font-sans">
              {toBengaliNumber(totalItems === 0 ? 0 : startIndex + 1)} - {toBengaliNumber(endIndex)}
            </strong>{' '}
            দেখাচ্ছে
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-stone-400">প্রতি পৃষ্ঠায়:</span>
            <select
              value={effectiveItemsPerPage}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
              aria-label="প্রতি পৃষ্ঠায় আইটেম সংখ্যা"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {toBengaliNumber(opt)}টি
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Section: Pagination Controls */}
      {safeTotalPages > 1 && (
        <nav
          className="flex items-center gap-1 flex-shrink-0 select-none"
          aria-label="পৃষ্ঠা নেভিগেশন"
        >
          {/* First Page Button */}
          {renderPageItem(
            1,
            <ChevronsLeft className="w-4 h-4" />,
            false,
            safeCurrentPage === 1,
            'প্রথম পৃষ্ঠা',
            'w-8 h-8'
          )}

          {/* Prev Page Button */}
          {renderPageItem(
            safeCurrentPage - 1,
            <ChevronLeft className="w-4 h-4" />,
            false,
            safeCurrentPage === 1,
            'পূর্ববর্তী পৃষ্ঠা',
            'w-8 h-8'
          )}

          {/* Numbered Page Buttons with Smart Ellipsis */}
          <div className="flex items-center gap-1 px-1">
            {visiblePages.map((pageItem, idx) => {
              if (pageItem === 'ellipsis-start' || pageItem === 'ellipsis-end') {
                return (
                  <span
                    key={`${pageItem}-${idx}`}
                    className="w-6 h-8 flex items-center justify-center text-stone-400 dark:text-stone-500 font-mono tracking-widest text-xs select-none"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = pageItem === safeCurrentPage;
              return (
                <React.Fragment key={pageItem}>
                  {renderPageItem(
                    pageItem,
                    toBengaliNumber(pageItem),
                    isCurrent,
                    false,
                    `পৃষ্ঠা ${toBengaliNumber(pageItem)}`,
                    'w-8 h-8 font-sans'
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Next Page Button */}
          {renderPageItem(
            safeCurrentPage + 1,
            <ChevronRight className="w-4 h-4" />,
            false,
            safeCurrentPage === safeTotalPages,
            'পরবর্তী পৃষ্ঠা',
            'w-8 h-8'
          )}

          {/* Last Page Button */}
          {renderPageItem(
            safeTotalPages,
            <ChevronsRight className="w-4 h-4" />,
            false,
            safeCurrentPage === safeTotalPages,
            'শেষ পৃষ্ঠা',
            'w-8 h-8'
          )}
        </nav>
      )}
    </div>
  );
}

