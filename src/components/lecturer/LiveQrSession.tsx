/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Maximize2,
  Minimize2,
  Users,
  CheckCircle2,
  Clock,
  RotateCw,
  XCircle,
  CheckSquare,
  AlertCircle,
  Copy,
  Check,
  Building,
  UserCheck,
  Printer,
  Smartphone,
  Lock,
  Unlock,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../common/Badge';
import { AttendanceStatus } from '../../types';

interface LiveQrSessionProps {
  sessionId?: string;
  onCloseSession?: () => void;
  onSwitchToManual?: (sessionId: string) => void;
}

export const LiveQrSession: React.FC<LiveQrSessionProps> = ({
  sessionId,
  onCloseSession,
  onSwitchToManual,
}) => {
  const {
    attendanceSessions,
    attendanceRecords,
    courses,
    studentProfiles,
    enrollments,
    institution,
    rotateQrTokenForSession,
    closeSession,
    checkInStudent,
    recordManualAttendanceForStudent,
  } = useAttendance();

  // Classroom modes when lecturers aren't using projectors
  const [activeDisplayMode, setActiveDisplayMode] = useState<'chalkboard' | 'podium' | 'placard' | 'rollcall'>('chalkboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCodeLocked, setIsCodeLocked] = useState(false); // Allows locking code so it doesn't rotate while students are copying it off the board
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [copiedCode, setCopiedCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const placardCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active session
  const activeSession = sessionId
    ? attendanceSessions.find((s) => s.id === sessionId)
    : attendanceSessions.find((s) => s.sessionStatus === 'active') || attendanceSessions[0];

  const course = courses.find((c) => c.id === activeSession?.courseId);

  // Get enrolled students for this course sorted sequentially by matriculation number
  const enrolledStudents = enrollments
    .filter((e) => e.courseId === activeSession?.courseId && e.status === 'enrolled')
    .map((e) => {
      const prof = studentProfiles.find((p) => p.id === e.studentId);
      return prof;
    })
    .filter(Boolean)
    .sort((a, b) => (a?.matricNumber || '').localeCompare(b?.matricNumber || ''));

  // Get records for this session
  const sessionRecords = attendanceRecords.filter((r) => r.sessionId === activeSession?.id);

  // Countdown and token rotation (disabled if lecturer locked the code for the chalkboard)
  useEffect(() => {
    if (!activeSession || activeSession.sessionStatus !== 'active' || isCodeLocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiresAt = activeSession.qrTokenExpiresAt || now + 60000;
      const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      setSecondsRemaining(left);

      if (left <= 0) {
        rotateQrTokenForSession(activeSession.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, rotateQrTokenForSession, isCodeLocked]);

  // Render QR Code onto Canvas for Podium & Placard
  useEffect(() => {
    if (!activeSession) return;

    const qrPayload = JSON.stringify({
      v: 1,
      s: activeSession.id,
      c: activeSession.courseId,
      i: activeSession.institutionId,
      t: activeSession.qrTokenGeneratedAt,
      tok: activeSession.qrSecretToken,
      code: activeSession.qrTokenPasscode,
    });

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: isFullscreen ? 340 : 250,
        margin: 2,
        color: {
          dark: '#142B3B',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      }).catch((err) => {
        console.error('QR Render Error:', err);
      });
    }

    if (placardCanvasRef.current) {
      QRCode.toCanvas(placardCanvasRef.current, qrPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#006D77',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      }).catch((err) => {
        console.error('Placard QR Error:', err);
      });
    }
  }, [activeSession, activeSession?.qrSecretToken, isFullscreen, activeDisplayMode]);

  const toggleFullscreen = () => {
    try {
      if (typeof document !== 'undefined' && containerRef.current) {
        if (!document.fullscreenElement && containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {
            setIsFullscreen((prev) => !prev);
          });
          setIsFullscreen(true);
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          setIsFullscreen((prev) => !prev);
        }
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleCopyCode = () => {
    if (!activeSession) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(activeSession.qrTokenPasscode).catch(() => {});
      }
    } catch {
      // ignore
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSimulateStudentScan = () => {
    if (!activeSession) return;
    // Find an enrolled student who hasn't checked in yet
    const checkedInIds = sessionRecords.map((r) => r.studentId);
    const pendingStudent = enrolledStudents.find((s) => s && !checkedInIds.includes(s.id));

    if (pendingStudent) {
      checkInStudent(activeSession.id, pendingStudent.id, activeSession.qrTokenPasscode);
    }
  };

  const handleQuickMarkRollCall = (studentId: string, status: AttendanceStatus) => {
    if (!activeSession) return;
    recordManualAttendanceForStudent({
      sessionId: activeSession.id,
      studentId,
      status,
      lecturerName: 'Dr. Samuel Vance',
      notes: 'Quick roll call in lecture hall',
    });
  };

  const handlePrintPlacard = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!activeSession) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E8EDF0]">
        <AlertCircle size={32} className="mx-auto text-[#718096] mb-3" />
        <h3 className="text-base font-bold text-[#17252F]">No Active Attendance Session</h3>
        <p className="text-xs text-[#718096] mt-1 mb-4">
          Start a new session from your courses or dashboard to open lecture hall attendance.
        </p>
      </div>
    );
  }

  const attendancePercentage =
    activeSession.enrolledCount > 0
      ? Math.round((sessionRecords.length / activeSession.enrolledCount) * 100)
      : 0;

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 p-6 md:p-10 bg-slate-900 text-white rounded-none border-0' : ''
      }`}
    >
      {/* Top Banner with University Header */}
      <div
        className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
          isFullscreen ? 'border-slate-800 bg-slate-900/95' : 'border-[#E8EDF0] bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-[#20B486] animate-pulse shrink-0"></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-base font-extrabold ${isFullscreen ? 'text-white' : 'text-[#17252F]'}`}>
                {course?.code}: {course?.title}
              </span>
              <Badge variant="success">ATTENDANCE OPEN</Badge>
              <span className="text-[11px] font-bold text-[#006D77] bg-[#006D77]/10 px-2 py-0.5 rounded-full">
                {institution.code} • {activeSession.venue}
              </span>
            </div>
            <p className={`text-xs mt-0.5 flex flex-wrap items-center gap-3 ${isFullscreen ? 'text-slate-400' : 'text-[#718096]'}`}>
              <span className="flex items-center gap-1">
                <Building size={12} /> {activeSession.venue}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {activeSession.startTime} - {activeSession.endTime}
              </span>
              <span>•</span>
              <span className="font-medium text-slate-700">Topic: {activeSession.topic}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSwitchToManual && (
            <button
              onClick={() => onSwitchToManual(activeSession.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                isFullscreen
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-[#E8EDF0] bg-white text-[#17252F] hover:bg-slate-100'
              }`}
            >
              <CheckSquare size={14} />
              <span>Full Ledger</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-colors ${
              isFullscreen
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-[#E8EDF0] bg-white text-[#17252F] hover:bg-slate-100'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Focus'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => {
              closeSession(activeSession.id);
              if (onCloseSession) onCloseSession();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E45B64] hover:bg-[#d44851] rounded-xl transition-colors shadow-xs"
          >
            <XCircle size={14} />
            <span>Close Session</span>
          </button>
        </div>
      </div>

      {/* Classroom Methodology Selector (Tailored for zero-projector classrooms) */}
      <div className="px-6 py-2.5 bg-[#142B3B] text-white border-b border-[#006D77]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#20B486] uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Sparkles size={13} /> Classroom Mode:
          </span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            (Lecturers do not require projectors — select your preferred delivery method below)
          </span>
        </div>

        {/* 4 Mode Buttons */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
          <button
            onClick={() => setActiveDisplayMode('chalkboard')}
            className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
              activeDisplayMode === 'chalkboard'
                ? 'bg-[#20B486] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Edit3 size={13} />
            <span>1. Chalkboard Code</span>
          </button>

          <button
            onClick={() => setActiveDisplayMode('podium')}
            className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
              activeDisplayMode === 'podium'
                ? 'bg-[#006D77] text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smartphone size={13} />
            <span>2. Desk QR Stand</span>
          </button>

          <button
            onClick={() => setActiveDisplayMode('placard')}
            className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
              activeDisplayMode === 'placard'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Printer size={13} />
            <span>3. Print Placard</span>
          </button>

          <button
            onClick={() => setActiveDisplayMode('rollcall')}
            className={`px-3 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 ${
              activeDisplayMode === 'rollcall'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users size={13} />
            <span>4. Rapid Roll-Call</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Selected Mode on Left, Live Roster Feed on Right */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* LEFT COLUMN: ACTIVE MODE CONTAINER */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {/* MODE 1: CHALKBOARD HALL PASSCODE */}
          {activeDisplayMode === 'chalkboard' && (
            <div className="w-full bg-[#1b3b2b] text-white rounded-3xl p-7 border-4 border-[#2b5943] shadow-lg relative flex flex-col items-center">
              {/* Wooden Chalkboard Header */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#2b5943] text-xs font-mono text-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="font-bold tracking-wider text-emerald-100">
                    LASUSTECH CHALKBOARD BROADCAST
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCodeLocked(!isCodeLocked)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      isCodeLocked
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-white/10 text-emerald-200 hover:bg-white/20'
                    }`}
                    title={isCodeLocked ? 'Code is locked static for the entire lecture' : 'Code refreshes periodically'}
                  >
                    {isCodeLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{isCodeLocked ? 'Locked Static' : 'Rotating Token'}</span>
                  </button>
                </div>
              </div>

              {/* Instructional callout */}
              <div className="w-full my-4 p-3 bg-emerald-950/70 border border-emerald-500/30 rounded-2xl text-center">
                <p className="text-xs text-emerald-200 font-medium">
                  ✍️ <strong className="text-white">Lecturer Action:</strong> Write this 6-digit code clearly on the classroom chalkboard or whiteboard, or announce it verbally to the class. Students enter it on their phones to check in.
                </p>
              </div>

              {/* GIANT CHALK-STYLE 6-DIGIT PASSCODE */}
              <div className="my-3 py-6 px-8 bg-black/30 rounded-2xl border-2 border-dashed border-emerald-400/40 text-center w-full max-w-md">
                <span className="text-[11px] font-mono tracking-widest text-emerald-300 uppercase block mb-1">
                  OFFICIAL ATTENDANCE PASSCODE
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-widest font-mono text-white drop-shadow-md selection:bg-white selection:text-black">
                    {activeSession.qrTokenPasscode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-300/80 mt-2 font-mono">
                  Matric Range: 22040401001 – 22040401006
                </p>
              </div>

              {/* Refresh / Lock controls */}
              <div className="w-full flex items-center justify-between text-xs text-emerald-200 mt-2 px-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rotateQrTokenForSession(activeSession.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                  >
                    <RotateCw size={13} />
                    <span>Generate New Code</span>
                  </button>
                </div>

                {!isCodeLocked && (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-300">Auto-refresh in:</span>
                    <span className="font-bold bg-white/10 px-2 py-0.5 rounded text-white">{secondsRemaining}s</span>
                  </div>
                )}
              </div>

              {/* Simulator button */}
              <button
                onClick={handleSimulateStudentScan}
                className="mt-6 w-full max-w-sm flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all active:scale-98"
              >
                <UserCheck size={16} />
                <span>Simulate Student Code Entry (+1 Checked In)</span>
              </button>
            </div>
          )}

          {/* MODE 2: LECTURER DESK / PODIUM QR STAND */}
          {activeDisplayMode === 'podium' && (
            <div className="w-full bg-slate-50 rounded-3xl p-6 border-2 border-[#006D77]/30 shadow-md flex flex-col items-center">
              <div className="text-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-3 py-1 rounded-full">
                  Podium / Desk Stand Mode
                </span>
                <p className="text-xs text-[#718096] mt-1.5 max-w-sm">
                  Prop your mobile phone or tablet on the teacher's podium or front table. Students walk up and scan the QR code off your screen.
                </p>
              </div>

              {/* High Contrast QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-[#006D77] flex flex-col items-center">
                <canvas ref={canvasRef} className="rounded-lg max-w-full" />
                <div className="mt-2 text-center">
                  <span className="text-xs font-mono font-extrabold text-[#142B3B] tracking-wider">
                    CODE: {activeSession.qrTokenPasscode}
                  </span>
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="w-full max-w-xs mt-4">
                <div className="flex items-center justify-between text-[11px] text-[#718096] mb-1 font-mono">
                  <span>Token Auto-Rotation</span>
                  <span className="font-bold text-[#006D77]">{secondsRemaining}s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006D77] transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${(secondsRemaining / (institution.qrTokenExpirySeconds || 60)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateStudentScan}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-xl transition-colors border border-[#006D77]/20"
              >
                <UserCheck size={14} />
                <span>Simulate Student Scan (+1 Check-in)</span>
              </button>
            </div>
          )}

          {/* MODE 3: PRINTABLE OFFICIAL HALL PLACARD */}
          {activeDisplayMode === 'placard' && (
            <div className="w-full bg-white rounded-3xl p-6 border border-slate-300 shadow-md flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Printable Hall Placard</h4>
                  <p className="text-xs text-gray-500">Print and tape to the classroom door or lectern</p>
                </div>
                <button
                  onClick={handlePrintPlacard}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs"
                >
                  <Printer size={15} />
                  <span>Print Placard (A4)</span>
                </button>
              </div>

              {/* Printable Card Preview Sheet */}
              <div className="w-full max-w-md p-6 bg-white border-2 border-gray-800 rounded-2xl text-center space-y-3 font-sans shadow-sm">
                <div className="border-b-2 border-gray-800 pb-3">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-900">
                    Lagos State University of Science and Technology
                  </h3>
                  <p className="text-[11px] font-bold text-[#006D77] uppercase tracking-wider">
                    College of Information & Communication Technology
                  </p>
                  <p className="text-[10px] text-gray-600">Department of Computer Science • Official Lecture Attendance</p>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-black text-gray-900">{course?.code}: {course?.title}</h2>
                  <p className="text-xs font-semibold text-gray-700">Topic: {activeSession.topic}</p>
                  <p className="text-[11px] text-gray-600">Venue: {activeSession.venue} • Date: {activeSession.lectureDate}</p>
                </div>

                <div className="py-2 flex justify-center">
                  <canvas ref={placardCanvasRef} className="rounded-xl border border-gray-300 shadow-xs" />
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-300">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    MANUAL PASSCODE
                  </span>
                  <span className="text-3xl font-extrabold font-mono tracking-widest text-gray-900">
                    {activeSession.qrTokenPasscode}
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 leading-tight">
                  Students: Open Attendly on your phone, scan this placard OR enter the 6-digit code. Attendance is verified for matric range 22040401001+.
                </p>
              </div>
            </div>
          )}

          {/* MODE 4: RAPID SEQUENTIAL ROLL-CALL */}
          {activeDisplayMode === 'rollcall' && (
            <div className="w-full bg-white rounded-3xl p-6 border border-[#E8EDF0] shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Rapid Sequential Roll-Call</h4>
                  <p className="text-xs text-gray-500">Call matric numbers sequentially and tap attendance</p>
                </div>
                <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200">
                  {sessionRecords.length} / {enrolledStudents.length} Marked
                </span>
              </div>

              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {enrolledStudents.map((student, idx) => {
                  if (!student) return null;
                  const record = sessionRecords.find((r) => r.studentId === student.id);
                  const currentStatus = record?.status || 'absent';

                  return (
                    <div key={student.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold font-mono text-gray-900">{student.matricNumber}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{student.academicStatus.replace('_', ' ')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickMarkRollCall(student.id, 'present')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                            currentStatus === 'present'
                              ? 'bg-[#20B486] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkRollCall(student.id, 'late')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                            currentStatus === 'late'
                              ? 'bg-[#F4B942] text-slate-900 shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkRollCall(student.id, 'excused')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                            currentStatus === 'excused'
                              ? 'bg-[#006D77] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          E
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkRollCall(student.id, 'absent')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                            currentStatus === 'absent'
                              ? 'bg-[#E45B64] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE CHECK-IN STATISTICS & REAL-TIME ACTIVITY FEED */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Real-time stats card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-[#E8EDF0]">
              <span className="text-[10px] font-bold text-[#718096] uppercase">Enrolled</span>
              <p className="text-xl font-bold text-[#17252F] mt-0.5">{activeSession.enrolledCount}</p>
            </div>
            <div className="bg-[#20B486]/10 p-3.5 rounded-xl border border-[#20B486]/20">
              <span className="text-[10px] font-bold text-[#20B486] uppercase">Present</span>
              <p className="text-xl font-bold text-[#20B486] mt-0.5">{sessionRecords.length}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-[#E8EDF0]">
              <span className="text-[10px] font-bold text-[#718096] uppercase">Turnout</span>
              <p className="text-xl font-bold text-[#006D77] mt-0.5">{attendancePercentage}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#20B486] h-full transition-all duration-500 rounded-full"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>

          {/* Live Activity Roster */}
          <div className="bg-white rounded-xl border border-[#E8EDF0] flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8EDF0] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-[#006D77]" />
                <h4 className="text-xs font-bold text-[#17252F] uppercase tracking-wider">
                  Live Check-in Stream ({sessionRecords.length}/{activeSession.enrolledCount})
                </h4>
              </div>
              <span className="text-[10px] text-[#718096] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20B486] animate-ping"></span>
                Receiving checks
              </span>
            </div>

            <div className="p-2 overflow-y-auto max-h-80 divide-y divide-[#E8EDF0]">
              {sessionRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#718096]">
                  Awaiting student check-ins. Students can enter the chalkboard code on their phones now.
                </div>
              ) : (
                sessionRecords.map((record, index) => {
                  const student = studentProfiles.find((s) => s.id === record.studentId);
                  return (
                    <div
                      key={record.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-right-2 duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">
                          #{sessionRecords.length - index}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-[#20B486]/10 text-[#20B486] flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#17252F] font-mono">
                            {student?.matricNumber}
                          </p>
                          <p className="text-[10px] text-[#718096]">
                            Verified via {record.method === 'qr_scan' ? 'Chalkboard Code' : 'Lecturer Roster'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono font-medium text-[#17252F]">
                          {new Date(record.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        <span className="block text-[10px] text-[#20B486] font-semibold uppercase">
                          {record.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
