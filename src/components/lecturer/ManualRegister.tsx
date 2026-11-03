/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Save,
  BookOpen,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceStatus } from '../../types';
import { Modal } from '../common/Modal';

interface ManualRegisterProps {
  initialSessionId?: string;
  onSaved?: () => void;
}

export const ManualRegister: React.FC<ManualRegisterProps> = ({
  initialSessionId,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const {
    courses,
    attendanceSessions,
    attendanceRecords,
    enrollments,
    studentProfiles,
    saveManualAttendance,
  } = useAttendance();

  // Find course sessions for this lecturer
  const myCourses = courses.filter((c) =>
    currentUser?.role === 'admin' ? true : c.assignedLecturerIds.includes(currentUser?.id || '')
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    myCourses[0] ? myCourses[0].id : ''
  );

  // Available sessions for this course
  const courseSessions = attendanceSessions.filter((s) => s.courseId === selectedCourseId);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    initialSessionId || (courseSessions[0] ? courseSessions[0].id : '')
  );

  const activeSession = attendanceSessions.find((s) => s.id === selectedSessionId);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // Local state of attendance marks for this session
  const [marks, setMarks] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Get enrolled students
  const enrolledStudentProfiles = enrollments
    .filter((e) => e.courseId === selectedCourseId && e.status === 'enrolled')
    .map((e) => studentProfiles.find((p) => p.id === e.studentId))
    .filter(Boolean);

  // Load existing records when session changes
  useEffect(() => {
    if (!selectedSessionId) return;

    const existingRecords = attendanceRecords.filter((r) => r.sessionId === selectedSessionId);
    const initialMarks: Record<string, { status: AttendanceStatus; notes: string }> = {};

    enrolledStudentProfiles.forEach((student) => {
      if (!student) return;
      const rec = existingRecords.find((r) => r.studentId === student.id);
      initialMarks[student.id] = {
        status: rec ? rec.status : 'absent',
        notes: rec?.notes || '',
      };
    });

    setMarks(initialMarks);
  }, [selectedSessionId, selectedCourseId]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleBulkMark = (status: AttendanceStatus) => {
    setMarks((prev) => {
      const updated = { ...prev };
      enrolledStudentProfiles.forEach((s) => {
        if (s) {
          updated[s.id] = {
            ...updated[s.id],
            status,
          };
        }
      });
      return updated;
    });
  };

  // Live counts
  const totalCount = enrolledStudentProfiles.length;
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  Object.values(marks).forEach((m) => {
    if (m.status === 'present') presentCount++;
    else if (m.status === 'late') lateCount++;
    else if (m.status === 'absent') absentCount++;
    else if (m.status === 'excused') excusedCount++;
  });

  const attendancePercent =
    totalCount > 0 ? Math.round(((presentCount + lateCount * 0.5 + excusedCount) / totalCount) * 100) : 0;

  // Filter students for table
  const filteredStudents = enrolledStudentProfiles.filter((s) => {
    if (!s) return false;
    const currentMark = marks[s.id]?.status || 'absent';
    const matchesStatus = statusFilter === 'all' || currentMark === statusFilter;
    const matchesSearch =
      s.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.academicStatus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSaveSubmit = () => {
    if (!selectedSessionId) return;

    const payload = Object.entries(marks).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes,
    }));

    saveManualAttendance(selectedSessionId, payload);
    setIsConfirmOpen(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);

    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Selection Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
                Lecturer Roster Management
              </span>
              <span className="text-xs text-[#718096]">• Institutional Register</span>
            </div>
            <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Manual Attendance Register</h2>
            <p className="text-xs text-[#718096]">
              Directly take or modify course lecture attendance with instant calculations and audit tracking.
            </p>
          </div>

          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={!selectedSessionId || totalCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] disabled:bg-slate-300 rounded-xl transition-colors shadow-xs"
          >
            <Save size={15} />
            <span>Save & Commit Register</span>
          </button>
        </div>

        {saveSuccessNotice && (
          <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] flex items-center gap-2 font-semibold animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Attendance register submitted and recorded to institutional database successfully.</span>
          </div>
        )}

        {/* Selection Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E8EDF0]">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Select Course</label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const newSessions = attendanceSessions.filter((s) => s.courseId === e.target.value);
                  if (newSessions.length > 0) setSelectedSessionId(newSessions[0].id);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              >
                {myCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.title}
                  </option>
                ))}
              </select>
              <BookOpen size={14} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Lecture Session</label>
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              >
                {courseSessions.length === 0 ? (
                  <option value="">No lecture sessions recorded for this course</option>
                ) : (
                  courseSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lectureDate} ({s.startTime} - {s.endTime}) : {s.topic} [{s.sessionStatus.toUpperCase()}]
                    </option>
                  ))
                )}
              </select>
              <Calendar size={14} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[11px] font-bold text-[#718096] uppercase">Enrolled</span>
          <p className="text-xl font-bold text-[#17252F] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#20B486]/30 shadow-2xs border-l-4 border-l-[#20B486]">
          <span className="text-[11px] font-bold text-[#20B486] uppercase">Present (P)</span>
          <p className="text-xl font-bold text-[#20B486] mt-1">{presentCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#F4B942]/30 shadow-2xs border-l-4 border-l-[#F4B942]">
          <span className="text-[11px] font-bold text-[#B87B00] uppercase">Late (L)</span>
          <p className="text-xl font-bold text-[#B87B00] mt-1">{lateCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#006D77]/30 shadow-2xs border-l-4 border-l-[#006D77]">
          <span className="text-[11px] font-bold text-[#006D77] uppercase">Excused (E)</span>
          <p className="text-xl font-bold text-[#006D77] mt-1">{excusedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E45B64]/30 shadow-2xs border-l-4 border-l-[#E45B64]">
          <span className="text-[11px] font-bold text-[#E45B64] uppercase">Absent (A)</span>
          <p className="text-xl font-bold text-[#E45B64] mt-1">{absentCount}</p>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Bulk Actions */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by matriculation number..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1.5 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="late">Late Only</option>
              <option value="excused">Excused Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#718096] font-medium hidden sm:inline">Bulk Mark:</span>
          <button
            onClick={() => handleBulkMark('present')}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#20B486] bg-[#20B486]/10 hover:bg-[#20B486]/20 rounded-lg transition-colors"
          >
            All Present
          </button>
          <button
            onClick={() => handleBulkMark('absent')}
            className="px-2.5 py-1.5 text-xs font-semibold text-[#E45B64] bg-[#E45B64]/10 hover:bg-[#E45B64]/20 rounded-lg transition-colors"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-12 text-center">S/N</th>
                <th className="py-3 px-4">Matriculation No.</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4 text-center">Mark Attendance Status</th>
                <th className="py-3 px-4">Lecturer Notes / Excuse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#718096]">
                    No students match the criteria for this register.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  if (!student) return null;
                  const currentStatus = marks[student.id]?.status || 'absent';
                  const currentNotes = marks[student.id]?.notes || '';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#17252F] font-mono">{student.matricNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        <span className="text-[11px] text-[#718096]">
                          {student.academicStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'present')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'present'
                                ? 'bg-[#20B486] text-white shadow-xs'
                                : 'bg-slate-100 text-[#718096] hover:bg-slate-200'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'late')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'late'
                                ? 'bg-[#F4B942] text-slate-900 shadow-xs'
                                : 'bg-slate-100 text-[#718096] hover:bg-slate-200'
                            }`}
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'excused')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'excused'
                                ? 'bg-[#006D77] text-white shadow-xs'
                                : 'bg-slate-100 text-[#718096] hover:bg-slate-200'
                            }`}
                          >
                            E
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student.id, 'absent')}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-[#E45B64] text-white shadow-xs'
                                : 'bg-slate-100 text-[#718096] hover:bg-slate-200'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={currentNotes}
                          onChange={(e) =>
                            setMarks((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...prev[student.id],
                                notes: e.target.value,
                              },
                            }))
                          }
                          placeholder="Optional remark..."
                          className="w-full px-2.5 py-1 text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-[#E8EDF0] focus:border-[#006D77] rounded-lg focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal before save */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Commit Attendance Register"
        subtitle="Confirm electronic attendance ledger submission"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#718096]">
            You are committing the attendance register for{' '}
            <strong className="text-[#17252F]">
              {courses.find((c) => c.id === selectedCourseId)?.code} - {activeSession?.topic}
            </strong>{' '}
            on {activeSession?.lectureDate}.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-[#E8EDF0] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#718096]">Present Students:</span>
              <span className="font-bold text-[#20B486]">{presentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Late Arrivals:</span>
              <span className="font-bold text-[#F4B942]">{lateCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718096]">Excused Students:</span>
              <span className="font-bold text-[#006D77]">{excusedCount}</span>
            </div>
            <div className="flex justify-between border-t border-[#E8EDF0] pt-1.5">
              <span className="text-[#718096]">Absent Students:</span>
              <span className="font-bold text-[#E45B64]">{absentCount}</span>
            </div>
            <div className="flex justify-between border-t border-[#E8EDF0] pt-1.5">
              <span className="text-[#17252F] font-bold">Class Attendance Rate:</span>
              <span className="font-bold text-[#006D77]">{attendancePercent}%</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Return to Editing
            </button>
            <button
              onClick={handleSaveSubmit}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              <FileCheck size={14} />
              <span>Confirm & Lock Marks</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
