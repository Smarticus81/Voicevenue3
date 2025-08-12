import React from 'react';
import { cn } from '@/lib/utils';

interface NeuroToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

export function NeuroToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}: NeuroToggleProps) {
  const sizeClasses = sizes[size];

  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-white cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-white/60 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses.track,
          checked
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-glow'
            : 'neuro-base'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-neuro transition-transform duration-200 ease-out',
            sizeClasses.thumb,
            checked ? sizeClasses.translate : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

interface NeuroRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function NeuroRadioGroup({
  value,
  onChange,
  children,
  className,
}: NeuroRadioGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            checked: child.props.value === value,
            onChange: () => onChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

interface NeuroRadioProps {
  value: string;
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}

export function NeuroRadio({
  value,
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
}: NeuroRadioProps) {
  return (
    <div
      className={cn(
        'neuro-card p-4 cursor-pointer transition-all duration-200',
        checked && 'border-emerald-400/50 shadow-glow',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onChange?.()}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0 mt-0.5">
          <div
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              checked
                ? 'border-emerald-400 bg-emerald-400/20'
                : 'border-white/30 neuro-base'
            )}
          >
            {checked && (
              <div className="absolute inset-1 rounded-full bg-emerald-400" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-white cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="text-xs text-white/60 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
