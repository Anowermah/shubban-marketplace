import React from 'react';
import { BADGE_STYLES, BadgeVariant } from '@/lib/design-system';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bengali font-semibold border ${BADGE_STYLES[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

