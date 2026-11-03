/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Sliders,
  Check,
  X,
  Lock,
  ArrowRight,
  LogOut,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface PortalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchedRole?: (role: UserRole) => void;
}

export const PortalSwitcherModal: React.FC<PortalSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSwitchedRole,
}) => {
  const { currentUser, currentRole, allUsers, loginAs, switchRole } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<UserRole>(currentRole);

  if (!isOpen) return null;

  const usersByRole = {
    student: allUsers.filter((u) => u.role === 'student'),
    lecturer: allUsers.filter((u) => u.role === 'lecturer'),
    admin: allUsers.filter((u) => u.role === 'admin'),
  };

  const handleSelectUser = (userId: string, role: UserRole) => {
    loginAs(userId);
    if (onSwitchedRole) {
      onSwitchedRole(role);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#142B3B] to-[#006D77] text-white flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
              Institutional Identity & Access
            </span>
            <h3 className="text-xl font-extrabold tracking-tight mt-1">
              LASUSTECH Portal Gate
            </h3>
            <p className="text-xs text-slate-200 mt-0.5">
              Strict role isolation: Student attendance accounts and Lecturer faculty tools are segregated.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Active Identity */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20B486]" />
            <span className="text-slate-600 font-medium">Active Session:</span>
            <strong className="text-slate-900">{currentUser?.fullName}</strong>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#006D77]/10 text-[#006D77]">
              {currentRole}
            </span>
          </div>
        </div>

        {/* Portal Category Selector */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedCategory('student')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedCategory === 'student'
                  ? 'bg-white text-[#20B486] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('lecturer')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedCategory === 'lecturer'
                  ? 'bg-white text-[#006D77] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase size={15} />
              <span>Lecturer</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('admin')}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedCategory === 'admin'
                  ? 'bg-white text-purple-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders size={15} />
              <span>Admin</span>
            </button>
          </div>

          {/* Role Description Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            {selectedCategory === 'student' && (
              <p>
                <strong>Student Electronic Check-In Portal:</strong> Access course timetables, scan dynamic lecture QR codes, submit absence appeals, and view certified attendance transcripts. (Cannot modify courses or grade rosters).
              </p>
            )}
            {selectedCategory === 'lecturer' && (
              <p>
                <strong>Academic Faculty & Lecturer Portal:</strong> Configure your courses, schedule lecture timetables, launch live attendance stations, manually record attendance, and accept/reject student records & appeals.
              </p>
            )}
            {selectedCategory === 'admin' && (
              <p>
                <strong>Institutional Administration:</strong> Institution-wide management of faculties, departments, academic sessions, and university attendance policy thresholds.
              </p>
            )}
          </div>

          {/* Account List for Selected Role */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Available {selectedCategory.toUpperCase()} Credentials:
            </span>

            {usersByRole[selectedCategory].map((u) => {
              const isActive = u.id === currentUser?.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUser(u.id, u.role)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    isActive
                      ? 'border-[#006D77] bg-[#006D77]/5 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl}
                      alt={u.fullName}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {u.fullName}
                        {isActive && (
                          <span className="text-[10px] font-bold text-[#006D77] bg-[#006D77]/10 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {u.role === 'student'
                          ? `Matric: 22040401001 • Computer Science`
                          : u.role === 'lecturer'
                          ? `Staff ID: LASUSTECH/STAFF/CICT/042`
                          : u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="p-1 rounded-full bg-[#006D77] text-white">
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#006D77] flex items-center gap-1 hover:underline">
                        <span>Switch</span>
                        <ArrowRight size={13} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Lock size={12} className="text-[#20B486]" /> LASUSTECH Security Boundary Enforced
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
