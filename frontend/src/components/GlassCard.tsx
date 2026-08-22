import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  interactive = false,
  glow = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-card rounded-2xl p-5 md:p-6 transition-all duration-300 relative overflow-hidden',
          interactive && 'glass-card-interactive cursor-pointer',
          glow && 'glow-rim shadow-glass-glow',
          className
        )
      )}
      {...props}
    >
      {/* Glossy top sheen highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/15 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
