// client/src/hooks/useBodyScrollLock.ts
import { useEffect } from 'react';

let lockCount = 0;
let originalOverflowBody = '';
let originalOverflowHtml = '';
let originalPaddingRight = '';

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalOverflowBody = document.body.style.overflow;
      originalOverflowHtml = document.documentElement.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      // Compensate for scrollbar disappearance to prevent horizontal layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflowBody || '';
        document.documentElement.style.overflow = originalOverflowHtml || '';
        document.body.style.paddingRight = originalPaddingRight || '';
      }
    };
  }, [isLocked]);
}
