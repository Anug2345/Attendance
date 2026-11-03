/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  className = '',
}) => {
  const styles = {
    success: 'bg-[#20B486]/10 text-[#20B486] border-[#20B486]/20',
    warning: 'bg-[#F4B942]/10 text-[#B87B00] border-[#F4B942]/30',
    danger: 'bg-[#E45B64]/10 text-[#E45B64] border-[#E45B64]/20',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-[#006D77]/10 text-[#006D77] border-[#006D77]/25',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border transition-colors ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const AttendanceStatusBadge: React.FC<{ status: 'present' | 'absent' | 'late' | 'excused' }> = ({
  status,
}) => {
  switch (status) {
    case 'present':
      return <Badge variant="success">Present</Badge>;
    case 'late':
      return <Badge variant="warning">Late</Badge>;
    case 'absent':
      return <Badge variant="danger">Absent</Badge>;
    case 'excused':
      return <Badge variant="teal">Excused</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
