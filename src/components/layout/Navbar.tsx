/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Check,
  QrCode,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenSearch: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenPortalSwitcher?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onNavigateToTab, onOpenPortalSwitcher }) => {
  const { currentUser, currentRole, institution, studentProfile, lecturerProfile } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, attendanceSessions, resetToDemoData } = useAttendance();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id || n.userId === 'all' || n.roleTarget === currentRole
  );
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const activeLiveSessions = attendanceSessions.filter((s) => s.sessionStatus === 'active');

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">Administrator</span>;
      case 'lecturer':
        return <span className="bg-[#006D77]/10 text-[#006D77] font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">Lecturer</span>;
      case 'student':
        return <span className="bg-[#20B486]/10 text-[#20B486] font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">Student</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E8EDF0] shadow-2xs">
      {/* Top institution bar with active role identification */}
      <div className="bg-[#142B3B] text-white px-4 sm:px-6 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 size={13} className="text-[#20B486] shrink-0" />
          <span className="font-semibold truncate">{institution.name}</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            {currentRole === 'student' && `Student Portal (Matric: ${studentProfile?.matricNumber || '22040401001'})`}
            {currentRole === 'lecturer' && `Faculty Portal (Staff ID: ${lecturerProfile?.staffId || 'LASUSTECH/STAFF/CICT/042'})`}
            {currentRole === 'admin' && 'University Administration Center'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeLiveSessions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#20B486]/20 text-[#20B486] px-2 py-0.5 rounded-full border border-[#20B486]/40 text-[11px] font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20B486]"></span>
              {activeLiveSessions.length} Live Session Active
            </div>
          )}

          {/* Secure Institutional Portal Switcher Button */}
          {onOpenPortalSwitcher && (
            <button
              onClick={onOpenPortalSwitcher}
              className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 border border-white/10"
              title="Switch between Student, Lecturer, and Admin portals"
            >
              <span>Switch Portal</span>
            </button>
          )}

          <button
            onClick={resetToDemoData}
            title="Reset system to seed demo data"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <RotateCcw size={11} />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006D77] text-white flex items-center justify-center shadow-xs">
            <QrCode size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-[#17252F]">ATTENDLY</span>
              <span className="text-[10px] bg-[#006D77]/10 text-[#006D77] font-bold px-1.5 py-0.5 rounded">v2.4</span>
            </div>
            <p className="text-[11px] text-[#718096] font-medium tracking-tight -mt-0.5">
              Attendance, Simplified.
            </p>
          </div>
        </div>

        {/* Global Search Button */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#718096] bg-[#F7F9FA] hover:bg-slate-100 border border-[#E8EDF0] rounded-xl transition-all shadow-2xs group"
          >
            <span className="flex items-center gap-2.5">
              <Search size={15} className="text-[#718096] group-hover:text-[#006D77] transition-colors" />
              <span>Search courses, matric numbers, sessions...</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Scanner Shortcut for Student */}
          {currentRole === 'student' && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('scanner')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-lg transition-colors shadow-xs"
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">Mark Attendance</span>
            </button>
          )}

          {/* Quick Launch Session for Lecturer */}
          {currentRole === 'lecturer' && onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('start-session')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-lg transition-colors shadow-xs"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Start Attendance</span>
            </button>
          )}

          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-[#17252F] hover:bg-slate-100 transition-colors border border-[#E8EDF0]"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#E45B64] rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E8EDF0] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-[#E8EDF0] flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#17252F]">System Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-[#E45B64]/10 text-[#E45B64] text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => currentUser && markAllNotificationsRead(currentUser.id)}
                      className="text-xs text-[#006D77] hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#E8EDF0]">
                  {userNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#718096]">
                      No notifications yet.
                    </div>
                  ) : (
                    userNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.link && onNavigateToTab) onNavigateToTab(notif.link);
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                          !notif.isRead ? 'bg-[#006D77]/5' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {notif.type === 'checkin_success' ? (
                            <CheckCircle2 size={16} className="text-[#20B486]" />
                          ) : notif.type === 'warning' ? (
                            <AlertTriangle size={16} className="text-[#F4B942]" />
                          ) : notif.type === 'session_opened' ? (
                            <QrCode size={16} className="text-[#006D77]" />
                          ) : (
                            <Bell size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#17252F]">{notif.title}</p>
                          <p className="text-[11px] text-[#718096] mt-0.5 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 inline-block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Account Switcher Dropdown */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-[#E8EDF0]"
            >
              <img
                src={currentUser?.avatarUrl}
                alt={currentUser?.fullName}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#17252F] leading-none">{currentUser?.fullName}</span>
                </div>
                <div className="mt-0.5">{getRoleBadge(currentRole)}</div>
              </div>
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E8EDF0] z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                <div className="px-2 py-1.5 border-b border-[#E8EDF0]">
                  <p className="text-[10px] uppercase tracking-wider text-[#718096] font-bold">Active Institutional Identity</p>
                  <p className="text-sm font-bold text-[#17252F] mt-0.5">{currentUser?.fullName}</p>
                  <p className="text-xs text-[#718096] truncate">{currentUser?.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getRoleBadge(currentRole)}
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {currentRole === 'student'
                        ? studentProfile?.matricNumber || '22040401001'
                        : currentRole === 'lecturer'
                        ? lecturerProfile?.staffId || 'STAFF/042'
                        : 'ADMIN'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  <p className="leading-tight">
                    {currentRole === 'student'
                      ? 'You are signed into the Student Attendance Portal. Lecturer dashboards and registers are strictly restricted.'
                      : currentRole === 'lecturer'
                      ? 'You are signed into the Faculty Portal with authority to set courses, timetables, and certify attendance.'
                      : 'You are signed into the Institutional Administration Portal.'}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleSwitcher(false);
                      if (onOpenPortalSwitcher) onOpenPortalSwitcher();
                    }}
                    className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Switch Institutional Portal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
