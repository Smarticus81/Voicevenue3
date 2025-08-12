import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface NeuroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variants = {
  default: 'neuro-button text-white hover:text-white',
  primary: 'neuro-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400/30 hover:from-emerald-400 hover:to-emerald-500 shadow-glow',
  secondary: 'neuro-button bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-400/30 hover:from-cyan-400 hover:to-cyan-500 shadow-glow-cyan',
  ghost: 'glass-panel text-white/80 hover:text-white hover:bg-white/10 border-white/20',
  danger: 'neuro-button bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/30 hover:from-red-400 hover:to-red-500',
};

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-neuro-sm',
  md: 'px-6 py-3 text-base rounded-neuro',
  lg: 'px-8 py-4 text-lg rounded-neuro',
  xl: 'px-10 py-5 text-xl rounded-neuro-lg',
};

export function NeuroButton({
  variant = 'default',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  children,
  ...props
}: NeuroButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'hover:scale-[1.02] active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
