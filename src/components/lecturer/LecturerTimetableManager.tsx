/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { TimetableSlot } from '../../types';
import { Modal } from '../common/Modal';

interface LecturerTimetableManagerProps {
  onStartSessionForSlot?: (courseId: string, venue: string, startTime: string, endTime: string) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const LecturerTimetableManager: React.FC<LecturerTimetableManagerProps> = ({
  onStartSessionForSlot,
}) => {
  const { currentUser } = useAuth();
  const { courses, timetables, addTimetableSlot, deleteTimetableSlot } = useAttendance();

  // Courses assigned to this lecturer
  const myCourses = useMemo(() => {
    if (currentUser?.role === 'admin') return courses;
    return courses.filter((c) =>
      c.assignedLecturerIds?.includes(currentUser?.id || '')
    );
  }, [courses, currentUser]);

  const myCourseIds = useMemo(() => myCourses.map((c) => c.id), [myCourses]);

  // Timetable slots for this lecturer's courses
  const myTimetableSlots = useMemo(() => {
    return timetables.filter(
      (t) =>
        t.lecturerId === currentUser?.id ||
        myCourseIds.includes(t.courseId) ||
        currentUser?.role === 'admin'
    );
  }, [timetables, currentUser, myCourseIds]);

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New slot form state
  const [slotCourseId, setSlotCourseId] = useState(myCourses[0]?.id || '');
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('11:00');
  const [slotVenue, setSlotVenue] = useState('CICT Lecture Theatre 1');

  const filteredSlots = useMemo(() => {
    if (selectedDayFilter === 'all') return myTimetableSlots;
    return myTimetableSlots.filter((s) => s.dayOfWeek.toLowerCase() === selectedDayFilter.toLowerCase());
  }, [myTimetableSlots, selectedDayFilter]);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotCourseId || !slotVenue) return;

    const crs = courses.find((c) => c.id === slotCourseId);

    addTimetableSlot({
      courseId: slotCourseId,
      lecturerId: currentUser?.id || 'usr_lec_samuel',
      departmentId: crs?.departmentId || 'dept_cs',
      levelId: crs?.levelId || 'lvl_300',
      dayOfWeek: slotDay as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday',
      startTime: slotStartTime,
      endTime: slotEndTime,
      venue: slotVenue.trim(),
      semesterId: crs?.semesterId || 'sem_first_2026',
      sessionId: crs?.sessionId || 'sess_2026_2027',
    });

    setSuccessToast(`Lecture slot for ${crs?.code || 'Course'} on ${slotDay} (${slotStartTime}-${slotEndTime}) added to your timetable.`);
    setIsAddSlotOpen(false);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDeleteSlot = (slotId: string, courseCode?: string) => {
    if (confirm(`Remove this lecture slot from your schedule?`)) {
      deleteTimetableSlot(slotId);
      setSuccessToast(`Lecture slot removed.`);
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
              Lecturer Timetable Scheduling
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {currentUser?.fullName} ({myTimetableSlots.length} Scheduled Slots)
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">
            Lecture Timetable & Venue Schedule
          </h2>
          <p className="text-xs text-[#718096]">
            Set your weekly lecture schedule, specify classroom venues, and launch attendance sessions directly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (myCourses.length > 0) {
              setSlotCourseId(myCourses[0].id);
            }
            setIsAddSlotOpen(true);
          }}
          disabled={myCourses.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] disabled:bg-slate-300 rounded-xl transition shadow-xs shrink-0"
        >
          <Plus size={16} />
          <span>Add Lecture Slot</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Day of Week Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDayFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
            selectedDayFilter === 'all'
              ? 'bg-[#006D77] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Days ({myTimetableSlots.length})
        </button>
        {DAYS_OF_WEEK.map((day) => {
          const count = myTimetableSlots.filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                selectedDayFilter.toLowerCase() === day.toLowerCase()
                  ? 'bg-[#006D77] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {day} ({count})
            </button>
          );
        })}
      </div>

      {/* Timetable Weekly Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSlots.map((slot) => {
          const course = courses.find((c) => c.id === slot.courseId);

          return (
            <div
              key={slot.id}
              className="bg-white rounded-2xl border border-[#E8EDF0] hover:border-[#006D77]/40 transition shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-lg">
                    {slot.dayOfWeek}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id, course?.code)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Slot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {course?.code || 'CRS'}
                  </span>
                  <h3 className="text-sm font-bold text-[#17252F] line-clamp-1">
                    {course?.title || 'Lecture Module'}
                  </h3>
                </div>

                <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Clock size={14} className="text-[#006D77]" />
                    <span className="font-mono">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-[#20B486]" />
                    <span className="truncate">{slot.venue}</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Launch Attendance from this timetable slot */}
              {onStartSessionForSlot && (
                <button
                  type="button"
                  onClick={() =>
                    onStartSessionForSlot(
                      slot.courseId,
                      slot.venue,
                      slot.startTime,
                      slot.endTime
                    )
                  }
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Start Attendance for this Slot</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredSlots.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
          <Calendar size={36} className="mx-auto text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-[#17252F]">No Lecture Slots Scheduled</h4>
          <p className="text-xs text-[#718096] mt-1 mb-4">
            {selectedDayFilter === 'all'
              ? 'You have not added any lecture schedule slots yet. Set your lecture timetable slots below.'
              : `No lecture slots are scheduled for ${selectedDayFilter}.`}
          </p>
          <button
            type="button"
            onClick={() => setIsAddSlotOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#006D77] rounded-xl hover:bg-[#00555D] transition"
          >
            Add Timetable Slot
          </button>
        </div>
      )}

      {/* ADD TIMETABLE SLOT MODAL */}
      <Modal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Schedule Lecture Timetable Slot"
        subtitle="Associate lecture times and classroom venues with your course"
      >
        <form onSubmit={handleAddSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Assigned Course</label>
            <select
              required
              value={slotCourseId}
              onChange={(e) => setSlotCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            >
              {myCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Day of Week</label>
            <select
              value={slotDay}
              onChange={(e) => setSlotDay(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Start Time</label>
              <input
                type="time"
                required
                value={slotStartTime}
                onChange={(e) => setSlotStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">End Time</label>
              <input
                type="time"
                required
                value={slotEndTime}
                onChange={(e) => setSlotEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Lecture Venue / Hall</label>
            <input
              type="text"
              required
              value={slotVenue}
              onChange={(e) => setSlotVenue(e.target.value)}
              placeholder="e.g. CICT Lab 2, LT-101, Science Complex Room 4"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsAddSlotOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs"
            >
              Schedule Slot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
