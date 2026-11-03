/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  QrCode,
  Users,
  Building,
  Calendar,
  FileText,
  Sliders,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentRole } = useAuth();
  const { attendanceSessions, appeals } = useAttendance();

  const activeSessionsCount = attendanceSessions.filter((s) => s.sessionStatus === 'active').length;
  const pendingAppealsCount = appeals.filter((a) => a.status === 'pending').length;

  const getNavItems = () => {
    switch (currentRole) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Institutional Dashboard', icon: LayoutDashboard },
          { id: 'all-sessions', label: 'Attendance Sessions', icon: QrCode, badge: activeSessionsCount > 0 ? `${activeSessionsCount} Live` : undefined, badgeColor: 'bg-[#20B486] text-white' },
          { id: 'courses', label: 'Courses & Enrolment', icon: BookOpen },
          { id: 'users', label: 'Student & Staff Directory', icon: Users },
          { id: 'faculties-depts', label: 'Faculties & Departments', icon: Building },
          { id: 'timetables', label: 'Timetable Schedules', icon: Calendar },
          { id: 'reports', label: 'Reports & Analytics', icon: FileText },
          { id: 'policies', label: 'Attendance Policies', icon: Sliders },
          { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck },
        ];

      case 'lecturer':
        return [
          { id: 'dashboard', label: 'Lecturer Dashboard', icon: LayoutDashboard },
          { id: 'my-courses', label: 'Set & Manage Courses', icon: BookOpen },
          { id: 'timetable', label: 'Set Lecture Timetable', icon: Calendar },
          { id: 'lecturer-admin', label: 'Attendance Approvals & Ledger', icon: ShieldCheck, highlight: true, badge: 'Accept/Reject', badgeColor: 'bg-[#006D77] text-white' },
          { id: 'start-session', label: 'Start Attendance Session', icon: Sparkles },
          { id: 'live-session', label: 'Classroom Attendance Station', icon: QrCode, badge: activeSessionsCount > 0 ? 'Open' : undefined, badgeColor: 'bg-[#20B486] text-white' },
          { id: 'manual-register', label: 'Manual Register (Roll-call)', icon: CheckSquare },
          { id: 'appeals', label: 'Attendance Appeals', icon: HelpCircle, badge: pendingAppealsCount > 0 ? `${pendingAppealsCount}` : undefined, badgeColor: 'bg-[#F4B942] text-slate-900' },
          { id: 'reports', label: 'Course Reports & CSV', icon: FileText },
        ];

      case 'student':
        return [
          { id: 'dashboard', label: 'My Attendance', icon: LayoutDashboard },
          { id: 'scanner', label: 'Mark Attendance', icon: QrCode, highlight: true, badge: activeSessionsCount > 0 ? 'Open' : undefined, badgeColor: 'bg-[#20B486] text-white' },
          { id: 'my-courses', label: 'Enrolled Courses', icon: BookOpen },
          { id: 'history', label: 'Attendance History', icon: Clock },
          { id: 'timetable', label: 'Class Timetable', icon: Calendar },
          { id: 'appeals', label: 'Attendance Appeals', icon: HelpCircle },
        ];
    }
  };

  const navItems = getNavItems();

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-[#E8EDF0] flex flex-col justify-between transition-transform duration-200 shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-[#718096] uppercase tracking-wider">
            {currentRole} portal navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#006D77] text-white shadow-xs font-semibold'
                    : item.highlight
                    ? 'bg-[#006D77]/10 text-[#006D77] hover:bg-[#006D77]/15 font-semibold'
                    : 'text-[#17252F] hover:bg-slate-100 hover:text-[#006D77]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={isActive ? 'text-white' : item.highlight ? 'text-[#006D77]' : 'text-[#718096]'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom institutional security notice */}
        <div className="p-4 border-t border-[#E8EDF0] bg-slate-50 text-[11px] text-[#718096]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#20B486]"></span>
            <span className="font-semibold text-[#17252F]">System Protected</span>
          </div>
          <p className="text-[10px] leading-tight">
            Dynamic cryptographic rotating tokens & anti-proxy verification active.
          </p>
        </div>
      </aside>
    </>
  );
};
