import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface SectionHeaderProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function SectionHeader({
  badge,
  badgeIcon,
  title,
  subtitle,
  actionHref,
  actionLabel = 'সব দেখুন',
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-stone-200/80 dark:border-stone-800 pb-4 font-bengali ${className}`}
    >
      <div>
        {badge && (
          <div className="flex items-center gap-1.5 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
            {badgeIcon}
            <span>{badge}</span>
          </div>
        )}
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {actionHref && (
        <Link
          href={actionHref}
          className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-end"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

