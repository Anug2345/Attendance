/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  Upload,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  VideoOff,
  SwitchCamera,
  Flashlight,
  FlashlightOff,
  QrCode,
  Eye,
  Check,
  Info,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceRecord, AttendanceSession } from '../../types';
import { QRPayload } from '../../services/qrSecurity';

interface StudentQrScannerProps {
  onViewHistory?: () => void;
}

// Audio ping for authentic barcode scanner feedback
function playScannerBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore audio permission/context errors
  }
}

export const StudentQrScanner: React.FC<StudentQrScannerProps> = ({ onViewHistory }) => {
  const { currentUser, studentProfile } = useAuth();
  const { attendanceSessions, courses, checkInStudent, enrollments, attendanceRecords } = useAttendance();

  // Primary mode default is 'camera' so student can scan immediately
  const [inputMode, setInputMode] = useState<'camera' | 'code' | 'upload'>('camera');
  const [passcode, setPasscode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSampleSimulator, setShowSampleSimulator] = useState(false);

  const [successResult, setSuccessResult] = useState<{
    record: AttendanceRecord;
    session: AttendanceSession;
    courseCode: string;
    courseTitle: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(true);

  // Active sessions in university
  const activeSessions = attendanceSessions.filter((s) => s.sessionStatus === 'active');

  // Enrolled active sessions for this student
  const studentEnrolledCourseIds = enrollments
    .filter((e) => e.studentId === studentProfile?.id && e.status === 'enrolled')
    .map((e) => e.courseId);

  const myActiveSessions = activeSessions.filter((s) => studentEnrolledCourseIds.includes(s.courseId));
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Default target session
  const currentTargetSession =
    activeSessions.find((s) => s.id === selectedSessionId) ||
    myActiveSessions[0] ||
    activeSessions[0];

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const handleSuccessfulCheckIn = (session: AttendanceSession, record: AttendanceRecord) => {
    const course = courses.find((c) => c.id === session.courseId);
    setSuccessResult({
      record,
      session,
      courseCode: course?.code || 'Course',
      courseTitle: course?.title || 'Lecture',
    });
    setErrorMessage(null);

    if (soundEnabled) {
      playScannerBeep();
    }

    // Celebration confetti
    try {
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#006D77', '#20B486', '#F4B942', '#142B3B'],
      });
    } catch {
      // ignore
    }
  };

  const processAttendanceSubmission = useCallback((rawInput: string) => {
    if (!studentProfile) {
      setErrorMessage('Student profile record not found. Please log in with your matriculation account.');
      return;
    }

    if (isVerifying) return;

    // Detect session from QR payload if encoded
    let targetSession = currentTargetSession;
    let payloadCodeOrPasscode = rawInput.trim();

    try {
      // Check if rawInput is JSON QR Payload
      const parsed = JSON.parse(rawInput) as Partial<QRPayload>;
      if (parsed.s) {
        const found = attendanceSessions.find((s) => s.id === parsed.s);
        if (found) {
          targetSession = found;
        }
      }
    } catch {
      // It's a 6-digit passcode or plain token
      // Check if passcode matches any active session
      if (/^\d{6}$/.test(payloadCodeOrPasscode)) {
        const matchingByPasscode = activeSessions.find(
          (s) => s.qrTokenPasscode === payloadCodeOrPasscode
        );
        if (matchingByPasscode) {
          targetSession = matchingByPasscode;
        }
      }
    }

    if (!targetSession) {
      setErrorMessage('No active lecture session found for this QR code. Please verify with your lecturer.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = checkInStudent(targetSession.id, studentProfile.id, rawInput);
      setIsVerifying(false);

      if (res.success && res.record) {
        handleSuccessfulCheckIn(targetSession, res.record);
        stopCamera();
      } else {
        setErrorMessage(res.message);
        // Allow re-scanning after error
        setTimeout(() => {
          isScanningRef.current = true;
        }, 1500);
      }
    }, 450);
  }, [studentProfile, isVerifying, currentTargetSession, attendanceSessions, activeSessions, checkInStudent, soundEnabled, stopCamera]);

  // Video scanning tick loop using jsQR + BarcodeDetector fallback
  const tickCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanningRef.current) {
      animationFrameRef.current = requestAnimationFrame(tickCamera);
      return;
    }

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data && qrCode.data.trim().length > 0) {
            isScanningRef.current = false;
            processAttendanceSubmission(qrCode.data);
            return;
          }
        } catch {
          // Frame read error, continue
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(tickCamera);
  }, [processAttendanceSubmission]);

  // Camera start with resilient constraints (supports mobile back camera, front camera, laptop webcams)
  const startCamera = async (facing: 'environment' | 'user') => {
    setCameraError(null);
    stopCamera();
    isScanningRef.current = true;

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera API not accessible in this environment. Use the 6-digit passcode or image upload below.');
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        // Preferred constraint: facingMode ideal
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback constraint: basic video without facingMode constraint (great for laptops)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as unknown as { torch?: boolean }) : {};
        setHasTorchCapability(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      animationFrameRef.current = requestAnimationFrame(tickCamera);
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setCameraError('Camera access was declined. Please allow camera permissions in your browser or enter the 6-digit classroom code.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        setCameraError('No video camera hardware detected on this device. You can enter the 6-digit passcode instead.');
      } else {
        setCameraError('Unable to start live video stream. You can scan an uploaded photo or enter the 6-digit code.');
      }
    }
  };

  // Toggle torch / flashlight if supported
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorch = !torchOn;
      // @ts-expect-error torch is valid in Chromium ImageCapture constraint
      await track.applyConstraints({ advanced: [{ torch: newTorch }] });
      setTorchOn(newTorch);
    } catch {
      // Torch not supported
    }
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Handle uploaded image file scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            processAttendanceSubmission(qrCode.data);
          } else {
            setErrorMessage('No valid Attendly QR code could be detected in this photo. Please ensure the QR is clear and well-lit.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Render Sample Live QR for instant testing without a second device
  useEffect(() => {
    if (!showSampleSimulator || !currentTargetSession || !sampleCanvasRef.current) return;

    const qrPayload = JSON.stringify({
      v: 1,
      s: currentTargetSession.id,
      c: currentTargetSession.courseId,
      i: currentTargetSession.institutionId,
      t: currentTargetSession.qrTokenGeneratedAt,
      tok: currentTargetSession.qrSecretToken,
      code: currentTargetSession.qrTokenPasscode,
    });

    QRCode.toCanvas(sampleCanvasRef.current, qrPayload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#142B3B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    }).catch(() => {});
  }, [showSampleSimulator, currentTargetSession]);

  // Manage camera lifecycle based on selected inputMode
  useEffect(() => {
    if (inputMode === 'camera' && !successResult) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, successResult]);

  // Check if student already checked into current targeted session
  const alreadyCheckedInRecord = currentTargetSession
    ? attendanceRecords.find(
        (r) => r.sessionId === currentTargetSession.id && r.studentId === studentProfile?.id
      )
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title & Institutional Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8EDF0] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#006D77] bg-[#006D77]/10 px-2.5 py-1 rounded-full">
                LASUSTECH Electronic Attendance
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-gray-800 border border-gray-200">
                Matric: {studentProfile?.matricNumber || '22040401001'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#17252F] mt-2 tracking-tight">
              Mark Lecture Attendance
            </h2>
            <p className="text-xs text-[#718096] mt-0.5">
              Scan your lecturer&apos;s dynamic QR placard or enter the 6-digit chalkboard passcode.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-slate-100 text-[#006D77] border-slate-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
              title={soundEnabled ? 'Scanner Beep Sound: ON' : 'Scanner Beep Sound: MUTED'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <div className="p-2.5 rounded-xl bg-[#006D77]/10 text-[#006D77]">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>

        {/* Current Active Course Banner */}
        {currentTargetSession ? (
          <div className="mt-4 p-3.5 bg-[#20B486]/10 border border-[#20B486]/30 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#20B486] animate-ping shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#17252F]">
                      {courses.find((c) => c.id === currentTargetSession.courseId)?.code} -{' '}
                      {currentTargetSession.topic}
                    </span>
                    {alreadyCheckedInRecord && (
                      <span className="text-[10px] font-bold text-white bg-[#20B486] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> Already Marked
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#718096] flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {currentTargetSession.venue}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {currentTargetSession.startTime} - {currentTargetSession.endTime}
                    </span>
                  </p>
                </div>
              </div>

              {/* Interactive Test Simulator Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSampleSimulator(!showSampleSimulator)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#006D77] bg-white hover:bg-slate-50 border border-[#006D77]/30 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye size={13} />
                  <span>{showSampleSimulator ? 'Hide Sample QR' : 'Test with Sample QR'}</span>
                </button>
              </div>
            </div>

            {/* If multiple active sessions, allow selecting */}
            {activeSessions.length > 1 && (
              <div className="pt-2 border-t border-[#20B486]/20 flex items-center gap-2 text-xs">
                <span className="text-gray-600 font-medium">Switch Lecture:</span>
                <select
                  value={currentTargetSession.id}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-800 text-xs rounded-lg px-2 py-1 font-semibold focus:outline-none focus:border-[#006D77]"
                >
                  {activeSessions.map((s) => {
                    const c = courses.find((course) => course.id === s.courseId);
                    return (
                      <option key={s.id} value={s.id}>
                        {c?.code} - {s.topic} ({s.venue})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-3.5 bg-slate-50 border border-[#E8EDF0] rounded-xl text-xs text-[#718096] flex items-center gap-2">
            <Info size={15} />
            <span>No live attendance sessions are currently running for your courses. Check with your lecturer.</span>
          </div>
        )}

        {/* Collapsible Sample QR Simulator for Single-Device or Testing Environments */}
        {showSampleSimulator && currentTargetSession && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#006D77]" />
                  Live Lecturer Placard QR Preview
                </h4>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  This simulates the QR placard displayed on the lecturer&apos;s desk or phone screen.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#006D77]/10 text-[#006D77] px-2 py-0.5 rounded">
                Code: {currentTargetSession.qrTokenPasscode}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-3 bg-white rounded-lg border border-slate-200">
              <div className="p-2 bg-white rounded-lg shadow-xs border border-gray-100 flex flex-col items-center">
                <canvas ref={sampleCanvasRef} className="rounded" />
                <span className="text-[10px] text-gray-400 font-mono mt-1">Point camera here</span>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-gray-700">
                  <p className="font-semibold text-gray-900">
                    {courses.find((c) => c.id === currentTargetSession.courseId)?.code} - {currentTargetSession.topic}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Venue: {currentTargetSession.venue}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const payload = JSON.stringify({
                        v: 1,
                        s: currentTargetSession.id,
                        c: currentTargetSession.courseId,
                        i: currentTargetSession.institutionId,
                        t: currentTargetSession.qrTokenGeneratedAt,
                        tok: currentTargetSession.qrSecretToken,
                        code: currentTargetSession.qrTokenPasscode,
                      });
                      processAttendanceSubmission(payload);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#006D77] hover:bg-[#00555D] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>Instant 1-Click Scan Test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasscode(currentTargetSession.qrTokenPasscode);
                      setInputMode('code');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Use Code ({currentTargetSession.qrTokenPasscode})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS CONFIRMATION RECEIPT */}
      {successResult ? (
        <div className="bg-white rounded-2xl p-8 border border-[#20B486]/30 shadow-md text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-[#20B486]/10 text-[#20B486] mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#20B486] bg-[#20B486]/10 px-3 py-1 rounded-full">
              Electronic Verification Confirmed
            </span>
            <h3 className="text-2xl font-extrabold text-[#17252F] mt-2 tracking-tight">
              Attendance Recorded!
            </h3>
            <p className="text-xs text-[#718096] mt-1 max-w-sm mx-auto">
              Your lecture presence has been electronically captured and certified on the LASUSTECH attendance ledger.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-[#E8EDF0] max-w-md mx-auto text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-[#E8EDF0] pb-2">
              <span className="text-[#718096]">Course:</span>
              <span className="font-bold text-[#17252F]">
                {successResult.courseCode} - {successResult.courseTitle}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E8EDF0] pb-2">
              <span className="text-[#718096]">Student:</span>
              <span className="font-semibold text-[#17252F]">
                {currentUser?.fullName}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E8EDF0] pb-2">
              <span className="text-[#718096]">Matriculation No:</span>
              <span className="font-mono font-bold text-[#006D77]">
                {studentProfile?.matricNumber || '22040401001'}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E8EDF0] pb-2">
              <span className="text-[#718096]">Check-In Timestamp:</span>
              <span className="font-mono text-[#17252F]">
                {new Date(successResult.record.checkInTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}{' '}
                ({new Date(successResult.record.checkInTime).toLocaleDateString()})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#718096]">Ledger Status:</span>
              <span className="text-[#20B486] font-extrabold bg-[#20B486]/10 px-2 py-0.5 rounded text-[11px]">
                PRESENT (VERIFIED)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setPasscode('');
                setInputMode('camera');
              }}
              className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 rounded-xl transition-colors border border-[#E8EDF0]"
            >
              Scan Another Session
            </button>
            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors shadow-xs"
              >
                <span>View My Attendance Records</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* SCANNER & INPUT TABS */
        <div className="bg-white rounded-2xl border border-[#E8EDF0] shadow-sm overflow-hidden">
          {/* Method Selector Tabs */}
          <div className="flex border-b border-[#E8EDF0] bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInputMode('camera')}
              className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                inputMode === 'camera'
                  ? 'border-[#006D77] text-[#006D77] bg-white font-bold'
                  : 'border-transparent text-[#718096] hover:text-[#17252F]'
              }`}
            >
              <Camera size={15} />
              <span>Scan QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('code')}
              className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                inputMode === 'code'
                  ? 'border-[#006D77] text-[#006D77] bg-white font-bold'
                  : 'border-transparent text-[#718096] hover:text-[#17252F]'
              }`}
            >
              <KeyRound size={15} />
              <span>6-Digit Code</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-3 px-3 sm:px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                inputMode === 'upload'
                  ? 'border-[#006D77] text-[#006D77] bg-white font-bold'
                  : 'border-transparent text-[#718096] hover:text-[#17252F]'
              }`}
            >
              <Upload size={15} />
              <span>Upload QR</span>
            </button>
          </div>

          <div className="p-6">
            {/* Error banner */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-[#E45B64]/10 border border-[#E45B64]/20 rounded-xl text-xs text-[#E45B64] flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: FUNCTIONING CAMERA QR SCANNER */}
            {inputMode === 'camera' && (
              <div className="space-y-4 flex flex-col items-center py-2">
                {cameraError ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-[#E8EDF0] max-w-md w-full space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-[#E45B64] mx-auto flex items-center justify-center">
                      <VideoOff size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#17252F]">Camera Stream Unavailable</h4>
                      <p className="text-xs text-[#718096] mt-1">{cameraError}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#006D77] hover:bg-[#00555D] rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('code')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-[#006D77] bg-[#006D77]/10 hover:bg-[#006D77]/20 rounded-xl transition-colors"
                      >
                        Use 6-Digit Passcode
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSampleSimulator(true)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        Test QR Simulator
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm flex flex-col items-center">
                    {/* Viewfinder frame */}
                    <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-[#006D77] shadow-lg flex items-center justify-center">
                      {/* Hidden canvas for image data processing */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Real Video Element */}
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />

                      {/* Overlay: Outer Dimmed Mask & Inner Reticle */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Target Box */}
                        <div className="relative w-3/4 aspect-square rounded-2xl border-2 border-[#20B486]/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] flex flex-col justify-between p-2">
                          {/* Top corner brackets */}
                          <div className="flex justify-between">
                            <span className="w-5 h-5 border-t-4 border-l-4 border-[#20B486] rounded-tl-md" />
                            <span className="w-5 h-5 border-t-4 border-r-4 border-[#20B486] rounded-tr-md" />
                          </div>

                          {/* Center Animated Laser Scanning Beam */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#20B486] to-transparent shadow-[0_0_12px_#20B486] animate-pulse" />

                          {/* Bottom corner brackets */}
                          <div className="flex justify-between">
                            <span className="w-5 h-5 border-b-4 border-l-4 border-[#20B486] rounded-bl-md" />
                            <span className="w-5 h-5 border-b-4 border-r-4 border-[#20B486] rounded-br-md" />
                          </div>
                        </div>
                      </div>

                      {/* Camera Controls Overlay (Top Right & Bottom) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {hasTorchCapability && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
                              torchOn
                                ? 'bg-amber-400 text-slate-900 shadow-md'
                                : 'bg-slate-900/60 text-white hover:bg-slate-900/80'
                            }`}
                            title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                          >
                            {torchOn ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md text-white transition-colors"
                          title="Switch Camera (Front/Back)"
                        >
                          <SwitchCamera size={16} />
                        </button>
                      </div>

                      {/* Status Pill in Bottom of Viewfinder */}
                      <div className="absolute bottom-3 inset-x-3 flex justify-center pointer-events-none z-10">
                        <span className="text-[11px] font-medium text-white/90 bg-slate-900/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#20B486] animate-pulse" />
                          Align QR code inside green reticle
                        </span>
                      </div>

                      {/* Processing spinner overlay */}
                      {isVerifying && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white z-20">
                          <RefreshCw size={26} className="animate-spin text-[#20B486]" />
                          <span className="text-xs font-bold tracking-wide">Validating Token & Session...</span>
                        </div>
                      )}
                    </div>

                    {/* Camera Helper Note */}
                    <p className="text-[11px] text-[#718096] text-center mt-3">
                      Point at the lecturer&apos;s phone screen or printed desk placard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 6-DIGIT CHALKBOARD CODE */}
            {inputMode === 'code' && (
              <div className="space-y-4 max-w-sm mx-auto text-center py-4">
                <div>
                  <h4 className="text-sm font-bold text-[#17252F]">Enter Classroom Attendance Code</h4>
                  <p className="text-xs text-[#718096] mt-0.5">
                    Enter the 6-digit number written on the chalkboard by your lecturer.
                  </p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-52 text-center text-3xl font-extrabold tracking-widest font-mono py-2.5 px-3 border-2 border-[#006D77]/40 rounded-2xl focus:outline-none focus:border-[#006D77] focus:ring-2 focus:ring-[#006D77]/20 bg-slate-50 text-[#142B3B]"
                  />
                </div>

                <button
                  type="button"
                  disabled={passcode.length < 6 || isVerifying}
                  onClick={() => processAttendanceSubmission(passcode)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs flex items-center justify-center gap-2 ${
                    passcode.length === 6 && !isVerifying
                      ? 'bg-[#006D77] hover:bg-[#00555D]'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying Cryptographic Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Submit Attendance</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: UPLOAD PHOTO OF QR */}
            {inputMode === 'upload' && (
              <div className="max-w-sm mx-auto text-center py-4 space-y-4">
                <label className="border-2 border-dashed border-[#E8EDF0] hover:border-[#006D77] rounded-2xl p-8 block cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 group">
                  <Upload size={32} className="mx-auto text-[#006D77] group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs font-bold text-[#17252F] block">Select QR Screenshot or Photo</span>
                  <span className="text-[11px] text-[#718096] block mt-0.5">Supports PNG, JPG, WEBP from gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <p className="text-[11px] text-[#718096]">
                  Take a photo of the desk placard or screenshot a shared code to mark your attendance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
