import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Animation utilities
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Theme utilities
export const getThemeClass = (variant: string, theme: 'light' | 'dark' = 'dark') => {
  const variants = {
    primary: theme === 'dark' 
      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
      : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white',
    secondary: theme === 'dark'
      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
      : 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white',
    ghost: theme === 'dark'
      ? 'bg-white/10 text-white hover:bg-white/20'
      : 'bg-black/5 text-black hover:bg-black/10',
  };
  
  return variants[variant as keyof typeof variants] || variants.primary;
};

// Status utilities
export const getStatusColor = (status: string) => {
  const colors = {
    connected: 'text-emerald-400',
    disconnected: 'text-red-400',
    pending: 'text-yellow-400',
    error: 'text-red-400',
    idle: 'text-white/60',
    active: 'text-emerald-400',
  };
  
  return colors[status as keyof typeof colors] || colors.idle;
};

// Format utilities
export const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Accessibility utilities
export const getAriaLabel = (action: string, context?: string) => {
  return context ? `${action} ${context}` : action;
};

export const generateId = (prefix: string = 'id') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};