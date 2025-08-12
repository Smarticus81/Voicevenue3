import React from 'react';
import { cn } from '@/lib/utils';

interface NeuroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'inset';
  hover?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

const variants = {
  default: 'neuro-card',
  glass: 'glass-panel',
  elevated: 'neuro-card shadow-neuro-lg',
  inset: 'bg-gradient-neuro shadow-neuro-inset border border-white/5',
};

export function NeuroCard({
  variant = 'default',
  hover = false,
  interactive = false,
  className,
  children,
  ...props
}: NeuroCardProps) {
  return (
    <div
      className={cn(
        'p-6',
        variants[variant],
        hover && 'hover:shadow-neuro-glow hover:-translate-y-1',
        interactive && 'interactive-card cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function NeuroCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function NeuroCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function NeuroCardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-white/70 text-sm', className)} {...props}>
      {children}
    </p>
  );
}

export function NeuroCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function NeuroCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-4', className)} {...props}>
      {children}
    </div>
  );
}
