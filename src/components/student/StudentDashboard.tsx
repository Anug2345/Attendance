/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { calculateOverallStudentAttendance, calculateStudentCourseAttendance } from '../../services/attendanceCalculator';
import { Badge } from '../common/Badge';

interface StudentDashboardProps {
  onNavigateToTab: (tab: string, param?: string) => void;
  onSelectCourse: (courseId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateToTab,
  onSelectCourse,
}) => {
  const { currentUser, studentProfile, institution } = useAuth();
  const {
    courses,
    enrollments,
    attendanceSessions,
    attendanceRecords,
    timetables,
    departments,
    levels,
  } = useAttendance();

  const studentDepartment = departments.find((d) => d.id === studentProfile?.departmentId);
  const studentLevel = levels.find((l) => l.id === studentProfile?.levelId);

  // Enrolled courses
  const myEnrollments = enrollments.filter(
    (e) => e.studentId === studentProfile?.id && e.status === 'enrolled'
  );

  const myCourses = courses.filter((c) => myEnrollments.some((e) => e.courseId === c.id));

  // Compute attendance summary for each course
  const courseSummaries = myCourses.map((c) => {
    return calculateStudentCourseAttendance(
      c.id,
      c.code,
      c.title,
      studentProfile?.id || '',
      attendanceSessions,
      attendanceRecords,
      institution
    );
  });

  const overall = calculateOverallStudentAttendance(courseSummaries);

  // Check if any lecture is currently active right now
  const activeLecture = attendanceSessions.find(
    (s) => s.sessionStatus === 'active' && myCourses.some((c) => c.id === s.courseId)
  );

  // Today's classes from timetable
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todayClasses = timetables.filter((t) => myCourses.some((c) => c.id === t.courseId));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#142B3B] to-[#006D77] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
              Student Attendance Portal
            </span>
            <span className="text-xs text-slate-300">• Matric: {studentProfile?.matricNumber}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.fullName}
          </h1>
          <p className="text-xs text-slate-200 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <Building size={13} className="text-[#20B486]" /> {studentDepartment?.name || 'Computer Science'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GraduationCap size={13} className="text-[#20B486]" /> {studentLevel?.name || '400 Level'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#20B486] font-semibold">
              <ShieldCheck size={13} /> Good Academic Standing
            </span>
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('scanner')}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-[#142B3B] bg-white hover:bg-slate-100 rounded-xl transition-all shadow-md active:scale-95"
          >
            <QrCode size={16} className="text-[#006D77]" />
            <span>Open Attendance Scanner</span>
          </button>
        </div>
      </div>

      {/* How Students Mark Attendance: Visual Step-by-Step Guide */}
      <div className="bg-white rounded-2xl p-6 border border-[#006D77]/20 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#006D77]/10 text-[#006D77] uppercase tracking-wide">
                Attendance Procedure
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Matriculation Series: <strong className="font-mono text-gray-900">{studentProfile?.matricNumber || '22040401001'}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#142B3B] mt-1">
              How Student Attendance Works in 4 Simple Steps
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Follow these simple steps in each lecture hall to have your presence digitally verified and certified.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('scanner')}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs shrink-0"
          >
            <QrCode size={15} />
            <span>Open Attendance Scanner</span>
          </button>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 relative">
            <div className="w-7 h-7 rounded-full bg-[#006D77] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-gray-900">Be Present in Lecture Hall</h4>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              Arrive at the designated lecture venue on your timetable before the official lecture start time.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 relative">
            <div className="w-7 h-7 rounded-full bg-[#006D77] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-gray-900">Check Chalkboard or Lectern</h4>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              Look at the classroom chalkboard/whiteboard for the <strong>6-digit attendance code</strong>, or check the lecturer's desk phone/placard.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 relative">
            <div className="w-7 h-7 rounded-full bg-[#006D77] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-gray-900">Enter Code or Scan Placard</h4>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
              Open Attendly on your phone. Enter the 6-digit chalkboard code OR scan the QR placard on the lecturer's desk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 relative">
            <div className="w-7 h-7 rounded-full bg-[#20B486] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-xs">
              ✓
            </div>
            <h4 className="text-xs font-bold text-emerald-950">Instant Verified Check-In</h4>
            <p className="text-[11px] text-emerald-900/80 mt-1 leading-relaxed">
              Your attendance is recorded under matric <span className="font-mono font-bold text-emerald-900">{studentProfile?.matricNumber || '22040401001'}</span> and queued for lecturer endorsement!
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Overall Attendance</span>
            <TrendingUp size={16} className="text-[#006D77]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#17252F]">{overall.overallPercentage}%</span>
            <span className="text-xs text-[#718096]">/ {institution.defaultAttendanceThreshold}% Min</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overall.overallPercentage >= institution.defaultAttendanceThreshold
                  ? 'bg-[#20B486]'
                  : overall.overallPercentage >= 70
                  ? 'bg-[#F4B942]'
                  : 'bg-[#E45B64]'
              }`}
              style={{ width: `${Math.min(100, overall.overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Classes Attended */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Classes Attended</span>
            <CheckCircle2 size={16} className="text-[#20B486]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-[#20B486]">{overall.totalAttended}</span>
            <span className="text-xs text-[#718096] ml-2">Sessions</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Recorded electronically</p>
        </div>

        {/* Classes Missed */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Absences</span>
            <AlertTriangle size={16} className="text-[#E45B64]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-[#E45B64]">{overall.totalMissed}</span>
            <span className="text-xs text-[#718096] ml-2">Missed</span>
          </div>
          <p className="text-[11px] text-[#718096] mt-2">Eligible for absence appeal</p>
        </div>

        {/* Exam Eligibility Clearance */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Exam Eligibility</span>
            <GraduationCap size={16} className="text-[#006D77]" />
          </div>
          <div className="mt-2">
            {overall.allEligible ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#20B486]/10 text-[#20B486] font-bold text-xs rounded-lg border border-[#20B486]/30">
                <CheckCircle2 size={13} /> CLEARED FOR EXAMS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E45B64]/10 text-[#E45B64] font-bold text-xs rounded-lg border border-[#E45B64]/30">
                <AlertTriangle size={13} /> AT RISK / WARNING
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#718096] mt-2">
            {overall.coursesAtRiskCount === 0
              ? 'All enrolled courses meet threshold'
              : `${overall.coursesAtRiskCount} course(s) require attendance recovery`}
          </p>
        </div>
      </div>

      {/* Course Attendance Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17252F]">Enrolled Courses Attendance Breakdown</h3>
            <p className="text-xs text-[#718096]">
              Real-time attendance rates against institutional {institution.defaultAttendanceThreshold}% threshold
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('my-courses')}
            className="text-xs font-bold text-[#006D77] hover:underline flex items-center gap-1"
          >
            <span>View All Courses</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseSummaries.map((summary) => {
            const course = courses.find((c) => c.id === summary.courseId);
            const isGood = summary.statusStanding === 'good_standing';
            const isWarning = summary.statusStanding === 'warning';

            return (
              <div
                key={summary.courseId}
                onClick={() => onSelectCourse(summary.courseId)}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-[#006D77] font-mono group-hover:underline">
                        {summary.courseCode}
                      </span>
                      <h4 className="text-sm font-bold text-[#17252F] mt-0.5 line-clamp-1">
                        {summary.courseTitle}
                      </h4>
                    </div>
                    {isGood ? (
                      <Badge variant="success" size="sm">Good Standing</Badge>
                    ) : isWarning ? (
                      <Badge variant="warning" size="sm">Warning</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">At Risk</Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-[#718096] mt-2 line-clamp-2">
                    {course?.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8EDF0] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#718096]">Attendance:</span>
                    <span className="font-extrabold text-[#17252F]">{summary.percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isGood ? 'bg-[#20B486]' : isWarning ? 'bg-[#F4B942]' : 'bg-[#E45B64]'
                      }`}
                      style={{ width: `${Math.min(100, summary.percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-[#718096] pt-1">
                    <span>
                      {summary.presentCount} Attended • {summary.absentCount} Missed
                    </span>
                    <span className="text-[#006D77] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Details <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Snippet */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#006D77]" />
            <h3 className="text-base font-bold text-[#17252F]">Weekly Lecture Timetable</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('timetable')}
            className="text-xs font-bold text-[#006D77] hover:underline"
          >
            View Full Timetable
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayClasses.slice(0, 3).map((slot) => {
            const course = courses.find((c) => c.id === slot.courseId);
            return (
              <div key={slot.id} className="p-3.5 bg-slate-50 rounded-xl border border-[#E8EDF0] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#006D77]/10 text-[#006D77] shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#17252F]">{course?.code}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({slot.dayOfWeek})</span>
                  </div>
                  <p className="text-[11px] text-[#718096] truncate">{course?.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    {slot.startTime} - {slot.endTime} • {slot.venue}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
