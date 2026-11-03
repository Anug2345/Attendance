/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Clock,
  Download,
  Filter,
  Search,
  Calendar,
  BookOpen,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { calculateStudentCourseAttendance } from '../../services/attendanceCalculator';
import { downloadCSV, generateStudentTranscriptCSV } from '../../services/csvExport';
import { AttendanceStatusBadge, Badge } from '../common/Badge';
import { AttendanceStatus } from '../../types';

export const StudentHistory: React.FC = () => {
  const { currentUser, studentProfile, institution } = useAuth();
  const {
    courses,
    enrollments,
    attendanceSessions,
    attendanceRecords,
    departments,
    levels,
    allUsers,
  } = useAttendance();

  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Enrolled courses
  const myEnrollments = enrollments.filter(
    (e) => e.studentId === studentProfile?.id && e.status === 'enrolled'
  );
  const myCourses = courses.filter((c) => myEnrollments.some((e) => e.courseId === c.id));

  // Compute logs across all courses for this student
  const studentLogs: Array<{
    recordId: string;
    sessionId: string;
    courseId: string;
    courseCode: string;
    courseTitle: string;
    lectureDate: string;
    time: string;
    venue: string;
    topic: string;
    status: AttendanceStatus;
    checkInTime?: string;
    method: string;
  }> = [];

  attendanceSessions
    .filter((s) => s.sessionStatus !== 'cancelled' && myCourses.some((c) => c.id === s.courseId))
    .forEach((session) => {
      const course = courses.find((c) => c.id === session.courseId);
      const record = attendanceRecords.find(
        (r) => r.sessionId === session.id && r.studentId === studentProfile?.id
      );

      studentLogs.push({
        recordId: record ? record.id : `abs_${session.id}`,
        sessionId: session.id,
        courseId: session.courseId,
        courseCode: course?.code || 'Course',
        courseTitle: course?.title || 'Title',
        lectureDate: session.lectureDate,
        time: `${session.startTime} - ${session.endTime}`,
        venue: session.venue,
        topic: session.topic,
        status: record ? record.status : 'absent',
        checkInTime: record?.checkInTime,
        method: record ? (record.method === 'qr_scan' ? 'Dynamic QR' : 'Manual Ledger') : 'Not Checked In',
      });
    });

  // Sort by date descending
  studentLogs.sort((a, b) => new Date(b.lectureDate).getTime() - new Date(a.lectureDate).getTime());

  // Filter
  const filteredLogs = studentLogs.filter((log) => {
    const matchesCourse = courseFilter === 'all' || log.courseId === courseFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch =
      log.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesStatus && matchesSearch;
  });

  const handleExportTranscript = () => {
    if (!studentProfile || !currentUser) return;

    const dept = departments.find((d) => d.id === studentProfile.departmentId);
    const lvl = levels.find((l) => l.id === studentProfile.levelId);

    const courseRows = myCourses.map((c) => {
      const summary = calculateStudentCourseAttendance(
        c.id,
        c.code,
        c.title,
        studentProfile.id,
        attendanceSessions,
        attendanceRecords,
        institution
      );
      const lec = allUsers.find((u) => c.assignedLecturerIds.includes(u.id));

      return {
        code: c.code,
        title: c.title,
        lecturer: lec?.fullName || 'Faculty',
        totalSessions: summary.totalConductedSessions,
        attended: summary.presentCount,
        late: summary.lateCount,
        missed: summary.absentCount,
        percentage: summary.percentage,
        status: summary.isEligibleForExams ? 'CLEARED' : 'BELOW THRESHOLD',
      };
    });

    const csvData = generateStudentTranscriptCSV(
      institution.name,
      currentUser.fullName,
      studentProfile.matricNumber,
      dept?.name || 'Computer Science',
      lvl?.name || '400 Level',
      courseRows
    );

    downloadCSV(
      `Attendance_Transcript_${studentProfile.matricNumber.replace(/\//g, '_')}.csv`,
      csvData
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
            Official Attendance Ledger
          </span>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Personal Attendance Log</h2>
          <p className="text-xs text-[#718096]">
            Complete institutional record of all your lecture attendances, timestamps, and check-in methods.
          </p>
        </div>

        <button
          onClick={handleExportTranscript}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-xl transition-colors border border-[#006D77]/20 shadow-2xs"
        >
          <Download size={15} />
          <span>Export Official Transcript (CSV)</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic, course code, venue..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none text-[#17252F]"
            >
              <option value="all">All Enrolled Courses</option>
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none text-[#17252F]"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="late">Late Only</option>
              <option value="excused">Excused Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-[#718096] font-medium">
          Showing {filteredLogs.length} of {studentLogs.length} lecture entries
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Lecture Topic</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4 text-right">Check-In Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#718096]">
                    No attendance logs match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.recordId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#17252F]">{log.lectureDate}</div>
                      <div className="text-[10px] text-[#718096]">{log.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#006D77]">{log.courseCode}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#17252F]">
                      {log.topic}
                    </td>
                    <td className="py-3 px-4 text-[#718096]">{log.venue}</td>
                    <td className="py-3 px-4">
                      <AttendanceStatusBadge status={log.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-[#718096] font-medium">{log.method}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                      {log.checkInTime
                        ? new Date(log.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
