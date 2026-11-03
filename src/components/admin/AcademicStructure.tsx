/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Building, Plus, Layers, Calendar, Clock, MapPin, Trash2, CheckCircle2 } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface AcademicStructureProps {
  initialTab?: 'faculties' | 'departments' | 'sessions' | 'levels' | 'timetables';
}

export const AcademicStructure: React.FC<AcademicStructureProps> = ({ initialTab = 'faculties' }) => {
  const {
    faculties,
    departments,
    academicSessions,
    semesters,
    levels,
    timetables,
    courses,
    allUsers,
    addFaculty,
    addDepartment,
    deleteTimetableSlot,
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'faculties' | 'departments' | 'sessions' | 'levels' | 'timetables'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Faculty modal
  const [isFacModalOpen, setIsFacModalOpen] = useState(false);
  const [facCode, setFacCode] = useState('');
  const [facName, setFacName] = useState('');
  const [facDean, setFacDean] = useState('');

  // Department modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptFacultyId, setDeptFacultyId] = useState(faculties[0]?.id || '');
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptHod, setDeptHod] = useState('');

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facCode || !facName) return;

    addFaculty({
      code: facCode.toUpperCase(),
      name: facName,
      deanName: facDean || 'Appointed Dean',
      active: true,
    });

    setIsFacModalOpen(false);
    setFacCode('');
    setFacName('');
    setFacDean('');
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode || !deptName) return;

    addDepartment({
      facultyId: deptFacultyId,
      code: deptCode.toUpperCase(),
      name: deptName,
      headOfDepartment: deptHod || 'Appointed HOD',
      active: true,
    });

    setIsDeptModalOpen(false);
    setDeptCode('');
    setDeptName('');
    setDeptHod('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
            Institutional Hierarchy
          </span>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Academic Structure Management</h2>
          <p className="text-xs text-[#718096]">
            Configure university faculties, academic departments, sessions, semesters, and study levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'faculties' && (
            <button
              onClick={() => setIsFacModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Add Faculty</span>
            </button>
          )}
          {activeTab === 'departments' && (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8EDF0] bg-white rounded-2xl p-2 gap-2 text-xs font-semibold shadow-2xs">
        <button
          onClick={() => setActiveTab('faculties')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'faculties' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <Building size={14} />
          <span>Faculties ({faculties.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'departments' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <Layers size={14} />
          <span>Departments ({departments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'sessions' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <Calendar size={14} />
          <span>Sessions & Semesters</span>
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'levels' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <span>Academic Levels</span>
        </button>
        <button
          onClick={() => setActiveTab('timetables')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'timetables' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <Clock size={14} />
          <span>Timetable Schedules ({timetables.length})</span>
        </button>
      </div>

      {/* TAB 1: Faculties */}
      {activeTab === 'faculties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faculties.map((fac) => {
            const facDepts = departments.filter((d) => d.facultyId === fac.id);
            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                      {fac.code}
                    </span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-[#17252F] mt-2">{fac.name}</h3>
                  <p className="text-xs text-[#718096] mt-1">Dean: {fac.deanName}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8EDF0] text-xs text-[#718096] flex justify-between items-center">
                  <span>{facDepts.length} Constituent Departments</span>
                  <span className="text-[#006D77] font-semibold">Configured</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const parentFaculty = faculties.find((f) => f.id === dept.facultyId);
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl p-5 border border-[#E8EDF0] shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    <span className="text-[11px] text-[#718096]">{parentFaculty?.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#17252F] mt-2">{dept.name}</h3>
                  <p className="text-xs text-[#718096] mt-1">HOD: {dept.headOfDepartment}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8EDF0] text-[11px] text-[#718096]">
                  Faculty: {parentFaculty?.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Academic Sessions & Semesters */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#17252F]">Academic Sessions</h3>
            <div className="space-y-3">
              {academicSessions.map((s) => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-[#E8EDF0] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#17252F] text-sm">{s.name}</span>
                      {s.isCurrent && <Badge variant="success">Current Academic Year</Badge>}
                    </div>
                    <span className="text-xs text-[#718096]">{s.startDate} to {s.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#17252F]">Semesters</h3>
            <div className="space-y-3">
              {semesters.map((sem) => (
                <div key={sem.id} className="p-4 bg-slate-50 rounded-xl border border-[#E8EDF0] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#17252F] text-sm">{sem.name}</span>
                      {sem.isCurrent && <Badge variant="success">Current Term</Badge>}
                    </div>
                    <span className="text-xs text-[#718096]">{sem.startDate} to {sem.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Academic Levels */}
      {activeTab === 'levels' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {levels.map((lvl) => (
            <div key={lvl.id} className="bg-white p-5 rounded-2xl border border-[#E8EDF0] shadow-2xs text-center">
              <span className="text-2xl font-extrabold text-[#006D77] font-mono">{lvl.code}</span>
              <p className="text-xs font-bold text-[#17252F] mt-1">{lvl.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Timetable Schedules */}
      {activeTab === 'timetables' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8EDF0] bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17252F]">Institutional Master Timetable</h3>
              <p className="text-xs text-[#718096]">Scheduled lecture slots, venues, and assigned academic instructors</p>
            </div>
            <span className="text-xs font-semibold text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
              {timetables.length} Timetable Slots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Day of Week</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Lecturer</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF0]">
                {timetables.map((slot) => {
                  const course = courses.find((c) => c.id === slot.courseId);
                  const lecturer = allUsers.find((u) => u.id === slot.lecturerId);

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#17252F]">{slot.dayOfWeek}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#006D77]">{course?.code}</span>
                        <span className="text-[11px] text-[#718096] block">{course?.title}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#17252F]">
                        {lecturer?.fullName || 'Assigned Faculty'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#718096]">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="py-3.5 px-4 text-[#718096]">{slot.venue}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteTimetableSlot(slot.id)}
                          className="p-1 text-slate-400 hover:text-[#E45B64] rounded transition-colors"
                          title="Remove Slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isFacModalOpen}
        onClose={() => setIsFacModalOpen(false)}
        title="Register New Faculty"
        subtitle="Add an academic faculty to the university registry"
      >
        <form onSubmit={handleAddFaculty} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Faculty Code</label>
            <input
              type="text"
              required
              value={facCode}
              onChange={(e) => setFacCode(e.target.value)}
              placeholder="e.g. FEAS"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Faculty Name</label>
            <input
              type="text"
              required
              value={facName}
              onChange={(e) => setFacName(e.target.value)}
              placeholder="e.g. Faculty of Environmental Design"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Dean's Full Name</label>
            <input
              type="text"
              value={facDean}
              onChange={(e) => setFacDean(e.target.value)}
              placeholder="e.g. Prof. Olumide Johnson"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsFacModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors"
            >
              Create Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Register New Academic Department"
        subtitle="Associate department under an institutional faculty"
      >
        <form onSubmit={handleAddDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Parent Faculty</label>
            <select
              value={deptFacultyId}
              onChange={(e) => setDeptFacultyId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            >
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code}: {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Department Code</label>
            <input
              type="text"
              required
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. ARC"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Department Name</label>
            <input
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="e.g. Department of Architecture"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#17252F] mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              value={deptHod}
              onChange={(e) => setDeptHod(e.target.value)}
              placeholder="e.g. Dr. Ngozi Balogun"
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8EDF0]">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
