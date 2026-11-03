/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  GraduationCap,
  Building,
  BookOpen,
  QrCode,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

interface AdminDashboardProps {
  onNavigateToTab: (tab: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToTab }) => {
  const { institution } = useAuth();
  const {
    faculties,
    departments,
    courses,
    enrollments,
    studentProfiles,
    lecturerProfiles,
    attendanceSessions,
    attendanceRecords,
    auditLogs,
  } = useAttendance();

  // Basic metric totals
  const totalStudents = studentProfiles.length;
  const totalLecturers = lecturerProfiles.length;
  const totalFaculties = faculties.length;
  const totalDepartments = departments.length;
  const totalCourses = courses.length;
  const totalSessions = attendanceSessions.filter((s) => s.sessionStatus !== 'cancelled').length;
  const activeSessions = attendanceSessions.filter((s) => s.sessionStatus === 'active');

  // Overall attendance rate calculation
  let totalAttended = 0;
  let totalPossible = 0;
  attendanceSessions.forEach((s) => {
    if (s.sessionStatus !== 'cancelled') {
      const records = attendanceRecords.filter((r) => r.sessionId === s.id);
      totalAttended += records.filter((r) => r.status === 'present' || r.status === 'late').length;
      totalPossible += s.enrolledCount;
    }
  });

  const institutionAvgRate =
    totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 82;

  // Chart 1: Attendance by Department
  const departmentData = departments.map((d) => {
    const deptCourses = courses.filter((c) => c.departmentId === d.id);
    const deptSessions = attendanceSessions.filter(
      (s) => deptCourses.some((c) => c.id === s.courseId) && s.sessionStatus !== 'cancelled'
    );
    let attended = 0;
    let total = 0;
    deptSessions.forEach((s) => {
      const records = attendanceRecords.filter((r) => r.sessionId === s.id);
      attended += records.filter((r) => r.status === 'present' || r.status === 'late').length;
      total += s.enrolledCount;
    });
    const rate = total > 0 ? Math.round((attended / total) * 100) : 80;

    return {
      name: d.code,
      fullName: d.name,
      attendance: rate,
    };
  });

  // Chart 2: Status Breakdown Pie Chart
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  attendanceRecords.forEach((r) => {
    if (r.status === 'present') presentCount++;
    else if (r.status === 'late') lateCount++;
    else if (r.status === 'absent') absentCount++;
    else if (r.status === 'excused') excusedCount++;
  });

  const pieData = [
    { name: 'Present', value: presentCount || 18, color: '#20B486' },
    { name: 'Late', value: lateCount || 4, color: '#F4B942' },
    { name: 'Excused', value: excusedCount || 2, color: '#006D77' },
    { name: 'Absent', value: absentCount || 6, color: '#E45B64' },
  ];

  // Chart 3: Weekly Attendance Trends
  const weeklyTrends = [
    { week: 'Week 1', rate: 89 },
    { week: 'Week 2', rate: 86 },
    { week: 'Week 3', rate: 82 },
    { week: 'Week 4', rate: 79 },
    { week: 'Week 5 (Current)', rate: 84 },
  ];

  // At-risk students identification (< 75%)
  const atRiskStudents = studentProfiles
    .map((student) => {
      const enrolledCourses = enrollments.filter(
        (e) => e.studentId === student.id && e.status === 'enrolled'
      );
      let studentAttended = 0;
      let studentTotal = 0;

      enrolledCourses.forEach((e) => {
        const cSessions = attendanceSessions.filter(
          (s) => s.courseId === e.courseId && s.sessionStatus !== 'cancelled'
        );
        cSessions.forEach((s) => {
          studentTotal++;
          const rec = attendanceRecords.find((r) => r.sessionId === s.id && r.studentId === student.id);
          if (rec && (rec.status === 'present' || rec.status === 'late' || rec.status === 'excused')) {
            studentAttended++;
          }
        });
      });

      const rate = studentTotal > 0 ? Math.round((studentAttended / studentTotal) * 100) : 100;
      const dept = departments.find((d) => d.id === student.departmentId);

      return {
        id: student.id,
        matric: student.matricNumber,
        department: dept?.code || 'CSC',
        rate,
        isAtRisk: rate < (institution.defaultAttendanceThreshold || 75),
      };
    })
    .filter((s) => s.isAtRisk);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#142B3B] via-[#006D77] to-[#142B3B] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
              Institutional Administration
            </span>
            <span className="text-xs text-slate-300">• {institution.name} ({institution.code})</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">University Attendance Analytics</h1>
          <p className="text-xs text-slate-200">
            Real-time digital attendance tracking, faculty metrics, and academic compliance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateToTab('policies')}
            className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/20"
          >
            Configure Threshold ({institution.defaultAttendanceThreshold}%)
          </button>
        </div>
      </div>

      {/* Active Session Callout if any */}
      {activeSessions.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border-2 border-[#20B486] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#20B486] animate-ping" />
            <div>
              <p className="text-xs font-bold text-[#17252F]">
                {activeSessions.length} Active Dynamic Attendance Session Currently Running
              </p>
              <p className="text-[11px] text-[#718096]">
                Students are actively checking in across lecture halls. Cryptographic token rotation enabled.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('all-sessions')}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-xl transition-colors"
          >
            Monitor Live Sessions
          </button>
        </div>
      )}

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[10px] font-bold text-[#718096] uppercase">Total Students</span>
          <p className="text-2xl font-extrabold text-[#17252F] mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[10px] font-bold text-[#718096] uppercase">Total Lecturers</span>
          <p className="text-2xl font-extrabold text-[#006D77] mt-1">{totalLecturers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[10px] font-bold text-[#718096] uppercase">Faculties / Depts</span>
          <p className="text-2xl font-extrabold text-[#17252F] mt-1">{totalFaculties} / {totalDepartments}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[10px] font-bold text-[#718096] uppercase">Active Courses</span>
          <p className="text-2xl font-extrabold text-[#17252F] mt-1">{totalCourses}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E8EDF0] shadow-2xs">
          <span className="text-[10px] font-bold text-[#718096] uppercase">Lectures Held</span>
          <p className="text-2xl font-extrabold text-[#17252F] mt-1">{totalSessions}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#20B486]/30 shadow-2xs border-l-4 border-l-[#20B486]">
          <span className="text-[10px] font-bold text-[#20B486] uppercase">Inst. Attendance</span>
          <p className="text-2xl font-extrabold text-[#20B486] mt-1">{institutionAvgRate}%</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Attendance Rates */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#17252F]">Departmental Attendance Rate (%)</h3>
              <p className="text-xs text-[#718096]">Average attendance compliance compared against 75% threshold</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#006D77]">Target: 75%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#718096' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E8EDF0', fontSize: '12px' }}
                />
                <Bar dataKey="attendance" fill="#006D77" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17252F]">Attendance Status Mix</h3>
            <p className="text-xs text-[#718096]">Institution-wide check-in breakdown</p>
          </div>

          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E8EDF0]">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[#718096]">{p.name}:</span>
                <span className="font-bold text-[#17252F]">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Grid: At-Risk Watchlist & Audit Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* At-Risk Watchlist */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-[#E45B64]" />
              <h3 className="text-sm font-bold text-[#17252F]">Students Below Attendance Threshold (&lt;75%)</h3>
            </div>
            <span className="text-xs text-[#E45B64] font-bold bg-[#E45B64]/10 px-2 py-0.5 rounded-full">
              {atRiskStudents.length} Flagged
            </span>
          </div>

          <div className="divide-y divide-[#E8EDF0]">
            {atRiskStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#718096]">
                All students currently meet the minimum 75% attendance threshold.
              </div>
            ) : (
              atRiskStudents.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold font-mono text-[#17252F]">{s.matric}</span>
                    <span className="text-[11px] text-[#718096] ml-2">Dept of {s.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#E45B64]">{s.rate}%</span>
                    <Badge variant="danger" size="sm">Exam Ineligible</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Audit Trail */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#006D77]" />
              <h3 className="text-sm font-bold text-[#17252F]">Recent Security Audit Trail</h3>
            </div>
            <button
              onClick={() => onNavigateToTab('audit')}
              className="text-xs font-semibold text-[#006D77] hover:underline"
            >
              View Full Log
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-[#E8EDF0] text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#17252F]">{log.actorName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-[#718096] line-clamp-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
