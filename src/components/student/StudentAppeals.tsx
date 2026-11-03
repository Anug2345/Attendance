/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const StudentAppeals: React.FC = () => {
  const { studentProfile } = useAuth();
  const { appeals, courses, attendanceSessions, enrollments, submitAppeal } = useAttendance();

  const myEnrollments = enrollments.filter(
    (e) => e.studentId === studentProfile?.id && e.status === 'enrolled'
  );
  const myCourses = courses.filter((c) => myEnrollments.some((e) => e.courseId === c.id));

  const myAppeals = appeals
    .filter((a) => a.studentId === studentProfile?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseId, setCourseId] = useState(myCourses[0]?.id || '');
  const [sessionDate, setSessionDate] = useState('2026-10-27');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  const handleCreateAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;

    submitAppeal({
      studentId: studentProfile.id,
      courseId,
      attendanceSessionId: `as_${courseId}_manual`,
      lectureDate: sessionDate,
      reason,
      docName: docName || 'medical_letter_exemption.pdf',
    });

    setIsModalOpen(false);
    setReason('');
    setDocName('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
            Attendance Corrections & Appeals
          </span>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Student Absence Appeals</h2>
          <p className="text-xs text-[#718096]">
            Submit formal medical, bereavement, or official institutional absence correction requests for lecturer review.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
        >
          <Plus size={15} />
          <span>New Attendance Appeal</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Your appeal was filed successfully and dispatched to your course lecturer.</span>
        </div>
      )}

      {/* Appeals List */}
      <div className="space-y-3">
        {myAppeals.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
            <HelpCircle size={32} className="mx-auto text-[#718096] mb-2" />
            <h4 className="text-sm font-semibold text-[#17252F]">No Attendance Appeals Filed</h4>
            <p className="text-xs text-[#718096] mt-1">
              You haven't filed any absence appeals. If you were legitimately excused from a lecture, you can submit an appeal above.
            </p>
          </div>
        ) : (
          myAppeals.map((appeal) => {
            const course = courses.find((c) => c.id === appeal.courseId);

            return (
              <div
                key={appeal.id}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs space-y-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                      {course?.code}
                    </span>
                    <span className="text-xs font-bold text-[#17252F]">{course?.title}</span>
                  </div>

                  <div>
                    {appeal.status === 'pending' ? (
                      <Badge variant="warning">Pending Lecturer Review</Badge>
                    ) : appeal.status === 'approved' ? (
                      <Badge variant="success">Approved & Excused</Badge>
                    ) : (
                      <Badge variant="danger">Appeal Declined</Badge>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-[#E8EDF0] text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-[#718096]">
                    <Calendar size={13} />
                    <span>Missed Lecture Date: <strong className="text-[#17252F]">{appeal.lectureDate}</strong></span>
                  </div>
                  <p className="text-[#17252F] font-medium leading-relaxed">
                    "{appeal.reason}"
                  </p>
                  {appeal.supportingDocName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#006D77] pt-1">
                      <FileText size={12} />
                      <span className="font-mono">{appeal.supportingDocName}</span>
                    </div>
                  )}
                </div>

                {appeal.lecturerNotes && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Lecturer Review ({appeal.reviewedBy || 'Faculty'}):
                    </span>
                    <p className="text-blue-900">{appeal.lecturerNotes}</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Submitted on {new Date(appeal.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Appeal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Attendance Correction Appeal"
        subtitle="Request formal exemption for an unavoidable lecture absence"
      >
        <form onSubmit={handleCreateAppeal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Select Enrolled Course <span className="text-[#E45B64]">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              required
            >
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Missed Lecture Date <span className="text-[#E45B64]">*</span>
            </label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Reason / Medical or Official Explanation <span className="text-[#E45B64]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the verifiable reason you could not attend this lecture session..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Supporting Documentation Reference (Medical note, Dean's letter)
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Health_Center_Certificate_AUT_2026.pdf"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
