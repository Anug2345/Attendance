/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const UserDirectory: React.FC = () => {
  const { allUsers, loginAs } = useAuth();
  const { studentProfiles, lecturerProfiles, departments, levels } = useAttendance();

  const [activeTab, setActiveTab] = useState<'students' | 'lecturers'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Student directory list
  const studentRows = studentProfiles.map((prof) => {
    const user = allUsers.find((u) => u.id === prof.userId);
    const dept = departments.find((d) => d.id === prof.departmentId);
    const lvl = levels.find((l) => l.id === prof.levelId);

    return {
      id: prof.id,
      userId: prof.userId,
      matric: prof.matricNumber,
      fullName: user?.fullName || 'Student',
      email: user?.email || '',
      avatar: user?.avatarUrl,
      department: dept?.name || 'Computer Science',
      deptId: prof.departmentId,
      level: lvl?.name || '400 Level',
      admissionYear: prof.admissionYear,
      status: prof.academicStatus,
    };
  });

  // Lecturer directory list
  const lecturerRows = lecturerProfiles.map((prof) => {
    const user = allUsers.find((u) => u.id === prof.userId);
    const dept = departments.find((d) => d.id === prof.departmentId);

    return {
      id: prof.id,
      userId: prof.userId,
      staffId: prof.staffId,
      fullName: user?.fullName || 'Lecturer',
      email: user?.email || '',
      avatar: user?.avatarUrl,
      designation: prof.designation,
      department: dept?.name || 'Computer Science',
      deptId: prof.departmentId,
      office: prof.officeLocation || 'Main Academic Block',
    };
  });

  const filteredStudents = studentRows.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || s.deptId === deptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredLecturers = lecturerRows.filter((l) => {
    const matchesSearch =
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || l.deptId === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
            Institutional Registry
          </span>
          <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">University User Directory</h2>
          <p className="text-xs text-[#718096]">
            Comprehensive registry of registered students, faculty members, and academic credentials.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E8EDF0] bg-white rounded-2xl p-2 gap-2 text-xs font-semibold shadow-2xs">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'students' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <GraduationCap size={15} />
          <span>Registered Students ({studentProfiles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('lecturers')}
          className={`py-2 px-4 rounded-xl transition-colors flex items-center gap-2 ${
            activeTab === 'lecturers' ? 'bg-[#006D77] text-white shadow-xs' : 'text-[#718096] hover:bg-slate-50'
          }`}
        >
          <Briefcase size={15} />
          <span>Academic Lecturers ({lecturerProfiles.length})</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, matriculation no, staff ID, email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Filter size={14} />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none text-[#17252F]"
            >
              <option value="all">All Academic Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code}: {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-4">Matriculation No.</th>
                  <th className="py-3 px-4">Department & Level</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Academic Status</th>
                  <th className="py-3 px-4 text-right">Switch / Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF0]">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.fullName}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-[#17252F]">{student.fullName}</p>
                          <p className="text-[10px] text-slate-400">Class of {student.admissionYear + 4}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#006D77]">
                      {student.matric}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#17252F] font-medium">{student.department}</div>
                      <div className="text-[10px] text-[#718096]">{student.level}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {student.email}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <Badge variant={student.status === 'good_standing' ? 'success' : 'warning'} size="sm">
                        {student.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => loginAs(student.userId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-lg transition-colors"
                      >
                        Login As
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lecturers Table */}
      {activeTab === 'lecturers' && (
        <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Office Room</th>
                  <th className="py-3 px-4 text-right">Switch / Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF0]">
                {filteredLecturers.map((lec) => (
                  <tr key={lec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={lec.avatar}
                          alt={lec.fullName}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-[#17252F]">{lec.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{lec.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#006D77]">
                      {lec.staffId}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#17252F]">
                      {lec.designation}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">
                      {lec.department}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {lec.office}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => loginAs(lec.userId)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-lg transition-colors"
                      >
                        Login As
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
