'use client';

import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5 font-bengali">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full text-sm rounded-xl bg-stone-50 dark:bg-stone-800/80 border text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
              leftIcon ? 'pl-10 pr-4' : 'px-4'
            } py-2.5 ${
              error
                ? 'border-red-500 focus:ring-red-400/50'
                : 'border-stone-200 dark:border-stone-700 focus:ring-shubban-gold/50 focus:border-shubban-gold'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-stone-500 dark:text-stone-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

