/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  Search,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const CoursesManager: React.FC = () => {
  const {
    courses,
    departments,
    faculties,
    levels,
    semesters,
    academicSessions,
    enrollments,
    studentProfiles,
    lecturerProfiles,
    allUsers,
    addCourse,
    updateCourse,
    deleteCourse,
    bulkEnrollStudents,
  } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string | null>(null);

  // Add course modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newUnits, setNewUnits] = useState(3);
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id || '');
  const [newLevelId, setNewLevelId] = useState(levels[3]?.id || 'lvl_400');
  const [newDescription, setNewDescription] = useState('');
  const [newLecturerId, setNewLecturerId] = useState('usr_lec_samuel');

  // Bulk enrolment modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMatricInput, setBulkMatricInput] = useState('');
  const [bulkSuccessNotice, setBulkSuccessNotice] = useState<string | null>(null);

  const filteredCourses = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const dept = departments.find((d) => d.id === newDeptId);

    addCourse({
      code: newCode.toUpperCase().trim(),
      title: newTitle.trim(),
      description: newDescription.trim() || 'Institutional lecture course module.',
      creditUnits: Number(newUnits),
      facultyId: dept?.facultyId || faculties[0]?.id || '',
      departmentId: newDeptId,
      levelId: newLevelId,
      semesterId: semesters.find((s) => s.isCurrent)?.id || 'sem_first_2026',
      sessionId: academicSessions.find((s) => s.isCurrent)?.id || 'sess_2026_2027',
      assignedLecturerIds: newLecturerId ? [newLecturerId] : [],
    });

    setIsAddModalOpen(false);
    setNewCode('');
    setNewTitle('');
    setNewDescription('');
  };

  const handleBulkEnrol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnrollment) return;

    // Parse matric numbers separated by commas, newlines, or tabs
    const enteredMatrics = bulkMatricInput
      .split(/[\n,;\t]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    // Find student profile IDs matching these matric numbers
    const matchedStudentIds: string[] = [];
    enteredMatrics.forEach((matric) => {
      const found = studentProfiles.find(
        (p) => p.matricNumber.toLowerCase() === matric.toLowerCase()
      );
      if (found) {
        matchedStudentIds.push(found.id);
      }
    });

    if (matchedStudentIds.length === 0) {
      // Fallback: if user pasted generic IDs or all students, enroll all available students
      const allStudentIds = studentProfiles.map((s) => s.id);
      bulkEnrollStudents(selectedCourseForEnrollment, allStudentIds);
      setBulkSuccessNotice(`Enrolled ${allStudentIds.length} registered students into course roster.`);
    } else {
      bulkEnrollStudents(selectedCourseForEnrollment, matchedStudentIds);
      setBulkSuccessNotice(
        `Successfully verified & enrolled ${matchedStudentIds.length} students into course roster.`
      );
    }

    setIsBulkModalOpen(false);
    setBulkMatricInput('');
    setTimeout(() => setBulkSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
            Curriculum & Registration
          </span>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Courses & Enrolment Manager</h2>
          <p className="text-xs text-[#718096]">
            Configure accredited courses, assign lead lecturers, and manage student batch enrolments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
        >
          <Plus size={15} />
          <span>Add New Course</span>
        </button>
      </div>

      {bulkSuccessNotice && (
        <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{bulkSuccessNotice}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code or title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
          />
        </div>
        <span className="text-xs text-[#718096]">Showing {filteredCourses.length} accredited courses</span>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => {
          const dept = departments.find((d) => d.id === course.departmentId);
          const lvl = levels.find((l) => l.id === course.levelId);
          const enrolledCount = enrollments.filter(
            (e) => e.courseId === course.id && e.status === 'enrolled'
          ).length;
          const assignedLecturers = allUsers.filter((u) =>
            course.assignedLecturerIds.includes(u.id)
          );

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                    {course.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{course.creditUnits} Units</span>
                </div>

                <h3 className="text-sm font-bold text-[#17252F] mt-2 line-clamp-1">{course.title}</h3>
                <p className="text-[11px] text-[#718096] mt-1 line-clamp-2">{course.description}</p>

                <div className="mt-3 space-y-1 text-[11px] text-[#718096]">
                  <p>Department: <strong className="text-[#17252F]">{dept?.name}</strong></p>
                  <p>Level: <strong className="text-[#17252F]">{lvl?.name}</strong></p>
                  <p>
                    Lecturer:{' '}
                    <strong className="text-[#006D77]">
                      {assignedLecturers.map((l) => l.fullName).join(', ') || 'Unassigned'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E8EDF0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17252F] flex items-center gap-1.5">
                  <Users size={14} className="text-[#006D77]" /> {enrolledCount} Enrolled
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedCourseForEnrollment(course.id);
                      setIsBulkModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <UserCheck size={13} />
                    <span>Enrol</span>
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="p-1 text-[#718096] hover:text-[#E45B64] rounded-md transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Accredited Course"
        subtitle="Register a new academic course into the institutional syllabus"
      >
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. CSC 421"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                value={newUnits}
                onChange={(e) => setNewUnits(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Cloud Virtualization & Infrastructure Security"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Department</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
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
              <label className="block text-xs font-semibold text-[#17252F] mb-1">Academic Level</label>
              <select
                value={newLevelId}
                onChange={(e) => setNewLevelId(e.target.value)}
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
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Assign Primary Lecturer</label>
            <select
              value={newLecturerId}
              onChange={(e) => setNewLecturerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            >
              {allUsers
                .filter((u) => u.role === 'lecturer')
                .map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.fullName} ({lec.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Course Description</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Outline course learning objectives and syllabus scope..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Enrolment Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Batch Student Course Enrolment"
        subtitle={`Enrol students in ${courses.find((c) => c.id === selectedCourseForEnrollment)?.code}`}
      >
        <form onSubmit={handleBulkEnrol} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-[#E8EDF0] rounded-xl text-xs space-y-1 text-[#718096]">
            <p className="font-semibold text-[#17252F]">Paste Student Matriculation Numbers</p>
            <p>
              Separate matriculation numbers with commas or line breaks. Leave blank or click "Enrol All Cohort" to automatically register all registered students in the department.
            </p>
          </div>

          <textarea
            rows={5}
            value={bulkMatricInput}
            onChange={(e) => setBulkMatricInput(e.target.value)}
            placeholder="22040401001&#10;22040401002&#10;22040401003"
            className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl font-mono focus:outline-none focus:border-[#006D77]"
          />

          <div className="flex justify-between items-center pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => {
                setBulkMatricInput(
                  studentProfiles.map((s) => s.matricNumber).join('\n')
                );
              }}
              className="text-xs text-[#006D77] font-semibold hover:underline"
            >
              Autofill All 6 Students
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
              >
                Confirm Enrolment
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
