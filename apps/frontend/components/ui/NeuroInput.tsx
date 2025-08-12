import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface NeuroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'search' | 'minimal';
}

interface NeuroTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'minimal';
}

const inputVariants = {
  default: 'neuro-input',
  search: 'neuro-input pl-10',
  minimal: 'bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:bg-white/10 focus:border-emerald-400/50 transition-all duration-200',
};

export function NeuroInput({
  label,
  error,
  icon,
  variant = 'default',
  className,
  type = 'text',
  ...props
}: NeuroInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            inputVariants[variant],
            error && 'border-red-400/50 focus:border-red-400/50',
            isPassword && 'pr-10',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}

export function NeuroTextarea({
  label,
  error,
  variant = 'default',
  className,
  ...props
}: NeuroTextareaProps) {
  const textareaVariants = {
    default: 'neuro-input min-h-[100px] resize-y',
    minimal: 'bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:bg-white/10 focus:border-emerald-400/50 transition-all duration-200 min-h-[100px] resize-y',
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          textareaVariants[variant],
          error && 'border-red-400/50 focus:border-red-400/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}

export function NeuroSelect({
  label,
  error,
  children,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <select
        className={cn(
          'neuro-input appearance-none cursor-pointer',
          error && 'border-red-400/50 focus:border-red-400/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
