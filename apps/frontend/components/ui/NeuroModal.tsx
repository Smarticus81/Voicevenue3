import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { NeuroButton } from './NeuroButton';

interface NeuroModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  blur?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function NeuroModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  blur = true,
}: NeuroModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-300',
          blur && 'backdrop-blur-sm'
        )}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative w-full scale-in',
          'neuro-card shadow-neuro-xl border border-white/20',
          'max-h-[90vh] overflow-y-auto',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-white/10">
            <div className="space-y-1">
              {title && (
                <h2 className="text-xl font-semibold text-white">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-white/70 text-sm">
                  {description}
                </p>
              )}
            </div>
            <NeuroButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4 p-2"
              icon={<X size={16} />}
            />
          </div>
        )}
        
        {/* Content */}
        <div className={cn('p-6', (title || description) && 'pt-0')}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function NeuroModalFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'flex items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
