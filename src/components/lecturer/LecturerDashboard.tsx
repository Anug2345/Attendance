/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Users,
  QrCode,
  CheckSquare,
  Sparkles,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';

interface LecturerDashboardProps {
  onNavigateToTab: (tab: string, param?: string) => void;
  onOpenStartModal: (courseId?: string) => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  onNavigateToTab,
  onOpenStartModal,
}) => {
  const { currentUser, lecturerProfile } = useAuth();
  const {
    courses,
    enrollments,
    attendanceSessions,
    attendanceRecords,
    appeals,
    timetables,
    departments,
  } = useAttendance();

  // Courses assigned to this lecturer
  const myCourses = courses.filter((c) =>
    currentUser?.role === 'admin' ? true : c.assignedLecturerIds.includes(currentUser?.id || '')
  );

  // Total enrolled students across courses
  const myCourseIds = myCourses.map((c) => c.id);
  const myEnrollments = enrollments.filter(
    (e) => myCourseIds.includes(e.courseId) && e.status === 'enrolled'
  );

  // Unique student count
  const uniqueStudents = new Set(myEnrollments.map((e) => e.studentId)).size;

  // Conducted sessions
  const mySessions = attendanceSessions.filter(
    (s) => myCourseIds.includes(s.courseId) && s.sessionStatus !== 'cancelled'
  );

  // Active session right now
  const activeSession = attendanceSessions.find(
    (s) => s.sessionStatus === 'active' && (s.lecturerId === currentUser?.id || currentUser?.role === 'admin')
  );

  // Pending appeals count
  const pendingAppeals = appeals.filter(
    (a) => myCourseIds.includes(a.courseId) && a.status === 'pending'
  );

  // Calculate average attendance across lecturer's courses
  let totalAttendedEntries = 0;
  let totalPossibleEntries = 0;

  mySessions.forEach((s) => {
    const records = attendanceRecords.filter((r) => r.sessionId === s.id);
    totalAttendedEntries += records.filter((r) => r.status === 'present' || r.status === 'late').length;
    totalPossibleEntries += s.enrolledCount;
  });

  const avgAttendance =
    totalPossibleEntries > 0
      ? Math.round((totalAttendedEntries / totalPossibleEntries) * 100)
      : 84;

  const dept = departments.find((d) => d.id === lecturerProfile?.departmentId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#006D77] to-[#142B3B] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
              Lecturer Portal
            </span>
            <span className="text-xs text-slate-300">• {lecturerProfile?.staffId || 'LASUSTECH/STAFF/CICT/042'}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {currentUser?.fullName}
          </h1>
          <p className="text-xs text-slate-200 flex items-center gap-2">
            <Building size={13} className="text-[#20B486]" />
            <span>
              {lecturerProfile?.designation || 'Senior Lecturer'}, {dept?.name || 'Department of Computer Science'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateToTab('lecturer-admin')}
            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md active:scale-95"
          >
            <ShieldCheck size={16} className="text-[#006D77]" />
            <span>Attendance Admin & Ledger</span>
          </button>
          <button
            onClick={() => onOpenStartModal()}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-[#20B486] hover:bg-[#1ca377] rounded-xl transition-all shadow-md active:scale-95"
          >
            <Sparkles size={16} />
            <span>Start Attendance Session</span>
          </button>
        </div>
      </div>

      {/* Active Live Session Alert Box */}
      {activeSession && (
        <div className="p-5 bg-white rounded-2xl border-2 border-[#20B486] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#20B486]/10 text-[#20B486] flex items-center justify-center shrink-0">
              <QrCode size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#17252F]">
                  LIVE ATTENDANCE RUNNING: {courses.find((c) => c.id === activeSession.courseId)?.code}
                </span>
                <Badge variant="success">ACCEPTING CHECK-INS</Badge>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Topic: "{activeSession.topic}" at {activeSession.venue} ({activeSession.startTime} - {activeSession.endTime})
              </p>
              <p className="text-[11px] text-[#20B486] font-semibold mt-1">
                {activeSession.presentCount} of {activeSession.enrolledCount} enrolled students checked in so far
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('live-session', activeSession.id)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              <QrCode size={14} />
              <span>Open Attendance Station</span>
            </button>
            <button
              onClick={() => onNavigateToTab('manual-register', activeSession.id)}
              className="px-3 py-2 text-xs font-semibold text-[#17252F] hover:bg-slate-100 rounded-xl transition-colors border border-[#E8EDF0]"
            >
              Manual Register
            </button>
          </div>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Assigned Courses</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#17252F]">{myCourses.length}</span>
            <span className="text-xs text-[#718096]">Active Courses</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Current Academic Semester</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Enrolled Students</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#006D77]">{uniqueStudents}</span>
            <span className="text-xs text-[#718096]">Students</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Across all assigned cohorts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Lectures Conducted</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#17252F]">{mySessions.length}</span>
            <span className="text-xs text-[#718096]">Sessions</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Logged in electronic ledger</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Avg Attendance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#20B486]">{avgAttendance}%</span>
            <span className="text-xs text-[#718096]">Attendance</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Institutional benchmark 75%</p>
        </div>
      </div>

      {/* Pending Appeals Notice */}
      {pendingAppeals.length > 0 && (
        <div className="p-4 bg-[#F4B942]/15 border border-[#F4B942]/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-[#B87B00] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#17252F]">
                {pendingAppeals.length} Pending Student Attendance Appeal(s) Awaiting Review
              </p>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Students have submitted medical and official absence justifications for your review.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('appeals')}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#17252F] bg-white border border-[#E8EDF0] hover:bg-slate-50 rounded-xl transition-colors shrink-0 shadow-2xs"
          >
            Review Appeals
          </button>
        </div>
      )}

      {/* Assigned Courses Roster Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17252F]">My Assigned Lecture Courses</h3>
            <p className="text-xs text-[#718096]">
              Manage student cohorts, start live QR sessions, or open manual registers
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('my-courses')}
            className="text-xs font-bold text-[#006D77] hover:underline flex items-center gap-1"
          >
            <span>View All Course Details</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map((c) => {
            const courseEnrollmentCount = enrollments.filter(
              (e) => e.courseId === c.id && e.status === 'enrolled'
            ).length;
            const courseSessions = attendanceSessions.filter(
              (s) => s.courseId === c.id && s.sessionStatus !== 'cancelled'
            );

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#006D77] font-mono bg-[#006D77]/10 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {c.creditUnits} Credit Units
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#17252F] mt-2 line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-[#718096] mt-1 line-clamp-2">{c.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8EDF0] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#718096]">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {courseEnrollmentCount} Enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {courseSessions.length} Lectures Held
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onOpenStartModal(c.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
                    >
                      <QrCode size={13} />
                      <span>Start QR</span>
                    </button>
                    <button
                      onClick={() => onNavigateToTab('manual-register', c.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#17252F] bg-slate-50 hover:bg-slate-100 border border-[#E8EDF0] rounded-xl transition-colors"
                    >
                      <CheckSquare size={13} />
                      <span>Register</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
