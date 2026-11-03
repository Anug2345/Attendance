/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  QrCode,
  ShieldCheck,
  UserPlus,
  Check,
  X,
  Clock,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Course, StudentProfile } from '../../types';
import { Modal } from '../common/Modal';

interface LecturerCoursesManagerProps {
  onStartSession?: (courseId: string) => void;
  onOpenTimetable?: () => void;
  onOpenLedger?: (courseId: string) => void;
}

export const LecturerCoursesManager: React.FC<LecturerCoursesManagerProps> = ({
  onStartSession,
  onOpenTimetable,
  onOpenLedger,
}) => {
  const { currentUser } = useAuth();
  const {
    courses,
    departments,
    faculties,
    levels,
    semesters,
    academicSessions,
    enrollments,
    studentProfiles,
    allUsers,
    addCourse,
    updateCourse,
    deleteCourse,
    enrollStudent,
    bulkEnrollStudents,
  } = useAttendance();

  // Filter courses assigned to this lecturer (or all courses if admin)
  const lecturerCourses = useMemo(() => {
    if (currentUser?.role === 'admin') return courses;
    return courses.filter((c) =>
      c.assignedLecturerIds?.includes(currentUser?.id || '')
    );
  }, [courses, currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<Course | null>(null);

  // Add / Edit Course Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [creditUnits, setCreditUnits] = useState(3);
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [levelId, setLevelId] = useState(levels[2]?.id || 'lvl_300');
  const [description, setDescription] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Student to Course Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentToEnrollId, setStudentToEnrollId] = useState('');
  const [bulkMatricText, setBulkMatricText] = useState('');

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return lecturerCourses.filter(
      (c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lecturerCourses, searchQuery]);

  const openCreateModal = () => {
    setEditingCourseId(null);
    setCourseCode('');
    setCourseTitle('');
    setCreditUnits(3);
    setDeptId(departments[0]?.id || '');
    setLevelId(levels[2]?.id || 'lvl_300');
    setDescription('');
    setIsCourseModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseCode(c.code);
    setCourseTitle(c.title);
    setCreditUnits(c.creditUnits);
    setDeptId(c.departmentId);
    setLevelId(c.levelId);
    setDescription(c.description || '');
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle) return;

    const dept = departments.find((d) => d.id === deptId);

    if (editingCourseId) {
      updateCourse(editingCourseId, {
        code: courseCode.toUpperCase().trim(),
        title: courseTitle.trim(),
        creditUnits: Number(creditUnits),
        departmentId: deptId,
        levelId,
        description: description.trim(),
      });
      setSuccessToast(`Course ${courseCode.toUpperCase()} was successfully updated.`);
    } else {
      const newCourse = addCourse({
        code: courseCode.toUpperCase().trim(),
        title: courseTitle.trim(),
        description: description.trim() || 'Institutional lecture course module.',
        creditUnits: Number(creditUnits),
        facultyId: dept?.facultyId || faculties[0]?.id || 'fac_cict',
        departmentId: deptId,
        levelId,
        semesterId: semesters.find((s) => s.isCurrent)?.id || 'sem_first_2026',
        sessionId: academicSessions.find((s) => s.isCurrent)?.id || 'sess_2026_2027',
        assignedLecturerIds: currentUser?.id ? [currentUser.id] : ['usr_lec_samuel'],
      });

      // Auto-enroll some sample students for realistic instant testing
      const eligibleStudents = studentProfiles.slice(0, 5).map((s) => s.id);
      bulkEnrollStudents(newCourse.id, eligibleStudents);

      setSuccessToast(`Course ${courseCode.toUpperCase()} has been set up for your teaching portfolio.`);
    }

    setIsCourseModalOpen(false);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Enrolled students for selected course
  const enrolledStudentProfiles = useMemo(() => {
    if (!selectedCourseForEnrollment) return [];
    const courseEnrolls = enrollments.filter(
      (e) => e.courseId === selectedCourseForEnrollment.id && e.status === 'enrolled'
    );
    const enrolledIds = new Set(courseEnrolls.map((e) => e.studentId));
    return studentProfiles
      .filter((s) => enrolledIds.has(s.id))
      .sort((a, b) => (a.matricNumber || '').localeCompare(b.matricNumber || ''));
  }, [selectedCourseForEnrollment, enrollments, studentProfiles]);

  const handleEnrollSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnrollment || !studentToEnrollId) return;

    enrollStudent(selectedCourseForEnrollment.id, studentToEnrollId);
    setStudentToEnrollId('');
    setSuccessToast('Student successfully enrolled into course.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleBulkEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnrollment || !bulkMatricText) return;

    // Parse matric numbers e.g. 22040401001, 22040401002
    const lines = bulkMatricText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const matchedIds = studentProfiles
      .filter((sp) => lines.includes(sp.matricNumber))
      .map((sp) => sp.id);

    if (matchedIds.length > 0) {
      bulkEnrollStudents(selectedCourseForEnrollment.id, matchedIds);
      setSuccessToast(`Enrolled ${matchedIds.length} students into ${selectedCourseForEnrollment.code}.`);
    } else {
      setSuccessToast('No matching registered students found for the entered matric numbers.');
    }

    setBulkMatricText('');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
              Lecturer Course Management
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {currentUser?.fullName} ({lecturerCourses.length} Assigned Courses)
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">
            My Courses & Curriculum
          </h2>
          <p className="text-xs text-[#718096]">
            Configure and set your lecture courses, update syllabus details, and manage enrolled student rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs shrink-0"
        >
          <Plus size={16} />
          <span>Set Up New Course</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code or title..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredCourses.length} of {lecturerCourses.length} courses
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const dept = departments.find((d) => d.id === course.departmentId);
          const lvl = levels.find((l) => l.id === course.levelId);
          const enrolledCount = enrollments.filter(
            (e) => e.courseId === course.id && e.status === 'enrolled'
          ).length;

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-[#E8EDF0] hover:border-[#006D77]/40 transition shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold bg-[#006D77]/10 text-[#006D77] px-2.5 py-1 rounded-lg">
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(course)}
                      className="p-1.5 text-slate-400 hover:text-[#006D77] rounded-lg hover:bg-slate-100 transition"
                      title="Edit Course Settings"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${course.code}?`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#17252F] mt-2.5 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-[11px] text-[#718096] mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'Institutional university module.'}
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Credit Units</span>
                    <span className="font-bold text-slate-900">{course.creditUnits} Units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Level</span>
                    <span className="font-semibold text-slate-900">{lvl?.name || '300 Level'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Department</span>
                    <span className="font-medium text-slate-800 truncate block">{dept?.name || 'Computer Science'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
                    <span className="font-bold text-[#006D77] flex items-center gap-1">
                      <Users size={12} /> {enrolledCount} Students
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseForEnrollment(course)}
                    className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Users size={13} />
                    <span>Roster ({enrolledCount})</span>
                  </button>
                  {onOpenTimetable && (
                    <button
                      type="button"
                      onClick={onOpenTimetable}
                      className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Calendar size={13} />
                      <span>Timetable</span>
                    </button>
                  )}
                </div>

                {onStartSession && (
                  <button
                    type="button"
                    onClick={() => onStartSession(course.id)}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={14} />
                    <span>Start Attendance Session</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#E8EDF0]">
          <BookOpen size={36} className="mx-auto text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-[#17252F]">No Courses Found</h4>
          <p className="text-xs text-[#718096] mt-1 mb-4">
            You currently have no courses matching this search. Set up your first course to begin.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold text-white bg-[#006D77] rounded-xl hover:bg-[#00555D] transition"
          >
            Create Lecture Course
          </button>
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourseId ? 'Edit Course Settings' : 'Set Up New Course'}
        subtitle="Define course details, syllabus, and academic specifications"
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Code</label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CSC 301"
                className="w-full px-3 py-2 text-xs uppercase font-mono font-bold bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                required
                value={creditUnits}
                onChange={(e) => setCreditUnits(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Title</label>
            <input
              type="text"
              required
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. Operating Systems Architecture"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Department</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}: {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Study Level</label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Description & Syllabus</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of curriculum, learning objectives, and attendance prerequisites..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsCourseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition shadow-xs"
            >
              {editingCourseId ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ENROLLED STUDENTS ROSTER MODAL */}
      {selectedCourseForEnrollment && (
        <Modal
          isOpen={Boolean(selectedCourseForEnrollment)}
          onClose={() => setSelectedCourseForEnrollment(null)}
          title={`Enrolled Students: ${selectedCourseForEnrollment.code}`}
          subtitle={`${selectedCourseForEnrollment.title} (${enrolledStudentProfiles.length} Enrolled)`}
        >
          <div className="space-y-4">
            {/* Quick Single Enroll Form */}
            <form onSubmit={handleEnrollSingleStudent} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-2">
              <select
                value={studentToEnrollId}
                onChange={(e) => setStudentToEnrollId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="">Select student from university registry...</option>
                {studentProfiles
                  .filter((sp) => !enrolledStudentProfiles.some((ep) => ep.id === sp.id))
                  .map((sp) => {
                    const u = allUsers.find((user) => user.id === sp.userId);
                    return (
                      <option key={sp.id} value={sp.id}>
                        {sp.matricNumber} - {u?.fullName}
                      </option>
                    );
                  })}
              </select>
              <button
                type="submit"
                disabled={!studentToEnrollId}
                className="px-3 py-2 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] disabled:bg-slate-300 rounded-lg transition"
              >
                Enroll
              </button>
            </form>

            {/* Bulk Enrollment Accordion */}
            <details className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <summary className="font-semibold text-slate-800 cursor-pointer">
                Bulk Enroll by Matric Numbers (e.g. 22040401001, 22040401002...)
              </summary>
              <form onSubmit={handleBulkEnrollment} className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={bulkMatricText}
                  onChange={(e) => setBulkMatricText(e.target.value)}
                  placeholder="Paste matric numbers separated by comma or new lines..."
                  className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!bulkMatricText.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#006D77] rounded-lg disabled:bg-slate-300"
                >
                  Process Bulk Enrolment
                </button>
              </form>
            </details>

            {/* Students Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Matriculation No.</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudentProfiles.map((student, idx) => {
                    const u = allUsers.find((user) => user.id === student.userId);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#006D77]">
                          {student.matricNumber}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {u?.fullName}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-[10px] font-bold text-[#20B486] bg-[#20B486]/10 px-2 py-0.5 rounded">
                            Enrolled
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCourseForEnrollment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Roster
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
