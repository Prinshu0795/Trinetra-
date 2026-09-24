// client/src/components/common/Badge.tsx
import React from 'react';
import { SeverityLevel, ReportStatus, SafeZoneStatus, ResourceStatus } from '../../types';

interface BadgeProps {
  label?: string;
  variant?: 'severity' | 'status' | 'category' | 'outline' | 'risk';
  severity?: SeverityLevel | string;
  status?: ReportStatus | SafeZoneStatus | ResourceStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'severity',
  severity,
  status,
  className = '',
}) => {
  let badgeStyles = 'bg-canvas-subtle text-ink-muted border-hairline';
  let dotColor = 'bg-ink-subtle';

  if (variant === 'severity' || variant === 'risk') {
    const val = (severity || label || '').toUpperCase();
    if (val === 'CRITICAL' || val === 'SEVERE') {
      badgeStyles = 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F5C2C2]';
      dotColor = 'bg-[#C64545]';
    } else if (val === 'HIGH') {
      badgeStyles = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      dotColor = 'bg-[#D97706]';
    } else if (val === 'MEDIUM' || val === 'MODERATE') {
      badgeStyles = 'bg-[#FEF3C7] text-[#78350F] border-[#FCD34D]';
      dotColor = 'bg-[#B45309]';
    } else if (val === 'LOW' || val === 'SAFE') {
      badgeStyles = 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
      dotColor = 'bg-[#22C55E]';
    } else if (val === 'INFO') {
      badgeStyles = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
      dotColor = 'bg-[#3B82F6]';
    }
  } else if (variant === 'status') {
    const val = (status || label || '').toUpperCase();
    if (val === 'ACTIVE' || val === 'OPEN' || val === 'AVAILABLE' || val === 'VERIFIED') {
      badgeStyles = 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
      dotColor = 'bg-[#22C55E]';
    } else if (val === 'PENDING_VERIFICATION' || val === 'NEAR_CAPACITY' || val === 'INVESTIGATING') {
      badgeStyles = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      dotColor = 'bg-[#D97706]';
    } else if (val === 'FULL' || val === 'DEPLETED' || val === 'REJECTED') {
      badgeStyles = 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F5C2C2]';
      dotColor = 'bg-[#C64545]';
    } else if (val === 'DISPATCHED' || val === 'ENGAGED' || val === 'INFO') {
      badgeStyles = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
      dotColor = 'bg-[#3B82F6]';
    } else if (val === 'RESOLVED' || val === 'CONTAINED' || val === 'CLOSED') {
      badgeStyles = 'bg-canvas-subtle text-ink-muted border-hairline';
      dotColor = 'bg-ink-subtle';
    }
  }

  const displayText = label || severity || status || '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {displayText.replace(/_/g, ' ')}
    </span>
  );
};
