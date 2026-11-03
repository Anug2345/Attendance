/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { calculateStudentCourseAttendance } from '../../services/attendanceCalculator';
import { AttendanceStatusBadge, Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface StudentCourseDetailProps {
  courseId: string;
  onBack: () => void;
  onOpenAppeals: () => void;
}

export const StudentCourseDetail: React.FC<StudentCourseDetailProps> = ({
  courseId,
  onBack,
  onOpenAppeals,
}) => {
  const { studentProfile, institution } = useAuth();
  const {
    courses,
    attendanceSessions,
    attendanceRecords,
    allUsers,
    submitAppeal,
  } = useAttendance();

  const course = courses.find((c) => c.id === courseId);
  const primaryLecturer = allUsers.find((u) => course?.assignedLecturerIds.includes(u.id));

  // Sessions for this course
  const validSessions = attendanceSessions
    .filter((s) => s.courseId === courseId && s.sessionStatus !== 'cancelled')
    .sort((a, b) => new Date(b.lectureDate).getTime() - new Date(a.lectureDate).getTime());

  const summary = calculateStudentCourseAttendance(
    courseId,
    course?.code || '',
    course?.title || '',
    studentProfile?.id || '',
    attendanceSessions,
    attendanceRecords,
    institution
  );

  // Appeal Modal State
  const [appealSession, setAppealSession] = useState<{ id: string; date: string; topic: string } | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealDocName, setAppealDocName] = useState('');
  const [appealSuccessNotice, setAppealSuccessNotice] = useState(false);

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealSession || !studentProfile) return;

    submitAppeal({
      studentId: studentProfile.id,
      courseId,
      attendanceSessionId: appealSession.id,
      lectureDate: appealSession.date,
      reason: appealReason,
      docName: appealDocName || 'Medical_Exemption_Form.pdf',
    });

    setAppealSession(null);
    setAppealReason('');
    setAppealDocName('');
    setAppealSuccessNotice(true);
    setTimeout(() => setAppealSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Back button & Course Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006D77] hover:underline"
        >
          <ArrowLeft size={14} />
          <span>Back to All Courses</span>
        </button>

        {appealSuccessNotice && (
          <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>Your attendance correction request has been officially submitted for lecturer review.</span>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold font-mono text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                {course?.code}
              </span>
              <span className="text-xs text-[#718096]">{course?.creditUnits} Credit Units</span>
            </div>
            <h1 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">{course?.title}</h1>
            <p className="text-xs text-[#718096] mt-1">Lecturer: {primaryLecturer?.fullName || 'Assigned Faculty'}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#718096] block uppercase tracking-wider font-semibold">
              Current Attendance Rate
            </span>
            <span className="text-3xl font-extrabold text-[#17252F]">{summary.percentage}%</span>
            <div className="mt-1">
              {summary.statusStanding === 'good_standing' ? (
                <Badge variant="success">Exam Eligible</Badge>
              ) : summary.statusStanding === 'warning' ? (
                <Badge variant="warning">Attendance Warning</Badge>
              ) : (
                <Badge variant="danger">Critical / At Risk</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Recovery Forecast Card if below or close to threshold */}
        <div className="p-4 rounded-xl border bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#006D77]/10 text-[#006D77] shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#17252F]">Attendance Standing & Recovery Forecast</h4>
              <p className="text-xs text-[#718096] mt-0.5">
                {summary.sessionsNeededToRecover > 0 ? (
                  <span>
                    You are currently below the {institution.defaultAttendanceThreshold}% threshold. You must attend the next{' '}
                    <strong className="text-[#E45B64] font-bold">{summary.sessionsNeededToRecover} consecutive lecture(s)</strong>{' '}
                    to regain exam eligibility.
                  </span>
                ) : (
                  <span className="text-[#20B486] font-semibold">
                    You currently meet the institutional {institution.defaultAttendanceThreshold}% threshold for exam clearance. Keep it up!
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAppeals}
            className="px-3 py-1.5 text-xs font-semibold text-[#006D77] bg-white border border-[#006D77]/30 hover:bg-[#006D77]/5 rounded-xl transition-colors shrink-0"
          >
            Manage Appeals
          </button>
        </div>
      </div>

      {/* Session History Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EDF0] bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#17252F]">Conducted Lecture Sessions & Attendance Logs</h3>
          <span className="text-xs text-[#718096]">
            {validSessions.length} total lecture sessions held
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Lecture Date & Time</th>
                <th className="py-3 px-4">Topic / Module</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Your Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {validSessions.map((session) => {
                const record = attendanceRecords.find(
                  (r) => r.sessionId === session.id && r.studentId === studentProfile?.id
                );
                const status = record ? record.status : 'absent';

                return (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#17252F]">{session.lectureDate}</div>
                      <div className="text-[11px] text-[#718096]">
                        {session.startTime} - {session.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#17252F]">
                      {session.topic}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">{session.venue}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="text-[11px] font-mono text-slate-500">
                        {session.attendanceMethod === 'qr' ? 'Dynamic QR' : 'Manual Register'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <AttendanceStatusBadge status={status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {status === 'absent' && (
                        <button
                          onClick={() =>
                            setAppealSession({
                              id: session.id,
                              date: session.lectureDate,
                              topic: session.topic,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006D77] hover:underline"
                        >
                          <HelpCircle size={12} />
                          <span>Appeal Absence</span>
                        </button>
                      )}
                      {status === 'present' && record?.checkInTime && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(record.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absence Appeal Modal */}
      <Modal
        isOpen={!!appealSession}
        onClose={() => setAppealSession(null)}
        title="Submit Attendance Correction Appeal"
        subtitle={`Request excuse for missed lecture on ${appealSession?.date}`}
      >
        <form onSubmit={handleAppealSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-[#E8EDF0] text-xs space-y-1">
            <p>
              <strong className="text-[#17252F]">Course:</strong> {course?.code} - {course?.title}
            </p>
            <p>
              <strong className="text-[#17252F]">Lecture:</strong> {appealSession?.topic}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Reason / Medical or Official Explanation <span className="text-[#E45B64]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Detail your legitimate reason for missing the lecture (e.g., University Health Center admission, varsity sports representation, bereavement)..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Supporting Documentation Reference (PDF or Doctor's Certificate)
            </label>
            <input
              type="text"
              value={appealDocName}
              onChange={(e) => setAppealDocName(e.target.value)}
              placeholder="e.g. University_Health_Center_Medical_Excuse_Certificate.pdf"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setAppealSession(null)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              Submit Official Appeal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
