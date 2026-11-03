/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

export const StudentTimetable: React.FC = () => {
  const { studentProfile } = useAuth();
  const { courses, enrollments, timetables, allUsers } = useAttendance();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const myEnrollments = enrollments.filter(
    (e) => e.studentId === studentProfile?.id && e.status === 'enrolled'
  );
  const myCourseIds = myEnrollments.map((e) => e.courseId);

  const myTimetables = timetables.filter((t) => myCourseIds.includes(t.courseId));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
          Academic Lecture Schedule
        </span>
        <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Personal Course Timetable</h2>
        <p className="text-xs text-[#718096]">
          View lecture times, assigned venues, and lecturers for all your registered courses.
        </p>

        {/* Day selection tabs */}
        <div className="flex border-b border-[#E8EDF0] mt-6 gap-2 overflow-x-auto text-xs font-semibold">
          {days.map((day) => {
            const daySlots = myTimetables.filter((t) => t.dayOfWeek === day);
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#006D77] text-white shadow-xs font-bold'
                    : 'text-[#718096] hover:bg-slate-100 hover:text-[#17252F]'
                }`}
              >
                <span>{day}</span>
                {daySlots.length > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {daySlots.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots for selected day */}
      <div className="space-y-3">
        {myTimetables.filter((t) => t.dayOfWeek === selectedDay).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
            <Calendar size={32} className="mx-auto text-[#718096] mb-2" />
            <h4 className="text-sm font-semibold text-[#17252F]">No Lectures Scheduled for {selectedDay}</h4>
            <p className="text-xs text-[#718096] mt-1">
              You have no enrolled classes on this day. Use the time for independent study or practical labs.
            </p>
          </div>
        ) : (
          myTimetables
            .filter((t) => t.dayOfWeek === selectedDay)
            .map((slot) => {
              const course = courses.find((c) => c.id === slot.courseId);
              const lecturer = allUsers.find((u) => u.id === slot.lecturerId);

              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#006D77]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#006D77] font-mono">
                        {course?.code}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-bold text-[#17252F]">{course?.title}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#718096] pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#006D77]" /> {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#006D77]" /> {slot.venue}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-[#006D77]" /> {lecturer?.fullName || 'Assigned Faculty'}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-slate-100 text-[#17252F] rounded-lg text-xs font-semibold shrink-0">
                    {course?.creditUnits} Units
                  </span>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
