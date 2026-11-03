/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  currentRole: UserRole;
  onNavigateToDefault: () => void;
  onOpenPortalSwitcher?: () => void;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  currentRole,
  onNavigateToDefault,
  onOpenPortalSwitcher,
  children,
}) => {
  const { currentUser, studentProfile, lecturerProfile } = useAuth();

  const isAllowed = allowedRoles.includes(currentRole);

  if (isAllowed) {
    return <>{children}</>;
  }

  // Unauthorized access attempt view
  const isStudent = currentRole === 'student';

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-3xl p-8 border-2 border-rose-200 shadow-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
          <ShieldAlert size={34} />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
            Institutional Access Control Restriction
          </span>
          <h2 className="text-2xl font-extrabold text-[#142B3B] mt-2.5 tracking-tight">
            Unauthorized Portal Access
          </h2>
          <p className="text-xs text-[#718096] mt-1.5 max-w-md mx-auto leading-relaxed">
            {isStudent
              ? `You are currently authenticated as an enrolled student (Matric: ${
                  studentProfile?.matricNumber || '22040401001'
                }). Under LASUSTECH regulations, students are strictly prohibited from accessing faculty administration, course management, or attendance grading ledgers.`
              : `You are authenticated as academic faculty (${
                  lecturerProfile?.staffId || 'Academic Staff'
                }). This student check-in feature is reserved exclusively for students marking lecture attendance.`}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-600">
            <span>Current Authenticated User:</span>
            <span className="font-bold text-slate-900">{currentUser?.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Active Role Boundary:</span>
            <span className="font-semibold uppercase tracking-wider text-[#006D77]">
              {currentRole} Portal
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Required Authorization:</span>
            <span className="font-mono text-rose-600 font-bold">
              {allowedRoles.join(' / ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateToDefault}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Return to {currentRole === 'student' ? 'Student' : 'Lecturer'} Dashboard</span>
          </button>

          {onOpenPortalSwitcher && (
            <button
              type="button"
              onClick={onOpenPortalSwitcher}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center gap-1.5"
            >
              <UserCheck size={14} />
              <span>Switch Institutional Portal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
