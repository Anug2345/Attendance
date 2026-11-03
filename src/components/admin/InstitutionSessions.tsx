/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Filter,
  CheckSquare,
  Clock,
  Calendar,
  Building,
  User,
  Users,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';

interface InstitutionSessionsProps {
  onInspectSession?: (sessionId: string) => void;
}

export const InstitutionSessions: React.FC<InstitutionSessionsProps> = ({
  onInspectSession,
}) => {
  const { attendanceSessions, courses, allUsers, attendanceRecords } = useAttendance();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = attendanceSessions.filter((s) => {
    const course = courses.find((c) => c.id === s.courseId);
    const matchesStatus = statusFilter === 'all' || s.sessionStatus === statusFilter;
    const matchesMethod = methodFilter === 'all' || s.attendanceMethod === methodFilter;
    const matchesSearch =
      (course?.code.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.venue.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
          Master Session Control
        </span>
        <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">University Attendance Sessions</h2>
        <p className="text-xs text-[#718096]">
          Real-time institutional monitor of all lecture attendance sessions conducted across departments.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code, lecture topic, venue..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none"
          >
            <option value="all">All Session States</option>
            <option value="active">Active (Live Check-In)</option>
            <option value="closed">Closed / Locked</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none"
          >
            <option value="all">All Attendance Methods</option>
            <option value="qr">Dynamic QR Sessions</option>
            <option value="manual">Manual Ledger Rosters</option>
          </select>
        </div>

        <span className="text-xs text-[#718096]">
          Showing {filteredSessions.length} sessions
        </span>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Topic / Module</th>
                <th className="py-3 px-4">Lecturer</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-center">Check-In Progress</th>
                <th className="py-3 px-4 text-right">Session State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {filteredSessions.map((session) => {
                const course = courses.find((c) => c.id === session.courseId);
                const lecturer = allUsers.find((u) => u.id === session.lecturerId);
                const records = attendanceRecords.filter((r) => r.sessionId === session.id);
                const isLive = session.sessionStatus === 'active';

                return (
                  <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#17252F]">{session.lectureDate}</div>
                      <div className="text-[10px] text-[#718096]">{session.startTime} - {session.endTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#006D77]">{course?.code}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#17252F]">
                      {session.topic}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">
                      {lecturer?.fullName || 'Faculty'}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">{session.venue}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {session.attendanceMethod === 'qr' ? <QrCode size={11} /> : <CheckSquare size={11} />}
                        {session.attendanceMethod.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block text-left">
                        <span className="font-bold text-[#17252F]">
                          {records.length} / {session.enrolledCount}
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-[#20B486] h-full rounded-full"
                            style={{
                              width: `${session.enrolledCount > 0 ? (records.length / session.enrolledCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#20B486]/10 text-[#20B486] font-bold text-xs rounded-lg border border-[#20B486]/30 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#20B486]" />
                          ACTIVE
                        </span>
                      ) : session.sessionStatus === 'closed' ? (
                        <Badge variant="neutral">CLOSED</Badge>
                      ) : (
                        <Badge variant="danger">CANCELLED</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
