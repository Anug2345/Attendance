/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlightColor?: 'teal' | 'navy' | 'green' | 'amber' | 'crimson';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  highlightColor = 'teal',
}) => {
  const borderAccents = {
    teal: 'border-l-4 border-l-[#006D77]',
    navy: 'border-l-4 border-l-[#142B3B]',
    green: 'border-l-4 border-l-[#20B486]',
    amber: 'border-l-4 border-l-[#F4B942]',
    crimson: 'border-l-4 border-l-[#E45B64]',
  };

  const iconBgs = {
    teal: 'bg-[#006D77]/10 text-[#006D77]',
    navy: 'bg-[#142B3B]/10 text-[#142B3B]',
    green: 'bg-[#20B486]/10 text-[#20B486]',
    amber: 'bg-[#F4B942]/15 text-[#B87B00]',
    crimson: 'bg-[#E45B64]/10 text-[#E45B64]',
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-[#E8EDF0] shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${borderAccents[highlightColor]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#718096] uppercase">{label}</p>
          <h3 className="text-2xl font-bold text-[#17252F] mt-1 tracking-tight">{value}</h3>
          {subValue && <p className="text-xs text-[#718096] mt-0.5">{subValue}</p>}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg flex items-center justify-center ${iconBgs[highlightColor]}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#E8EDF0] flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-[#20B486]' : 'text-[#E45B64]'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && <span className="text-[#718096]">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
