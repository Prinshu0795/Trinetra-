// client/src/components/common/Modal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3.5 sm:p-4 bg-ink/50 backdrop-blur-sm animate-fade-in overscroll-contain"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidthClasses} bg-white border border-hairline rounded-2xl shadow-elevated overflow-hidden max-h-[88vh] flex flex-col my-auto transition-transform overscroll-contain`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-hairline shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-normal text-ink">{title}</h3>
              {description && (
                <p className="text-xs text-ink-muted mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 text-ink">{children}</div>
      </div>
    </div>
  );
};
