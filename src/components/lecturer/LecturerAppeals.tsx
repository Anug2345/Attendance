/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const LecturerAppeals: React.FC = () => {
  const { currentUser } = useAuth();
  const { appeals, courses, studentProfiles, reviewAppeal } = useAttendance();

  // Get courses assigned to this lecturer
  const myCourses = courses.filter((c) =>
    currentUser?.role === 'admin' ? true : c.assignedLecturerIds.includes(currentUser?.id || '')
  );
  const myCourseIds = myCourses.map((c) => c.id);

  // Filter appeals for courses taught by this lecturer
  const courseAppeals = appeals.filter((a) => myCourseIds.includes(a.courseId));

  const [activeReviewAppeal, setActiveReviewAppeal] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewAppeal) return;

    reviewAppeal(
      activeReviewAppeal.id,
      reviewDecision,
      currentUser?.fullName || 'Course Lecturer',
      reviewerNotes
    );

    const decisionText = reviewDecision === 'approved' ? 'approved as excused' : 'declined';
    setSuccessToast(`Appeal for ${activeReviewAppeal.studentMatric} was ${decisionText}.`);
    setTimeout(() => setSuccessToast(null), 3000);

    setActiveReviewAppeal(null);
    setReviewerNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
          Lecturer Review Inbox
        </span>
        <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Student Attendance Appeals</h2>
        <p className="text-xs text-[#718096]">
          Review and resolve student requests for absence excusal (medical, family emergencies, official university representation).
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Appeals List */}
      <div className="space-y-3">
        {courseAppeals.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
            <CheckCircle2 size={32} className="mx-auto text-[#20B486] mb-2" />
            <h4 className="text-sm font-semibold text-[#17252F]">No Appeals Pending Review</h4>
            <p className="text-xs text-[#718096] mt-1">
              All student absence requests for your courses have been resolved.
            </p>
          </div>
        ) : (
          courseAppeals.map((appeal) => {
            const course = courses.find((c) => c.id === appeal.courseId);
            const student = studentProfiles.find((s) => s.id === appeal.studentId);

            return (
              <div
                key={appeal.id}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs hover:shadow-xs transition-shadow space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                      {course?.code}
                    </span>
                    <span className="text-xs font-bold text-[#17252F]">
                      {student?.matricNumber}
                    </span>
                  </div>

                  <div>
                    {appeal.status === 'pending' ? (
                      <Badge variant="warning">Pending Review</Badge>
                    ) : appeal.status === 'approved' ? (
                      <Badge variant="success">Approved (Excused)</Badge>
                    ) : (
                      <Badge variant="danger">Declined</Badge>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-[#E8EDF0] text-xs space-y-2">
                  <div className="flex items-center gap-3 text-[#718096]">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> Missed Date: <strong className="text-[#17252F]">{appeal.lectureDate}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> Filed on {new Date(appeal.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[#17252F] font-medium leading-relaxed">
                    "{appeal.reason}"
                  </p>

                  {appeal.supportingDocName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#006D77]">
                      <FileText size={13} />
                      <span className="font-mono">{appeal.supportingDocName}</span>
                    </div>
                  )}
                </div>

                {appeal.lecturerNotes && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Lecturer Review Decision:
                    </span>
                    <p className="text-blue-900">{appeal.lecturerNotes}</p>
                  </div>
                )}

                {appeal.status === 'pending' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        reviewAppeal(
                          appeal.id,
                          'approved',
                          currentUser?.fullName || 'Course Lecturer',
                          'Approved by course lecturer: Valid excuse accepted.'
                        );
                        setSuccessToast(`Appeal for ${student?.matricNumber} approved & attendance marked as Excused.`);
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accept & Excuse</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        reviewAppeal(
                          appeal.id,
                          'rejected',
                          currentUser?.fullName || 'Course Lecturer',
                          'Declined by course lecturer: Insufficient documentation.'
                        );
                        setSuccessToast(`Appeal for ${student?.matricNumber} was declined.`);
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                    >
                      <XCircle size={14} />
                      <span>Reject Appeal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveReviewAppeal({
                          ...appeal,
                          studentMatric: student?.matricNumber || 'Student',
                          courseCode: course?.code || 'Course',
                        });
                        setReviewDecision('approved');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      Add Custom Note
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Modal
        isOpen={!!activeReviewAppeal}
        onClose={() => setActiveReviewAppeal(null)}
        title="Resolve Student Attendance Appeal"
        subtitle={`Reviewing appeal for ${activeReviewAppeal?.studentMatric} in ${activeReviewAppeal?.courseCode}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-[#E8EDF0] text-xs space-y-1">
            <p className="text-[#718096]">
              Missed Lecture Date: <strong className="text-[#17252F]">{activeReviewAppeal?.lectureDate}</strong>
            </p>
            <p className="text-[#17252F] italic">"{activeReviewAppeal?.reason}"</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewDecision('approved')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  reviewDecision === 'approved'
                    ? 'border-[#20B486] bg-[#20B486]/10 text-[#20B486] font-bold'
                    : 'border-[#E8EDF0] text-[#718096]'
                }`}
              >
                Approve (Mark Excused)
              </button>
              <button
                type="button"
                onClick={() => setReviewDecision('rejected')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  reviewDecision === 'rejected'
                    ? 'border-[#E45B64] bg-[#E45B64]/10 text-[#E45B64] font-bold'
                    : 'border-[#E8EDF0] text-[#718096]'
                }`}
              >
                Decline Appeal
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">
              Lecturer Decision Comments / Notes
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="e.g. Verified with University Health Center clinic log. Exemption authorized."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setActiveReviewAppeal(null)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              Confirm Official Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
