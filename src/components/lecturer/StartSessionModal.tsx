/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QrCode, CheckSquare, Sparkles, MapPin, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Modal } from '../common/Modal';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: (sessionId: string, method: 'qr' | 'manual') => void;
  defaultCourseId?: string;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  defaultCourseId,
}) => {
  const { currentUser } = useAuth();
  const { courses, startNewSession, attendanceSessions } = useAttendance();

  // Get courses assigned to this lecturer (or all courses if admin)
  const availableCourses = courses.filter((c) =>
    currentUser?.role === 'admin' ? true : c.assignedLecturerIds.includes(currentUser?.id || '')
  );

  const [courseId, setCourseId] = useState<string>(
    defaultCourseId || (availableCourses[0] ? availableCourses[0].id : '')
  );
  const [topic, setTopic] = useState('');
  const [venue, setVenue] = useState('Auditorium Hall B');
  const [method, setMethod] = useState<'qr' | 'manual'>('qr');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);

  // Check if an active session already exists for this course
  const existingActiveSession = attendanceSessions.find(
    (s) => s.courseId === courseId && s.sessionStatus === 'active'
  );

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId) {
      setError('Please select a course.');
      return;
    }
    if (!topic.trim()) {
      setError('Please provide a lecture topic or title.');
      return;
    }
    if (!venue.trim()) {
      setError('Please provide a lecture venue.');
      return;
    }

    try {
      const session = startNewSession({
        courseId,
        lecturerId: currentUser?.id || 'usr_lec_samuel',
        topic: topic.trim(),
        venue: venue.trim(),
        method,
        startTime,
        endTime,
      });

      onSessionStarted(session.id, method);
      onClose();
    } catch {
      setError('Failed to initiate attendance session.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Lecture Attendance"
      subtitle="Initiate dynamic cryptographic QR check-in or manual register for your class"
      maxWidth="lg"
    >
      <form onSubmit={handleStart} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#E45B64]/10 border border-[#E45B64]/20 rounded-xl text-xs text-[#E45B64] flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {existingActiveSession && (
          <div className="p-3 bg-[#F4B942]/15 border border-[#F4B942]/30 rounded-xl text-xs text-[#B87B00] flex items-center gap-2">
            <AlertCircle size={15} />
            <span>
              Note: An active session for this course is already open. Starting another will create a concurrent session.
            </span>
          </div>
        )}

        {/* Course selection */}
        <div>
          <label className="block text-xs font-semibold text-[#17252F] mb-1">
            Assigned Course <span className="text-[#E45B64]">*</span>
          </label>
          <div className="relative">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77] focus:ring-1 focus:ring-[#006D77]"
              required
            >
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title} ({c.creditUnits} Units)
                </option>
              ))}
            </select>
            <BookOpen size={14} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-[#17252F] mb-1">
            Lecture Topic / Module <span className="text-[#E45B64]">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Distributed Consensus Algorithms & Raft Protocol"
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77] focus:ring-1 focus:ring-[#006D77]"
            required
          />
        </div>

        {/* Venue */}
        <div>
          <label className="block text-xs font-semibold text-[#17252F] mb-1">
            Lecture Venue / Room <span className="text-[#E45B64]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. LASUSTECH Ikorodu - ICT Complex Hall 1"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77] focus:ring-1 focus:ring-[#006D77]"
              required
            />
            <MapPin size={14} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Start Time</label>
            <div className="relative">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
              <Clock size={13} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">End Time</label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
              <Clock size={13} className="absolute right-3 top-3 text-[#718096] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Attendance Method Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-[#17252F]">
              Attendance Delivery Method <span className="text-[#E45B64]">*</span>
            </label>
            <span className="text-[10px] font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded-full">
              No Projector Required
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('qr')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                method === 'qr'
                  ? 'border-[#006D77] bg-[#006D77]/5 ring-1 ring-[#006D77]'
                  : 'border-[#E8EDF0] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${method === 'qr' ? 'bg-[#006D77] text-white' : 'bg-slate-100 text-[#718096]'}`}>
                  <QrCode size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#17252F] block">Chalkboard Code & Desk QR</span>
                  <span className="text-[9px] font-bold text-[#20B486] uppercase">Zero Projector Needed</span>
                </div>
              </div>
              <p className="text-[11px] text-[#718096] leading-tight">
                Generates a 6-digit passcode to write on the blackboard, plus mobile desk QR & printable placard.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMethod('manual')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                method === 'manual'
                  ? 'border-[#006D77] bg-[#006D77]/5 ring-1 ring-[#006D77]'
                  : 'border-[#E8EDF0] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${method === 'manual' ? 'bg-[#006D77] text-white' : 'bg-slate-100 text-[#718096]'}`}>
                  <CheckSquare size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#17252F] block">Manual Register</span>
                  <span className="text-[9px] font-bold text-[#006D77] uppercase">Sequential Roll-Call</span>
                </div>
              </div>
              <p className="text-[11px] text-[#718096] leading-tight">
                Directly call matric numbers 22040401001... and tap attendance (Present, Absent, Late, Excused).
              </p>
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8EDF0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
          >
            <Sparkles size={14} />
            <span>Launch Attendance Session</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
