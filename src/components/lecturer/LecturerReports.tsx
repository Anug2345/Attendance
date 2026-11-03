/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Filter,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { calculateStudentCourseAttendance } from '../../services/attendanceCalculator';
import { downloadCSV, generateCourseRegisterCSV } from '../../services/csvExport';
import { Badge } from '../common/Badge';

export const LecturerReports: React.FC = () => {
  const { currentUser, institution } = useAuth();
  const {
    courses,
    enrollments,
    studentProfiles,
    attendanceSessions,
    attendanceRecords,
    departments,
    levels,
    academicSessions,
    semesters,
  } = useAttendance();

  const myCourses = courses.filter((c) =>
    currentUser?.role === 'admin' ? true : c.assignedLecturerIds.includes(currentUser?.id || '')
  );

  const [selectedCourseId, setSelectedCourseId] = useState(myCourses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'cleared' | 'at_risk'>('all');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const currentSession = academicSessions.find((s) => s.isCurrent)?.name || '2026/2027';
  const currentSemester = semesters.find((s) => s.isCurrent)?.name || 'First Semester';

  // Get enrolled students
  const enrolledStudentProfiles = enrollments
    .filter((e) => e.courseId === selectedCourseId && e.status === 'enrolled')
    .map((e) => studentProfiles.find((p) => p.id === e.studentId))
    .filter(Boolean);

  // Compute stats for each student
  const studentRows = enrolledStudentProfiles.map((student) => {
    if (!student) return null;
    const summary = calculateStudentCourseAttendance(
      selectedCourseId,
      selectedCourse?.code || '',
      selectedCourse?.title || '',
      student.id,
      attendanceSessions,
      attendanceRecords,
      institution
    );
    const dept = departments.find((d) => d.id === student.departmentId);
    const lvl = levels.find((l) => l.id === student.levelId);

    return {
      studentId: student.id,
      matricNumber: student.matricNumber,
      fullName: student.matricNumber, // using matric as key identifier
      department: dept?.name || 'Computer Science',
      level: lvl?.name || '400 Level',
      totalSessions: summary.totalConductedSessions,
      present: summary.presentCount,
      late: summary.lateCount,
      absent: summary.absentCount,
      excused: summary.excusedCount,
      percentage: summary.percentage,
      isEligible: summary.isEligibleForExams,
      statusStanding: summary.statusStanding,
    };
  }).filter(Boolean);

  // Filtered rows
  const filteredRows = studentRows.filter((row) => {
    if (!row) return false;
    const matchesSearch = row.matricNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'cleared' && row.isEligible) ||
      (statusFilter === 'at_risk' && !row.isEligible);
    return matchesSearch && matchesStatus;
  });

  const totalStudents = studentRows.length;
  const atRiskStudents = studentRows.filter((r) => r && !r.isEligible).length;
  const clearedStudents = totalStudents - atRiskStudents;
  const avgCourseAttendance =
    totalStudents > 0
      ? Math.round(studentRows.reduce((acc, r) => acc + (r?.percentage || 0), 0) / totalStudents)
      : 80;

  const handleExportCSV = () => {
    if (!selectedCourse) return;

    const exportData = studentRows.map((r) => ({
      matricNumber: r?.matricNumber || '',
      fullName: r?.fullName || '',
      department: r?.department || '',
      level: r?.level || '',
      totalSessions: r?.totalSessions || 0,
      present: r?.present || 0,
      late: r?.late || 0,
      absent: r?.absent || 0,
      excused: r?.excused || 0,
      percentage: r?.percentage || 0,
      eligibility: r?.isEligible ? 'CLEARED FOR EXAMS' : 'INELIGIBLE (<75%)',
    }));

    const csvContent = generateCourseRegisterCSV(
      institution.name,
      selectedCourse.code,
      selectedCourse.title,
      currentSession,
      currentSemester,
      currentUser?.fullName || 'Lecturer',
      exportData
    );

    downloadCSV(
      `Official_Attendance_Register_${selectedCourse.code.replace(/\s+/g, '_')}_${currentSession.replace(/\//g, '-')}.csv`,
      csvContent
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
              Course Register & Exam Clearance
            </span>
            <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Official Attendance Reports</h2>
            <p className="text-xs text-[#718096]">
              Generate signed official attendance registers and exam eligibility rosters.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!selectedCourseId || totalStudents === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] disabled:bg-slate-300 rounded-xl transition-colors shadow-xs"
          >
            <Download size={15} />
            <span>Export Official Register (CSV)</span>
          </button>
        </div>

        {/* Course Picker */}
        <div className="pt-2 border-t border-[#E8EDF0] max-w-md">
          <label className="block text-xs font-semibold text-[#17252F] mb-1">Select Course Register</label>
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            >
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title} ({c.creditUnits} Units)
                </option>
              ))}
            </select>
            <BookOpen size={14} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718096] uppercase">Enrolled Students</span>
          <p className="text-2xl font-bold text-[#17252F] mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#20B486]/30 shadow-2xs border-l-4 border-l-[#20B486]">
          <span className="text-[11px] font-bold text-[#20B486] uppercase">Exam Eligible (≥75%)</span>
          <p className="text-2xl font-bold text-[#20B486] mt-1">{clearedStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E45B64]/30 shadow-2xs border-l-4 border-l-[#E45B64]">
          <span className="text-[11px] font-bold text-[#E45B64] uppercase">At Risk / Ineligible (&lt;75%)</span>
          <p className="text-2xl font-bold text-[#E45B64] mt-1">{atRiskStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#006D77]/30 shadow-2xs border-l-4 border-l-[#006D77]">
          <span className="text-[11px] font-bold text-[#006D77] uppercase">Cohort Average Rate</span>
          <p className="text-2xl font-bold text-[#006D77] mt-1">{avgCourseAttendance}%</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student matric number..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none"
          >
            <option value="all">All Clearance Standings</option>
            <option value="cleared">Cleared for Exams (≥75%)</option>
            <option value="at_risk">Ineligible / At Risk (&lt;75%)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-12 text-center">S/N</th>
                <th className="py-3 px-4">Matriculation No.</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-center">Lectures Held</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Late</th>
                <th className="py-3 px-4 text-center">Excused</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-right">Exam Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#718096]">
                    No student records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  if (!row) return null;
                  return (
                    <tr key={row.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#17252F]">{row.matricNumber}</td>
                      <td className="py-3.5 px-4 text-[#718096]">{row.level}</td>
                      <td className="py-3.5 px-4 text-center font-medium">{row.totalSessions}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#20B486]">{row.present}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#B87B00]">{row.late}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#006D77]">{row.excused}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#E45B64]">{row.absent}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-[#17252F]">{row.percentage}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {row.isEligible ? (
                          <Badge variant="success">CLEARED</Badge>
                        ) : (
                          <Badge variant="danger">INELIGIBLE</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
