import React, { ButtonHTMLAttributes } from 'react';

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const VARIANT_STYLES: Record<string, string> = {
  accent:
    'bg-gradient-to-r from-[#539bf5] to-[#2f81ff] text-white border-transparent shadow-none hover:shadow-[0_20px_45px_rgba(83,155,245,0.4)] hover:opacity-90',
  ghost:
    'border border-white/30 text-white bg-transparent hover:border-white/50 hover:text-white/90 hover:shadow-[0_10px_25px_rgba(88,166,255,0.25)]',
  ghostRed:
    'border border-red-500/70 text-red-400 hover:bg-red-500/10 hover:shadow-[0_10px_25px_rgba(255,89,112,0.25)]',
};

const SIZE_STYLES: Record<string, string> = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'ghost' | 'ghostRed';
  size?: 'md' | 'sm';
  fullWidth?: boolean;
}

export default function Button({
  variant = 'accent',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#58a6ff]',
        VARIANT_STYLES[variant] || VARIANT_STYLES.accent,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
