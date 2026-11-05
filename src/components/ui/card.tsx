import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({
  hoverEffect = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200/80 dark:border-stone-800 font-bengali shadow-sm ${
        hoverEffect
          ? 'hover:shadow-md hover:border-shubban-gold/40 transition-all duration-300'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-5 border-b border-stone-100 dark:border-stone-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

