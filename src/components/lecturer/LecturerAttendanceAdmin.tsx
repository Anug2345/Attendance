/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  AlertTriangle,
  Search,
  ShieldCheck,
  Edit3,
  UserPlus,
  Printer,
  Download,
  Lock,
  Unlock,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceRecord, AttendanceStatus, AttendanceSession, StudentProfile } from '../../types';

export const LecturerAttendanceAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    courses,
    attendanceSessions,
    attendanceRecords,
    studentProfiles,
    enrollments,
    institution,
    allUsers,
    modifyAttendanceRecord,
    approveSessionAttendance,
    unlockSessionAttendance,
    recordManualAttendanceForStudent,
  } = useAttendance();

  // Guard: strictly for lecturers or administrators
  const isAuthorized = currentUser?.role === 'lecturer' || currentUser?.role === 'admin';

  // Filter lecturer courses
  const lecturerCourses = useMemo(() => {
    if (currentUser?.role === 'admin') return courses;
    return courses.filter((c) =>
      c.assignedLecturerIds?.includes(currentUser?.id || '')
    );
  }, [courses, currentUser]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    lecturerCourses[0]?.id || ''
  );

  // Available sessions for selected course
  const courseSessions = useMemo(() => {
    return attendanceSessions
      .filter((s) => s.courseId === selectedCourseId)
      .sort((a, b) => new Date(b.lectureDate).getTime() - new Date(a.lectureDate).getTime());
  }, [attendanceSessions, selectedCourseId]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    courseSessions[0]?.id || ''
  );

  // Update selected session if course changes
  useEffect(() => {
    if (courseSessions.length > 0 && !courseSessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(courseSessions[0].id);
    }
  }, [selectedCourseId, courseSessions, selectedSessionId]);

  const currentSession: AttendanceSession | undefined = useMemo(() => {
    return attendanceSessions.find((s) => s.id === selectedSessionId);
  }, [attendanceSessions, selectedSessionId]);

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Enrolled students for this course
  const enrolledStudents = useMemo(() => {
    const courseEnrolls = enrollments.filter(
      (e) => e.courseId === selectedCourseId && e.status === 'enrolled'
    );
    const enrolledIds = new Set(courseEnrolls.map((e) => e.studentId));
    return studentProfiles.filter((s) => enrolledIds.has(s.id));
  }, [enrollments, selectedCourseId, studentProfiles]);

  // Roster combined with attendance records
  const sessionRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.sessionId === selectedSessionId);
  }, [attendanceRecords, selectedSessionId]);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // Modification Modal state
  const [modifyingRecord, setModifyingRecord] = useState<{
    recordId?: string;
    studentId: string;
    studentName: string;
    matricNumber: string;
    currentStatus: AttendanceStatus;
  } | null>(null);

  const [newStatus, setNewStatus] = useState<AttendanceStatus>('present');
  const [modifyReason, setModifyReason] = useState('');
  const [verificationType, setVerificationType] = useState('Physical Roll Call');

  // Approve Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Unlock Modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  // Add Manual Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('present');
  const [manualNote, setManualNote] = useState('');

  // Build complete roster rows
  const rosterData = useMemo(() => {
    const recordMap = new Map<string, AttendanceRecord>();
    sessionRecords.forEach((r) => recordMap.set(r.studentId, r));

    return enrolledStudents.map((student: StudentProfile) => {
      const record = recordMap.get(student.id);
      const user = allUsers.find((u) => u.id === student.userId);
      const matricNumber = student.matricNumber || student.matriculationNumber || '22040401001';
      const studentName = user?.fullName || 'Enrolled Student';

      return {
        student,
        record,
        matricNumber,
        studentName,
        status: (record ? record.status : 'absent') as AttendanceStatus,
        checkInTime: record?.checkInTime,
        method: record?.method || 'unmarked',
        isApproved: record?.isApproved || currentSession?.approvalStatus === 'approved',
        modifiedByLecturer: record?.modifiedByLecturer,
        modifiedReason: record?.modifiedReason,
      };
    });
  }, [enrolledStudents, sessionRecords, currentSession, allUsers]);

  // Filtered rows
  const filteredRoster = useMemo(() => {
    return rosterData.filter((row) => {
      const matchesSearch =
        row.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rosterData, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = enrolledStudents.length || 1;
    const presentCount = rosterData.filter((r) => r.status === 'present').length;
    const lateCount = rosterData.filter((r) => r.status === 'late').length;
    const absentCount = rosterData.filter((r) => r.status === 'absent').length;
    const excusedCount = rosterData.filter((r) => r.status === 'excused').length;
    const rate = Math.round(((presentCount + lateCount) / total) * 100);

    return { total, presentCount, lateCount, absentCount, excusedCount, rate };
  }, [enrolledStudents.length, rosterData]);

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl border border-red-200 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Restricted Lecturer Access</h2>
        <p className="text-gray-600 mt-2 text-sm">
          This administration panel is restricted exclusively to academic lecturers and university administrators for reviewing, modifying, and certifying lecture attendance ledgers.
        </p>
      </div>
    );
  }

  // Handle Modify Record submission
  const handleSaveModification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyingRecord || !selectedSessionId) return;

    const lecturerName = currentUser?.fullName || 'Lecturer';
    const fullReason = `${verificationType}: ${modifyReason.trim() || 'Verified by course lecturer'}`;

    if (modifyingRecord.recordId) {
      modifyAttendanceRecord({
        recordId: modifyingRecord.recordId,
        newStatus,
        lecturerName,
        reason: fullReason,
      });
    } else {
      recordManualAttendanceForStudent({
        sessionId: selectedSessionId,
        studentId: modifyingRecord.studentId,
        status: newStatus,
        lecturerName,
        notes: fullReason,
      });
    }

    setModifyingRecord(null);
    setModifyReason('');
  };

  // Handle Session Approval
  const handleApproveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    approveSessionAttendance({
      sessionId: selectedSessionId,
      lecturerName: currentUser?.fullName || 'Course Lecturer',
      notes: approvalNotes.trim() || 'Officially endorsed and locked for institutional reporting',
    });

    setShowApproveModal(false);
    setApprovalNotes('');
  };

  // Handle Session Unlock
  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    unlockSessionAttendance(
      selectedSessionId,
      currentUser?.fullName || 'Course Lecturer',
      unlockReason.trim() || 'Lecturer requested ledger amendment'
    );

    setShowUnlockModal(false);
    setUnlockReason('');
  };

  // Handle Manual Student Add
  const handleAddManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId || !selectedSessionId) return;

    recordManualAttendanceForStudent({
      sessionId: selectedSessionId,
      studentId: manualStudentId,
      status: manualStatus,
      lecturerName: currentUser?.fullName || 'Course Lecturer',
      notes: manualNote.trim() || 'Manual entry via Lecturer Admin Panel',
    });

    setShowAddStudentModal(false);
    setManualStudentId('');
    setManualNote('');
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!currentCourse || !currentSession) return;
    const headers = ['S/N', 'Matriculation Number', 'Full Name', 'Status', 'Check-In Time', 'Method', 'Lecturer Certified'];
    const rows = filteredRoster.map((r, i) => [
      i + 1,
      r.matricNumber,
      `"${r.studentName}"`,
      r.status.toUpperCase(),
      r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : 'N/A',
      r.method,
      r.isApproved ? 'YES' : 'PENDING'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentCourse.code}_${currentSession.lectureDate}_Official_Attendance_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Lecturer Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#006D77]/10 text-[#006D77] border border-[#006D77]/20 uppercase tracking-wide">
              Lecturer Administration Panel
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Institutional Ledger Management & Approval
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#142B3B] mt-1">
            Attendance Review, Override & Approval Ledger
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review student attendance rosters (Matric No. 22040401001 series), apply verified status modifications, and officially certify attendance for academic eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!currentSession}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={!currentSession}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            title="Print Attendance Register"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            1. Select Assigned Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#006D77] focus:outline-none"
          >
            {lecturerCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title} ({c.creditUnits} Units)
              </option>
            ))}
          </select>
        </div>

        {/* Session Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            2. Select Lecture Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            disabled={courseSessions.length === 0}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#006D77] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
          >
            {courseSessions.length === 0 ? (
              <option value="">No attendance sessions recorded yet for this course</option>
            ) : (
              courseSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.lectureDate} • {s.topic} ({s.venue}) — [{s.approvalStatus === 'approved' ? '✓ APPROVED' : 'PENDING APPROVAL'}]
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {currentSession ? (
        <>
          {/* Official Approval & Certification Banner */}
          <div
            className={`p-5 rounded-xl border transition-all ${
              currentSession.approvalStatus === 'approved'
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentSession.approvalStatus === 'approved'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-amber-500 text-white shadow-md'
                  }`}
                >
                  {currentSession.approvalStatus === 'approved' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <FileCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">
                      {currentSession.approvalStatus === 'approved'
                        ? 'Official Attendance Ledger Certified & Approved'
                        : 'Attendance Ledger Awaiting Lecturer Official Approval'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        currentSession.approvalStatus === 'approved'
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {currentSession.approvalStatus === 'approved' ? 'Certified' : 'Action Required'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 mt-1 max-w-2xl">
                    {currentSession.approvalStatus === 'approved' ? (
                      <>
                        Officially endorsed and signed off by <strong>{currentSession.approvedByLecturer || 'Lecturer'}</strong> on{' '}
                        {currentSession.approvedAt
                          ? new Date(currentSession.approvedAt).toLocaleString()
                          : 'Recent'}
                        . {currentSession.approvalNotes && `Remarks: "${currentSession.approvalNotes}"`}
                      </>
                    ) : (
                      <>
                        Review the student roster below. Any necessary roll-call or medical adjustments can be performed with <strong>Modify Status</strong>. Once verified, click <strong>Approve & Endorse Ledger</strong> to make this attendance officially certified for exams.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {currentSession.approvalStatus === 'approved' ? (
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition shadow-xs"
                  >
                    <Unlock className="w-4 h-4 text-gray-500" />
                    Unlock Ledger for Corrections
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#20B486] hover:bg-[#1ca377] text-white rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approve & Endorse Ledger
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500">Enrolled Students</span>
              <p className="text-2xl font-bold text-[#142B3B] mt-1">{stats.total}</p>
              <span className="text-[11px] text-gray-400">Total in class</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
              <span className="text-xs font-medium text-emerald-700">Present</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.presentCount}</p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {Math.round((stats.presentCount / stats.total) * 100)}% on time
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
              <span className="text-xs font-medium text-amber-700">Late</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lateCount}</p>
              <span className="text-[11px] text-amber-600 font-medium">After grace window</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-red-100 shadow-xs">
              <span className="text-xs font-medium text-red-700">Absent</span>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.absentCount}</p>
              <span className="text-[11px] text-red-600 font-medium">Unexcused</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
              <span className="text-xs font-medium text-blue-700">Excused</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.excusedCount}</p>
              <span className="text-[11px] text-blue-600 font-medium">Medical / Official</span>
            </div>

            <div className="bg-[#006D77]/5 p-3.5 rounded-xl border border-[#006D77]/20 shadow-xs">
              <span className="text-xs font-medium text-[#006D77]">Attendance Rate</span>
              <p className="text-2xl font-bold text-[#006D77] mt-1">{stats.rate}%</p>
              <span className="text-[11px] text-[#006D77] font-semibold">
                {stats.rate >= (institution.defaultAttendanceThreshold || 75) ? 'Above Threshold' : 'Below Threshold'}
              </span>
            </div>
          </div>

          {/* Student Roster Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Table Controls */}
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search matric (e.g. 22040401001) or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none"
                >
                  <option value="all">All Statuses ({rosterData.length})</option>
                  <option value="present">Present ({stats.presentCount})</option>
                  <option value="late">Late ({stats.lateCount})</option>
                  <option value="absent">Absent ({stats.absentCount})</option>
                  <option value="excused">Excused ({stats.excusedCount})</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-lg transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Manual Entry
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">S/N</th>
                    <th className="py-3 px-4">Student Matriculation No.</th>
                    <th className="py-3 px-4">Full Student Name</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Verification Method</th>
                    <th className="py-3 px-4">Lecturer Notes & Overrides</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No student attendance records match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((row, index) => {
                      const isMod = !!row.modifiedByLecturer;
                      return (
                        <tr
                          key={row.student.id}
                          className={`hover:bg-gray-50/75 transition ${
                            isMod ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-gray-500">
                            {index + 1}
                          </td>

                          {/* Matriculation number strictly formatted in 22040401001 sequence */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 text-xs tracking-wider">
                              {row.matricNumber}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{row.studentName}</div>
                            <div className="text-[10px] text-gray-500">
                              Admission {row.student.admissionYear} • Status: {row.student.academicStatus.replace('_', ' ')}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 text-center">
                            {row.status === 'present' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Present
                              </span>
                            )}
                            {row.status === 'late' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Late
                              </span>
                            )}
                            {row.status === 'absent' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                Absent
                              </span>
                            )}
                            {row.status === 'excused' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                                Excused
                              </span>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                            {row.checkInTime
                              ? new Date(row.checkInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : '—'}
                          </td>

                          {/* Method */}
                          <td className="py-3 px-4">
                            {row.method === 'qr_scan' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                <Sparkles className="w-3 h-3 text-[#006D77]" />
                                Dynamic QR Scan
                              </span>
                            )}
                            {row.method === 'manual_lecturer' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                <Edit3 className="w-3 h-3 text-amber-600" />
                                Lecturer Manual
                              </span>
                            )}
                            {row.method === 'appeal_correction' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                <FileCheck className="w-3 h-3 text-blue-600" />
                                Appeal Override
                              </span>
                            )}
                            {row.method === 'unmarked' && (
                              <span className="text-[11px] text-gray-400 italic">No check-in</span>
                            )}
                          </td>

                          {/* Overrides / Notes */}
                          <td className="py-3 px-4 max-w-xs">
                            {row.modifiedByLecturer ? (
                              <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-[10px] text-amber-900 leading-tight">
                                <span className="font-semibold">{row.modifiedByLecturer}:</span> {row.modifiedReason}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400">—</span>
                            )}
                          </td>

                          {/* Quick Accept, Reject & Modify Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick 1-Click Accept (Mark Present & Verified) */}
                              <button
                                type="button"
                                onClick={() => {
                                  recordManualAttendanceForStudent({
                                    sessionId: selectedSessionId,
                                    studentId: row.student.id,
                                    status: 'present',
                                    lecturerName: currentUser?.fullName || 'Course Lecturer',
                                    notes: 'Attendance officially accepted & certified by lecturer.',
                                  });
                                }}
                                disabled={row.status === 'present'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                                  row.status === 'present'
                                    ? 'bg-emerald-50 text-emerald-300 border border-emerald-100 cursor-not-allowed'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                                title="Accept & Verify Student Attendance as Present"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>

                              {/* Quick 1-Click Reject (Mark Absent & Flagged) */}
                              <button
                                type="button"
                                onClick={() => {
                                  recordManualAttendanceForStudent({
                                    sessionId: selectedSessionId,
                                    studentId: row.student.id,
                                    status: 'absent',
                                    lecturerName: currentUser?.fullName || 'Course Lecturer',
                                    notes: 'Attendance rejected by lecturer (unverified or proxy check-in).',
                                  });
                                }}
                                disabled={row.status === 'absent'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                                  row.status === 'absent'
                                    ? 'bg-rose-50 text-rose-300 border border-rose-100 cursor-not-allowed'
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                                title="Reject Attendance & Mark as Absent"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>

                              {/* Detailed Modify Modal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setModifyingRecord({
                                    recordId: row.record?.id,
                                    studentId: row.student.id,
                                    studentName: row.studentName,
                                    matricNumber: row.matricNumber,
                                    currentStatus: row.status,
                                  });
                                  setNewStatus(row.status);
                                  setModifyReason(row.modifiedReason || '');
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-2xs"
                                title="Custom Override or Excuse"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing <strong>{filteredRoster.length}</strong> of <strong>{rosterData.length}</strong> enrolled students
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                All overrides are permanently logged into the institutional audit ledger.
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Attendance Sessions Available</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            You have not initiated any attendance sessions for this course yet. Go to <strong>Start Lecture Session</strong> to generate a dynamic QR code and collect student check-ins.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Modify Student Status */}
      {/* ========================================================================= */}
      {modifyingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Modify Student Attendance</h3>
                <p className="text-xs text-gray-500 mt-0.5">Lecturer Discretionary Override</p>
              </div>
              <button
                onClick={() => setModifyingRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModification} className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Student Name:</span>
                  <span className="font-semibold text-gray-900">{modifyingRecord.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Matriculation No:</span>
                  <span className="font-mono font-bold text-[#006D77]">{modifyingRecord.matricNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Status:</span>
                  <span className="uppercase font-bold text-gray-700">{modifyingRecord.currentStatus}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select New Attendance Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition flex items-center justify-center gap-1.5 ${
                        newStatus === st
                          ? st === 'present'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'late'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : st === 'absent'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Verification Basis / Ground
                </label>
                <select
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                >
                  <option value="Physical Roll Call">Physical Roll Call (In-Person Verification)</option>
                  <option value="Medical Certificate">Official Medical Certificate Submitted</option>
                  <option value="Device Malfunction">Student Device / Camera Malfunction during QR scan</option>
                  <option value="Faculty Official Duty">Approved University / Faculty Representation</option>
                  <option value="Special Clearance">Special HOD / Dean Authorization</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Mandatory Audit Reason / Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="e.g. Student was present in front row, phone battery died during lecture."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModifyingRecord(null)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#005a63] rounded-lg transition shadow-xs"
                >
                  Apply & Record in Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Approve & Endorse Session */}
      {/* ========================================================================= */}
      {showApproveModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-emerald-950 text-base">Approve & Certify Lecture Ledger</h3>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveSession} className="p-5 space-y-4">
              <div className="text-xs text-gray-600 leading-relaxed">
                By approving this attendance ledger, you officially certify as the course lecturer that the attendance records for <strong>{currentCourse?.code}: {currentSession.topic}</strong> conducted on <strong>{currentSession.lectureDate}</strong> have been reviewed, verified, and are ready for official exam eligibility calculations.
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Present Count:</span>
                  <span className="font-bold text-emerald-700">{stats.presentCount} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Late Count:</span>
                  <span className="font-bold text-amber-700">{stats.lateCount} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Absent Count:</span>
                  <span className="font-bold text-rose-700">{stats.absentCount} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Certifying Lecturer:</span>
                  <span className="font-bold text-gray-900">{currentUser?.fullName}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Lecturer Certification Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="e.g. Conducted in lecture theatre B2. All roll call verifications finalized."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#20B486] hover:bg-[#1ca377] rounded-lg transition shadow-md flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Certify & Lock Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Unlock Session */}
      {/* ========================================================================= */}
      {showUnlockModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-amber-950 text-base">Unlock Attendance Ledger</h3>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUnlockSession} className="p-5 space-y-4">
              <div className="text-xs text-gray-600 leading-relaxed">
                Unlocking this session allows further modifications to student attendance statuses. This action is logged in the permanent audit trail.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Reason for Reopening Ledger <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="e.g. Received verified medical certificate from department office for student 22040401003."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs"
                >
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Add Manual Enrolled Student */}
      {/* ========================================================================= */}
      {showAddStudentModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#006D77]" />
                <h3 className="font-bold text-gray-900 text-base">Add Student to Session Ledger</h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualStudent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select Enrolled Student
                </label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                >
                  <option value="">-- Choose Student (Matriculation No.) --</option>
                  {enrolledStudents.map((st) => {
                    const u = allUsers.find((user) => user.id === st.userId);
                    const matric = st.matricNumber || st.matriculationNumber || '22040401001';
                    return (
                      <option key={st.id} value={st.id}>
                        {matric} — {u?.fullName || 'Student'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition ${
                        manualStatus === st
                          ? 'bg-[#006D77] text-white border-[#006D77]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Reason / Roll Call Notes
                </label>
                <textarea
                  rows={2}
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Student registered late, verified physically present in class."
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006D77]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualStudentId}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#005a63] rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
