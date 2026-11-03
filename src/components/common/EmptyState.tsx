/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
      <div className="w-14 h-14 rounded-2xl bg-[#006D77]/10 text-[#006D77] flex items-center justify-center mb-4">
        <Icon size={28} />
      </div>
      <h4 className="text-base font-semibold text-[#17252F] mb-1">{title}</h4>
      <p className="text-sm text-[#718096] max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#006D77] hover:bg-[#00555D] rounded-lg transition-colors shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
