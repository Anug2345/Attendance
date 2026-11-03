/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Download,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter;
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
          Compliance & Security Ledger
        </span>
        <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Institutional Audit Logs</h2>
        <p className="text-xs text-[#718096]">
          Tamper-evident system trail recording all session initiations, electronic check-ins, manual modifications, and appeal decisions.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8EDF0] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, action type, or audit note..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none focus:border-[#006D77]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-[#E8EDF0] rounded-xl focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="lecturer">Lecturers</option>
            <option value="student">Students</option>
          </select>
        </div>

        <span className="text-xs text-[#718096]">Showing {filteredLogs.length} audit entries</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-[#E8EDF0] text-[#718096] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Authorized Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Security Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Audit Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDF0]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#17252F]">
                    {log.actorName}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="text-[11px] font-semibold text-[#718096]">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[11px] text-[#006D77]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-[#718096] font-mono text-[11px]">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3 px-4 text-[#17252F] max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
