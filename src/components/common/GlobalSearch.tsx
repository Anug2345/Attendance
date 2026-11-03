/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Users, QrCode, ArrowRight, X } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: 'course' | 'student' | 'session', id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const { courses, studentProfiles, attendanceSessions } = useAttendance();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // toggle
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase())
  );

  const matchedStudents = studentProfiles.filter((s) =>
    s.matricNumber.toLowerCase().includes(query.toLowerCase())
  );

  const matchedSessions = attendanceSessions.filter(
    (s) =>
      s.topic.toLowerCase().includes(query.toLowerCase()) ||
      s.venue.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-[#142B3B]/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E8EDF0] w-full max-w-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#E8EDF0] flex items-center gap-3 bg-white">
          <Search size={18} className="text-[#006D77] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, matric numbers, or lecture topics..."
            className="w-full text-sm font-medium text-[#17252F] bg-transparent focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Courses */}
          {matchedCourses.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-[#718096] uppercase tracking-wider px-2">
                Courses
              </span>
              <div className="mt-1 space-y-1">
                {matchedCourses.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectResult('course', c.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-[#006D77]/10 text-[#006D77]">
                        <BookOpen size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#17252F] font-mono group-hover:text-[#006D77]">
                          {c.code}
                        </span>
                        <p className="text-[11px] text-[#718096] truncate">{c.title}</p>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-[#006D77]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Students */}
          {matchedStudents.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-[#718096] uppercase tracking-wider px-2">
                Students
              </span>
              <div className="mt-1 space-y-1">
                {matchedStudents.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectResult('student', s.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-[#20B486]/10 text-[#20B486]">
                        <Users size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold font-mono text-[#17252F]">
                          {s.matricNumber}
                        </span>
                        <p className="text-[11px] text-[#718096] capitalize">{s.academicStatus.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-[#20B486]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          {matchedSessions.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-[#718096] uppercase tracking-wider px-2">
                Lecture Sessions
              </span>
              <div className="mt-1 space-y-1">
                {matchedSessions.slice(0, 3).map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => {
                      onSelectResult('session', sess.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-[#17252F]">
                        <QrCode size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#17252F]">{sess.topic}</span>
                        <p className="text-[11px] text-[#718096]">{sess.venue} • {sess.lectureDate}</p>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedCourses.length === 0 && matchedStudents.length === 0 && matchedSessions.length === 0 && (
            <div className="p-8 text-center text-xs text-[#718096]">
              No matching courses, students, or sessions found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
