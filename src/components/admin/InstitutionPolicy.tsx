/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

export const InstitutionPolicy: React.FC = () => {
  const { institution, updateInstitution } = useAttendance();

  const [threshold, setThreshold] = useState<number>(institution.defaultAttendanceThreshold || 75);
  const [lateWeight, setLateWeight] = useState<number>(institution.latePenaltyWeight ?? 0.5);
  const [countExcused, setCountExcused] = useState<boolean>(institution.countExcusedAsAttended ?? true);
  const [qrExpiry, setQrExpiry] = useState<number>(institution.qrTokenExpirySeconds || 30);
  const [allowAppeals, setAllowAppeals] = useState<boolean>(institution.allowStudentAppeals ?? true);
  const [successToast, setSuccessToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstitution({
      defaultAttendanceThreshold: Number(threshold),
      latePenaltyWeight: Number(lateWeight),
      countExcusedAsAttended: countExcused,
      qrTokenExpirySeconds: Number(qrExpiry),
      allowStudentAppeals: allowAppeals,
    });

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
          Institutional Governance
        </span>
        <h2 className="text-xl font-bold text-[#17252F] mt-1.5 tracking-tight">Attendance Policy & Rule Engine</h2>
        <p className="text-xs text-[#718096]">
          Configure the official institutional attendance thresholds, late penalty weightings, QR token rotation parameters, and appeal rules.
        </p>
      </div>

      {successToast && (
        <div className="p-3 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl text-xs text-[#20B486] font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Institutional attendance policies updated and applied across all academic cohorts.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs space-y-6">
        {/* Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-[#17252F]">
              Minimum Lecture Attendance Threshold for Exam Clearance
            </label>
            <span className="text-sm font-extrabold text-[#006D77] font-mono">{threshold}%</span>
          </div>
          <p className="text-xs text-[#718096]">
            Students whose attendance falls below this benchmark are flagged as exam-ineligible.
          </p>
          <input
            type="range"
            min={50}
            max={90}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#006D77]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>50%</span>
            <span>70% (Standard)</span>
            <span>75% (Recommended)</span>
            <span>85%</span>
            <span>90% (Strict)</span>
          </div>
        </div>

        {/* Late Arrival Policy */}
        <div className="pt-4 border-t border-[#E8EDF0] space-y-2">
          <label className="block text-xs font-bold text-[#17252F]">
            Late Arrival Attendance Credit Weight
          </label>
          <p className="text-xs text-[#718096]">
            Configure how late student check-ins count toward attended lecture totals.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLateWeight(1.0)}
              className={`p-3 rounded-xl border text-center transition-all ${
                lateWeight === 1.0
                  ? 'border-[#006D77] bg-[#006D77]/10 text-[#006D77] font-bold'
                  : 'border-[#E8EDF0] text-[#718096]'
              }`}
            >
              <div className="text-xs">Full Credit (1.0)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Counts as 100% Attended</div>
            </button>

            <button
              type="button"
              onClick={() => setLateWeight(0.5)}
              className={`p-3 rounded-xl border text-center transition-all ${
                lateWeight === 0.5
                  ? 'border-[#006D77] bg-[#006D77]/10 text-[#006D77] font-bold'
                  : 'border-[#E8EDF0] text-[#718096]'
              }`}
            >
              <div className="text-xs">Half Credit (0.5)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Counts as 50% Attended</div>
            </button>

            <button
              type="button"
              onClick={() => setLateWeight(0.0)}
              className={`p-3 rounded-xl border text-center transition-all ${
                lateWeight === 0.0
                  ? 'border-[#006D77] bg-[#006D77]/10 text-[#006D77] font-bold'
                  : 'border-[#E8EDF0] text-[#718096]'
              }`}
            >
              <div className="text-xs">Zero Credit (0.0)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Treated as Absent</div>
            </button>
          </div>
        </div>

        {/* Excused Absences */}
        <div className="pt-4 border-t border-[#E8EDF0] space-y-2">
          <label className="block text-xs font-bold text-[#17252F]">
            Excused Absence Policy Handling
          </label>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="excusedCheckbox"
              checked={countExcused}
              onChange={(e) => setCountExcused(e.target.checked)}
              className="w-4 h-4 accent-[#006D77] rounded"
            />
            <label htmlFor="excusedCheckbox" className="text-xs text-[#17252F] font-medium cursor-pointer">
              Count approved student absence excuses as fully attended (100% presence) in the institutional formula.
            </label>
          </div>
        </div>

        {/* Dynamic QR Rotation Duration */}
        <div className="pt-4 border-t border-[#E8EDF0] space-y-2">
          <label className="block text-xs font-bold text-[#17252F]">
            Dynamic Cryptographic QR Token Validity & Rotation Cycle
          </label>
          <p className="text-xs text-[#718096]">
            Controls the frequency at which projected QR tokens refresh to prevent proxy attendance and screenshot distribution.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[15, 30, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setQrExpiry(sec)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  qrExpiry === sec
                    ? 'border-[#006D77] bg-[#006D77]/10 text-[#006D77] font-bold'
                    : 'border-[#E8EDF0] text-[#718096]'
                }`}
              >
                <div className="text-xs">{sec} Seconds</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {sec === 30 ? 'Recommended Standard' : sec === 15 ? 'High Security' : 'Relaxed'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Student Appeals Policy */}
        <div className="pt-4 border-t border-[#E8EDF0] space-y-2">
          <label className="block text-xs font-bold text-[#17252F]">
            Online Student Attendance Correction Appeals
          </label>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="appealsCheckbox"
              checked={allowAppeals}
              onChange={(e) => setAllowAppeals(e.target.checked)}
              className="w-4 h-4 accent-[#006D77] rounded"
            />
            <label htmlFor="appealsCheckbox" className="text-xs text-[#17252F] font-medium cursor-pointer">
              Permit students to submit formal digital absence appeals with medical or official justification.
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-[#E8EDF0]">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
          >
            <Save size={15} />
            <span>Save Institutional Policies</span>
          </button>
        </div>
      </form>
    </div>
  );
};
