import React from 'react';
import { GlassCard } from './GlassCard';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'brand' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

const colorMap = {
  brand: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
  indigo: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
  emerald: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
  amber: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
  rose: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
  purple: {
    iconBg: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700',
    accentDot: 'bg-zinc-900 dark:bg-white',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'brand',
}) => {
  const colors = colorMap[accentColor];

  return (
    <GlassCard interactive className="relative group">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-2xl ${colors.iconBg} shadow-inner transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs">
          <span
            className={`font-semibold inline-flex items-center space-x-1 ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </span>
          <span className="text-slate-400 dark:text-slate-500">vs last period</span>
        </div>
      )}
    </GlassCard>
  );
};
