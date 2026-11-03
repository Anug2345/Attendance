/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_ACADEMIC_SESSIONS,
  INITIAL_APPEALS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_FACULTIES,
  INITIAL_INSTITUTION,
  INITIAL_LECTURER_PROFILES,
  INITIAL_LEVELS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SEMESTERS,
  INITIAL_STUDENT_PROFILES,
  INITIAL_TIMETABLES,
  INITIAL_USERS,
} from '../data/seedData';
import { generateDynamicQrToken, validateQrSubmission } from '../services/qrSecurity';
import { safeStorage } from '../services/safeStorage';
import {
  AcademicLevel,
  AcademicSession,
  AttendanceAppeal,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  AuditLog,
  Course,
  CourseEnrollment,
  Department,
  Faculty,
  Institution,
  LecturerProfile,
  Semester,
  StudentProfile,
  SystemNotification,
  TimetableSlot,
  User,
} from '../types';

interface AttendanceContextType {
  institution: Institution;
  faculties: Faculty[];
  departments: Department[];
  academicSessions: AcademicSession[];
  semesters: Semester[];
  levels: AcademicLevel[];
  courses: Course[];
  enrollments: CourseEnrollment[];
  timetables: TimetableSlot[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  appeals: AttendanceAppeal[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  studentProfiles: StudentProfile[];
  lecturerProfiles: LecturerProfile[];
  allUsers: User[];

  // Session actions
  startNewSession: (data: {
    courseId: string;
    lecturerId: string;
    topic: string;
    venue: string;
    method: 'qr' | 'manual';
    startTime?: string;
    endTime?: string;
  }) => AttendanceSession;
  closeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  rotateQrTokenForSession: (sessionId: string) => { token: string; passcode: string; expiresAt: number } | null;

  // Student check-in
  checkInStudent: (
    sessionId: string,
    studentId: string,
    rawQrOrPasscode: string
  ) => { success: boolean; message: string; record?: AttendanceRecord };

  // Manual register
  saveManualAttendance: (
    sessionId: string,
    records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>
  ) => void;

  // Appeals
  submitAppeal: (data: {
    studentId: string;
    courseId: string;
    attendanceSessionId: string;
    lectureDate: string;
    reason: string;
    docName?: string;
  }) => void;
  reviewAppeal: (appealId: string, status: 'approved' | 'rejected', reviewerName: string, notes?: string) => void;

  // Academic management
  addCourse: (course: Omit<Course, 'id' | 'institutionId'>) => Course;
  updateCourse: (courseId: string, data: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  enrollStudent: (courseId: string, studentId: string) => void;
  bulkEnrollStudents: (courseId: string, studentIds: string[]) => void;
  addFaculty: (faculty: Omit<Faculty, 'id' | 'institutionId'>) => Faculty;
  addDepartment: (department: Omit<Department, 'id' | 'institutionId'>) => Department;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id' | 'institutionId'>) => TimetableSlot;
  deleteTimetableSlot: (slotId: string) => void;

  // Lecturer Attendance Admin & Approval actions
  modifyAttendanceRecord: (params: {
    recordId: string;
    newStatus: AttendanceStatus;
    lecturerName: string;
    reason: string;
  }) => void;
  approveSessionAttendance: (params: {
    sessionId: string;
    lecturerName: string;
    notes?: string;
  }) => void;
  unlockSessionAttendance: (sessionId: string, lecturerName: string, reason: string) => void;
  recordManualAttendanceForStudent: (params: {
    sessionId: string;
    studentId: string;
    status: AttendanceStatus;
    lecturerName: string;
    notes?: string;
  }) => void;

  // Policy & settings
  updateInstitution: (updates: Partial<Institution>) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  resetToDemoData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = safeStorage.getItem(`attendly_${key}`);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    // Auto-migrate legacy Apex references
    if (key === 'institution' && (parsed?.name?.includes('Apex') || !parsed?.name?.includes('Lagos'))) {
      safeStorage.setItem(`attendly_${key}`, JSON.stringify(defaultValue));
      return defaultValue;
    }
    if (key === 'faculties' && Array.isArray(parsed) && parsed.some((f: any) => f.code === 'FCIT')) {
      safeStorage.setItem(`attendly_${key}`, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return parsed;
  } catch {
    return defaultValue;
  }
}

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institution, setInstitution] = useState<Institution>(() =>
    loadFromStorage('institution', INITIAL_INSTITUTION)
  );
  const [faculties, setFaculties] = useState<Faculty[]>(() =>
    loadFromStorage('faculties', INITIAL_FACULTIES)
  );
  const [departments, setDepartments] = useState<Department[]>(() =>
    loadFromStorage('departments', INITIAL_DEPARTMENTS)
  );
  const [academicSessions] = useState<AcademicSession[]>(() =>
    loadFromStorage('academic_sessions', INITIAL_ACADEMIC_SESSIONS)
  );
  const [semesters] = useState<Semester[]>(() =>
    loadFromStorage('semesters', INITIAL_SEMESTERS)
  );
  const [levels] = useState<AcademicLevel[]>(() =>
    loadFromStorage('levels', INITIAL_LEVELS)
  );
  const [courses, setCourses] = useState<Course[]>(() =>
    loadFromStorage('courses', INITIAL_COURSES)
  );
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(() =>
    loadFromStorage('enrollments', INITIAL_ENROLLMENTS)
  );
  const [timetables, setTimetables] = useState<TimetableSlot[]>(() =>
    loadFromStorage('timetables', INITIAL_TIMETABLES)
  );
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() =>
    loadFromStorage('attendance_sessions', INITIAL_ATTENDANCE_SESSIONS)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    loadFromStorage('attendance_records', INITIAL_ATTENDANCE_RECORDS)
  );
  const [appeals, setAppeals] = useState<AttendanceAppeal[]>(() =>
    loadFromStorage('appeals', INITIAL_APPEALS)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    loadFromStorage('notifications', INITIAL_NOTIFICATIONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(() => {
    const loaded = loadFromStorage('students', INITIAL_STUDENT_PROFILES);
    // Ensure all student profiles strictly adhere to the university matric sequence 22040401001, 22040401002, etc.
    return loaded.map((st, idx) => {
      const seed = INITIAL_STUDENT_PROFILES.find((s) => s.id === st.id) || INITIAL_STUDENT_PROFILES[idx];
      const targetMatric = seed?.matricNumber || seed?.matriculationNumber || `2204040100${idx + 1}`;
      return {
        ...st,
        matricNumber: targetMatric,
        matriculationNumber: targetMatric,
      };
    });
  });
  const [lecturerProfiles] = useState<LecturerProfile[]>(() =>
    loadFromStorage('lecturers', INITIAL_LECTURER_PROFILES)
  );

  useEffect(() => {
    safeStorage.setItem('attendly_students', JSON.stringify(studentProfiles));
  }, [studentProfiles]);

  // Persistence helpers
  useEffect(() => {
    safeStorage.setItem('attendly_institution', JSON.stringify(institution));
  }, [institution]);

  useEffect(() => {
    safeStorage.setItem('attendly_faculties', JSON.stringify(faculties));
  }, [faculties]);

  useEffect(() => {
    safeStorage.setItem('attendly_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    safeStorage.setItem('attendly_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    safeStorage.setItem('attendly_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  useEffect(() => {
    safeStorage.setItem('attendly_timetables', JSON.stringify(timetables));
  }, [timetables]);

  useEffect(() => {
    safeStorage.setItem('attendly_attendance_sessions', JSON.stringify(attendanceSessions));
  }, [attendanceSessions]);

  useEffect(() => {
    safeStorage.setItem('attendly_attendance_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    safeStorage.setItem('attendly_appeals', JSON.stringify(appeals));
  }, [appeals]);

  useEffect(() => {
    safeStorage.setItem('attendly_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    safeStorage.setItem('attendly_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Rotate active QR tokens every 30 seconds automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setAttendanceSessions((prev) =>
        prev.map((sess) => {
          if (sess.sessionStatus !== 'active' || sess.attendanceMethod !== 'qr') {
            return sess;
          }
          const now = Date.now();
          if (now >= sess.qrTokenExpiresAt) {
            const dynamic = generateDynamicQrToken(
              sess.id,
              sess.courseId,
              sess.institutionId,
              institution.qrTokenExpirySeconds || 30
            );
            return {
              ...sess,
              qrSecretToken: dynamic.token,
              qrTokenPasscode: dynamic.passcode,
              qrTokenGeneratedAt: dynamic.issuedAt,
              qrTokenExpiresAt: dynamic.expiresAt,
            };
          }
          return sess;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [institution.qrTokenExpirySeconds]);

  const addAuditLog = useCallback(
    (entry: Omit<AuditLog, 'id' | 'institutionId' | 'timestamp'>) => {
      const newLog: AuditLog = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        institutionId: institution.id,
        timestamp: new Date().toISOString(),
        ...entry,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [institution.id]
  );

  const rotateQrTokenForSession = useCallback(
    (sessionId: string) => {
      let result: { token: string; passcode: string; expiresAt: number } | null = null;
      setAttendanceSessions((prev) =>
        prev.map((sess) => {
          if (sess.id === sessionId) {
            const dynamic = generateDynamicQrToken(
              sess.id,
              sess.courseId,
              sess.institutionId,
              institution.qrTokenExpirySeconds || 30
            );
            result = {
              token: dynamic.token,
              passcode: dynamic.passcode,
              expiresAt: dynamic.expiresAt,
            };
            return {
              ...sess,
              qrSecretToken: dynamic.token,
              qrTokenPasscode: dynamic.passcode,
              qrTokenGeneratedAt: dynamic.issuedAt,
              qrTokenExpiresAt: dynamic.expiresAt,
            };
          }
          return sess;
        })
      );
      return result;
    },
    [institution.qrTokenExpirySeconds]
  );

  const startNewSession = useCallback(
    ({
      courseId,
      lecturerId,
      topic,
      venue,
      method,
      startTime = '09:00',
      endTime = '11:00',
    }: {
      courseId: string;
      lecturerId: string;
      topic: string;
      venue: string;
      method: 'qr' | 'manual';
      startTime?: string;
      endTime?: string;
    }): AttendanceSession => {
      const sessionId = `as_${courseId.replace('crs_', '')}_${Date.now().toString().slice(-6)}`;
      const dynamic = generateDynamicQrToken(
        sessionId,
        courseId,
        institution.id,
        institution.qrTokenExpirySeconds || 30
      );
      const enrolledCount = enrollments.filter(
        (e) => e.courseId === courseId && e.status === 'enrolled'
      ).length;

      const course = courses.find((c) => c.id === courseId);
      const todayStr = new Date().toISOString().split('T')[0];

      const newSession: AttendanceSession = {
        id: sessionId,
        institutionId: institution.id,
        courseId,
        lecturerId,
        sessionId: academicSessions.find((s) => s.isCurrent)?.id || 'sess_2026_2027',
        semesterId: semesters.find((s) => s.isCurrent)?.id || 'sem_first_2026',
        lectureDate: todayStr,
        startTime,
        endTime,
        venue,
        topic,
        attendanceMethod: method,
        sessionStatus: 'active',
        qrSecretToken: dynamic.token,
        qrTokenPasscode: dynamic.passcode,
        qrTokenGeneratedAt: dynamic.issuedAt,
        qrTokenExpiresAt: dynamic.expiresAt,
        enrolledCount,
        presentCount: 0,
        absentCount: enrolledCount,
        lateCount: 0,
        excusedCount: 0,
        createdAt: new Date().toISOString(),
      };

      setAttendanceSessions((prev) => [newSession, ...prev]);

      // Create notification for enrolled students
      const enrolledStudents = enrollments.filter(
        (e) => e.courseId === courseId && e.status === 'enrolled'
      );
      const newNotifications: SystemNotification[] = enrolledStudents.map((e) => {
        const student = studentProfiles.find((s) => s.id === e.studentId);
        return {
          id: `notif_${Date.now()}_${e.studentId}`,
          institutionId: institution.id,
          userId: student ? student.userId : 'all',
          roleTarget: 'student',
          title: `Attendance Session Active: ${course?.code || 'Course'}`,
          message: `${course?.code} lecture "${topic}" is open for attendance at ${venue}.`,
          type: 'session_opened',
          isRead: false,
          link: 'scanner',
          createdAt: new Date().toISOString(),
        };
      });

      setNotifications((prev) => [...newNotifications, ...prev]);

      addAuditLog({
        actorUserId: lecturerId,
        actorName: 'Lecturer',
        actorRole: 'lecturer',
        action: 'STARTED_ATTENDANCE_SESSION',
        entityType: 'attendance_session',
        entityId: sessionId,
        details: `Started ${method.toUpperCase()} attendance session for ${course?.code || courseId}: "${topic}" at ${venue}.`,
      });

      return newSession;
    },
    [academicSessions, addAuditLog, courses, enrollments, institution.id, institution.qrTokenExpirySeconds, semesters, studentProfiles]
  );

  const closeSession = useCallback(
    (sessionId: string) => {
      setAttendanceSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              sessionStatus: 'closed',
              closedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );

      addAuditLog({
        actorUserId: 'system',
        actorName: 'Lecturer',
        actorRole: 'lecturer',
        action: 'CLOSED_ATTENDANCE_SESSION',
        entityType: 'attendance_session',
        entityId: sessionId,
        details: `Closed attendance session ${sessionId}. Final check-ins locked.`,
      });
    },
    [addAuditLog]
  );

  const cancelSession = useCallback(
    (sessionId: string) => {
      setAttendanceSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return { ...s, sessionStatus: 'cancelled' };
          }
          return s;
        })
      );

      addAuditLog({
        actorUserId: 'system',
        actorName: 'Lecturer',
        actorRole: 'lecturer',
        action: 'CANCELLED_ATTENDANCE_SESSION',
        entityType: 'attendance_session',
        entityId: sessionId,
        details: `Cancelled lecture session ${sessionId}. Excluded from attendance percentage denominator.`,
      });
    },
    [addAuditLog]
  );

  const checkInStudent = useCallback(
    (
      sessionId: string,
      studentProfileId: string,
      rawQrOrPasscode: string
    ): { success: boolean; message: string; record?: AttendanceRecord } => {
      const session = attendanceSessions.find((s) => s.id === sessionId);
      if (!session) {
        return { success: false, message: 'Attendance session not found.' };
      }

      if (session.sessionStatus === 'closed') {
        return { success: false, message: 'Attendance session is closed. No further check-ins permitted.' };
      }

      if (session.sessionStatus === 'cancelled') {
        return { success: false, message: 'This lecture session was cancelled.' };
      }

      // Check if student is enrolled in the course
      const isEnrolled = enrollments.some(
        (e) => e.courseId === session.courseId && e.studentId === studentProfileId && e.status === 'enrolled'
      );
      if (!isEnrolled) {
        return { success: false, message: 'You are not enrolled in this course.' };
      }

      // Check duplicate check-in
      const alreadyCheckedIn = attendanceRecords.some(
        (r) => r.sessionId === sessionId && r.studentId === studentProfileId
      );
      if (alreadyCheckedIn) {
        return { success: false, message: 'Attendance for this session has already been recorded.' };
      }

      // Validate token or passcode
      const validation = validateQrSubmission(
        rawQrOrPasscode,
        sessionId,
        session.qrSecretToken,
        session.qrTokenPasscode,
        session.qrTokenExpiresAt
      );

      if (!validation.valid) {
        return { success: false, message: validation.reason || 'Invalid QR code or expired code.' };
      }

      // Determine if Late or Present based on session start time
      // Let's grant 20 mins grace for "present", beyond that "late"
      const now = new Date();
      const status: AttendanceStatus = 'present';

      const newRecord: AttendanceRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        institutionId: institution.id,
        sessionId,
        courseId: session.courseId,
        studentId: studentProfileId,
        status,
        checkInTime: now.toISOString(),
        method: 'qr_scan',
        markedByUserId: 'system_qr_validator',
        deviceMetadata: 'Mobile Client (Verified Token)',
      };

      setAttendanceRecords((prev) => [...prev, newRecord]);

      // Update session counts
      setAttendanceSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            const nextPresent = s.presentCount + 1;
            const nextAbsent = Math.max(0, s.enrolledCount - nextPresent - s.lateCount - s.excusedCount);
            return {
              ...s,
              presentCount: nextPresent,
              absentCount: nextAbsent,
            };
          }
          return s;
        })
      );

      // Student notification
      const student = studentProfiles.find((s) => s.id === studentProfileId);
      const course = courses.find((c) => c.id === session.courseId);
      if (student) {
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            institutionId: institution.id,
            userId: student.userId,
            roleTarget: 'student',
            title: 'Attendance Confirmed',
            message: `Your attendance in ${course?.code || 'course'} was verified successfully at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            type: 'checkin_success',
            isRead: false,
            link: 'history',
            createdAt: now.toISOString(),
          },
          ...prev,
        ]);
      }

      addAuditLog({
        actorUserId: student ? student.userId : studentProfileId,
        actorName: student ? student.matricNumber : 'Student',
        actorRole: 'student',
        action: 'RECORDED_QR_ATTENDANCE',
        entityType: 'attendance_record',
        entityId: newRecord.id,
        details: `Student ${student?.matricNumber || studentProfileId} checked in for ${course?.code} session ${session.id} via dynamic QR.`,
      });

      return {
        success: true,
        message: 'Attendance recorded successfully.',
        record: newRecord,
      };
    },
    [addAuditLog, attendanceRecords, attendanceSessions, courses, enrollments, institution.id, studentProfiles]
  );

  const saveManualAttendance = useCallback(
    (
      sessionId: string,
      records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>
    ) => {
      const session = attendanceSessions.find((s) => s.id === sessionId);
      if (!session) return;

      const now = new Date().toISOString();

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      const updatedRecords: AttendanceRecord[] = records.map((r) => {
        if (r.status === 'present') presentCount++;
        else if (r.status === 'late') lateCount++;
        else if (r.status === 'excused') excusedCount++;
        else absentCount++;

        return {
          id: `rec_${sessionId}_${r.studentId}`,
          institutionId: institution.id,
          sessionId,
          courseId: session.courseId,
          studentId: r.studentId,
          status: r.status,
          checkInTime: now,
          method: 'manual_lecturer',
          markedByUserId: session.lecturerId,
          notes: r.notes,
        };
      });

      // Filter out existing records for this session and merge new
      setAttendanceRecords((prev) => [
        ...prev.filter((r) => r.sessionId !== sessionId),
        ...updatedRecords,
      ]);

      // Update session statistics
      setAttendanceSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              presentCount,
              lateCount,
              absentCount,
              excusedCount,
            };
          }
          return s;
        })
      );

      const course = courses.find((c) => c.id === session.courseId);
      addAuditLog({
        actorUserId: session.lecturerId,
        actorName: 'Lecturer',
        actorRole: 'lecturer',
        action: 'SUBMITTED_MANUAL_REGISTER',
        entityType: 'attendance_session',
        entityId: sessionId,
        details: `Saved manual attendance register for ${course?.code || session.courseId}: ${presentCount} Present, ${lateCount} Late, ${excusedCount} Excused, ${absentCount} Absent.`,
      });
    },
    [addAuditLog, attendanceSessions, courses, institution.id]
  );

  const submitAppeal = useCallback(
    (data: {
      studentId: string;
      courseId: string;
      attendanceSessionId: string;
      lectureDate: string;
      reason: string;
      docName?: string;
    }) => {
      const newAppeal: AttendanceAppeal = {
        id: `app_${Date.now()}`,
        institutionId: institution.id,
        studentId: data.studentId,
        courseId: data.courseId,
        attendanceSessionId: data.attendanceSessionId,
        lectureDate: data.lectureDate,
        reason: data.reason,
        supportingDocName: data.docName || 'medical_letter.pdf',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setAppeals((prev) => [newAppeal, ...prev]);

      const student = studentProfiles.find((s) => s.id === data.studentId);
      const course = courses.find((c) => c.id === data.courseId);

      addAuditLog({
        actorUserId: student ? student.userId : 'student',
        actorName: student ? student.matricNumber : 'Student',
        actorRole: 'student',
        action: 'SUBMITTED_ATTENDANCE_APPEAL',
        entityType: 'appeal',
        entityId: newAppeal.id,
        details: `Submitted appeal for missed ${course?.code || 'class'} on ${data.lectureDate}: "${data.reason.slice(0, 50)}..."`,
      });
    },
    [addAuditLog, courses, institution.id, studentProfiles]
  );

  const reviewAppeal = useCallback(
    (appealId: string, status: 'approved' | 'rejected', reviewerName: string, notes?: string) => {
      setAppeals((prev) =>
        prev.map((app) => {
          if (app.id === appealId) {
            return {
              ...app,
              status,
              lecturerNotes: notes,
              reviewedBy: reviewerName,
              reviewedAt: new Date().toISOString(),
            };
          }
          return app;
        })
      );

      const targetAppeal = appeals.find((a) => a.id === appealId);
      if (targetAppeal && status === 'approved') {
        // Automatically change the student's attendance record for that session to 'excused'
        setAttendanceRecords((prev) => {
          const exists = prev.find(
            (r) => r.sessionId === targetAppeal.attendanceSessionId && r.studentId === targetAppeal.studentId
          );
          if (exists) {
            return prev.map((r) =>
              r.id === exists.id
                ? {
                    ...r,
                    status: 'excused',
                    method: 'appeal_correction',
                    notes: `Excused via appeal approval: ${notes || 'Legitimate excuse'}`,
                  }
                : r
            );
          } else {
            return [
              ...prev,
              {
                id: `rec_appeal_${appealId}`,
                institutionId: institution.id,
                sessionId: targetAppeal.attendanceSessionId,
                courseId: targetAppeal.courseId,
                studentId: targetAppeal.studentId,
                status: 'excused',
                checkInTime: new Date().toISOString(),
                method: 'appeal_correction',
                markedByUserId: 'lecturer',
                notes: `Excused via appeal approval: ${notes || 'Legitimate excuse'}`,
              },
            ];
          }
        });

        // Notify student
        const student = studentProfiles.find((s) => s.id === targetAppeal.studentId);
        if (student) {
          setNotifications((prev) => [
            {
              id: `notif_${Date.now()}`,
              institutionId: institution.id,
              userId: student.userId,
              roleTarget: 'student',
              title: 'Attendance Appeal Approved',
              message: `Your attendance appeal for lecture on ${targetAppeal.lectureDate} has been approved and marked as Excused.`,
              type: 'appeal_status',
              isRead: false,
              link: 'history',
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }

      addAuditLog({
        actorUserId: 'reviewer',
        actorName: reviewerName,
        actorRole: 'lecturer',
        action: `APPEAL_${status.toUpperCase()}`,
        entityType: 'appeal',
        entityId: appealId,
        details: `Reviewed appeal ${appealId}: Status set to ${status}. Notes: ${notes || 'None'}`,
      });
    },
    [addAuditLog, appeals, institution.id, studentProfiles]
  );

  const addCourse = useCallback(
    (courseData: Omit<Course, 'id' | 'institutionId'>): Course => {
      const newCourse: Course = {
        id: `crs_${courseData.code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`,
        institutionId: institution.id,
        ...courseData,
      };
      setCourses((prev) => [newCourse, ...prev]);

      addAuditLog({
        actorUserId: 'admin',
        actorName: 'Admin',
        actorRole: 'admin',
        action: 'CREATED_COURSE',
        entityType: 'course',
        entityId: newCourse.id,
        details: `Created new course ${newCourse.code}: "${newCourse.title}" (${newCourse.creditUnits} Units)`,
      });

      return newCourse;
    },
    [addAuditLog, institution.id]
  );

  const updateCourse = useCallback(
    (courseId: string, data: Partial<Course>) => {
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...data } : c)));
    },
    []
  );

  const deleteCourse = useCallback((courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setEnrollments((prev) => prev.filter((e) => e.courseId !== courseId));
  }, []);

  const enrollStudent = useCallback(
    (courseId: string, studentId: string) => {
      const exists = enrollments.some((e) => e.courseId === courseId && e.studentId === studentId);
      if (!exists) {
        const newEnr: CourseEnrollment = {
          id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          institutionId: institution.id,
          courseId,
          studentId,
          semesterId: semesters.find((s) => s.isCurrent)?.id || 'sem_first_2026',
          enrolledAt: new Date().toISOString().split('T')[0],
          status: 'enrolled',
        };
        setEnrollments((prev) => [...prev, newEnr]);
      }
    },
    [enrollments, institution.id, semesters]
  );

  const bulkEnrollStudents = useCallback(
    (courseId: string, studentIds: string[]) => {
      const currentSemester = semesters.find((s) => s.isCurrent)?.id || 'sem_first_2026';
      const today = new Date().toISOString().split('T')[0];

      setEnrollments((prev) => {
        const newEntries: CourseEnrollment[] = [];
        studentIds.forEach((sid) => {
          if (!prev.some((e) => e.courseId === courseId && e.studentId === sid)) {
            newEntries.push({
              id: `enr_${Date.now()}_${sid}`,
              institutionId: institution.id,
              courseId,
              studentId: sid,
              semesterId: currentSemester,
              enrolledAt: today,
              status: 'enrolled',
            });
          }
        });
        return [...prev, ...newEntries];
      });
    },
    [institution.id, semesters]
  );

  const addFaculty = useCallback(
    (facData: Omit<Faculty, 'id' | 'institutionId'>): Faculty => {
      const newFac: Faculty = {
        id: `fac_${Date.now()}`,
        institutionId: institution.id,
        ...facData,
      };
      setFaculties((prev) => [...prev, newFac]);
      return newFac;
    },
    [institution.id]
  );

  const addDepartment = useCallback(
    (deptData: Omit<Department, 'id' | 'institutionId'>): Department => {
      const newDept: Department = {
        id: `dept_${Date.now()}`,
        institutionId: institution.id,
        ...deptData,
      };
      setDepartments((prev) => [...prev, newDept]);
      return newDept;
    },
    [institution.id]
  );

  const addTimetableSlot = useCallback(
    (slotData: Omit<TimetableSlot, 'id' | 'institutionId'>): TimetableSlot => {
      const newSlot: TimetableSlot = {
        id: `tt_${Date.now()}`,
        institutionId: institution.id,
        ...slotData,
      };
      setTimetables((prev) => [...prev, newSlot]);
      return newSlot;
    },
    [institution.id]
  );

  const deleteTimetableSlot = useCallback((slotId: string) => {
    setTimetables((prev) => prev.filter((t) => t.id !== slotId));
  }, []);

  const updateInstitution = useCallback((updates: Partial<Institution>) => {
    setInstitution((prev) => ({ ...prev, ...updates }));
  }, []);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback((userId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId || n.userId === 'all' ? { ...n, isRead: true } : n))
    );
  }, []);

  // Lecturer Attendance Admin & Approval implementations
  const modifyAttendanceRecord = useCallback(
    ({
      recordId,
      newStatus,
      lecturerName,
      reason,
    }: {
      recordId: string;
      newStatus: AttendanceStatus;
      lecturerName: string;
      reason: string;
    }) => {
      const nowIso = new Date().toISOString();
      let targetSessionId = '';
      let targetStudentId = '';

      setAttendanceRecords((prev) => {
        const updated = prev.map((rec) => {
          if (rec.id === recordId) {
            targetSessionId = rec.sessionId;
            targetStudentId = rec.studentId;
            return {
              ...rec,
              status: newStatus,
              isApproved: true,
              modifiedByLecturer: lecturerName,
              modifiedReason: reason,
              modifiedAt: nowIso,
            };
          }
          return rec;
        });

        // Recalculate parent session stats
        if (targetSessionId) {
          const sessionRecords = updated.filter((r) => r.sessionId === targetSessionId);
          const presentCount = sessionRecords.filter((r) => r.status === 'present').length;
          const lateCount = sessionRecords.filter((r) => r.status === 'late').length;
          const absentCount = sessionRecords.filter((r) => r.status === 'absent').length;
          const excusedCount = sessionRecords.filter((r) => r.status === 'excused').length;

          setAttendanceSessions((sessPrev) =>
            sessPrev.map((sess) =>
              sess.id === targetSessionId
                ? {
                    ...sess,
                    presentCount,
                    lateCount,
                    absentCount,
                    excusedCount,
                  }
                : sess
            )
          );
        }

        return updated;
      });

      // Audit Log
      setAuditLogs((prev) => [
        {
          id: `audit_${Date.now()}`,
          institutionId: institution.id,
          actorUserId: 'usr_lec_samuel',
          actorName: lecturerName,
          actorRole: 'lecturer',
          action: 'ATTENDANCE_OVERRIDE',
          entityType: 'attendance_record',
          entityId: recordId,
          details: `Lecturer ${lecturerName} changed student (${targetStudentId}) attendance status to '${newStatus}'. Reason: ${reason}`,
          timestamp: nowIso,
        },
        ...prev,
      ]);

      // Student notification
      if (targetStudentId) {
        setNotifications((prev) => [
          {
            id: `notif_${Date.now()}`,
            institutionId: institution.id,
            userId: targetStudentId,
            type: 'info',
            title: 'Attendance Ledger Modified',
            message: `Your lecturer ${lecturerName} updated your attendance status to ${newStatus.toUpperCase()}. Note: ${reason}`,
            isRead: false,
            createdAt: nowIso,
          },
          ...prev,
        ]);
      }
    },
    [institution.id]
  );

  const approveSessionAttendance = useCallback(
    ({
      sessionId,
      lecturerName,
      notes,
    }: {
      sessionId: string;
      lecturerName: string;
      notes?: string;
    }) => {
      const nowIso = new Date().toISOString();

      // Update session status to approved
      setAttendanceSessions((prev) =>
        prev.map((sess) =>
          sess.id === sessionId
            ? {
                ...sess,
                approvalStatus: 'approved',
                approvedByLecturer: lecturerName,
                approvedAt: nowIso,
                approvalNotes: notes || 'Officially endorsed and approved by course lecturer.',
              }
            : sess
        )
      );

      // Lock records as approved
      setAttendanceRecords((prev) =>
        prev.map((rec) =>
          rec.sessionId === sessionId
            ? {
                ...rec,
                isApproved: true,
              }
            : rec
        )
      );

      // Add audit log
      setAuditLogs((prev) => [
        {
          id: `audit_${Date.now()}`,
          institutionId: institution.id,
          actorUserId: 'usr_lec_samuel',
          actorName: lecturerName,
          actorRole: 'lecturer',
          action: 'SESSION_APPROVED',
          entityType: 'attendance_session',
          entityId: sessionId,
          details: `Session ${sessionId} attendance officially certified and approved by ${lecturerName}. ${notes ? `Notes: ${notes}` : ''}`,
          timestamp: nowIso,
        },
        ...prev,
      ]);
    },
    [institution.id]
  );

  const unlockSessionAttendance = useCallback(
    (sessionId: string, lecturerName: string, reason: string) => {
      const nowIso = new Date().toISOString();

      setAttendanceSessions((prev) =>
        prev.map((sess) =>
          sess.id === sessionId
            ? {
                ...sess,
                approvalStatus: 'pending_approval',
                approvalNotes: `Reopened for modification by ${lecturerName}: ${reason}`,
              }
            : sess
        )
      );

      setAuditLogs((prev) => [
        {
          id: `audit_${Date.now()}`,
          institutionId: institution.id,
          actorUserId: 'usr_lec_samuel',
          actorName: lecturerName,
          actorRole: 'lecturer',
          action: 'SESSION_REOPENED',
          entityType: 'attendance_session',
          entityId: sessionId,
          details: `Session ${sessionId} attendance unlocked by ${lecturerName} for modification. Reason: ${reason}`,
          timestamp: nowIso,
        },
        ...prev,
      ]);
    },
    [institution.id]
  );

  const recordManualAttendanceForStudent = useCallback(
    ({
      sessionId,
      studentId,
      status,
      lecturerName,
      notes,
    }: {
      sessionId: string;
      studentId: string;
      status: AttendanceStatus;
      lecturerName: string;
      notes?: string;
    }) => {
      const nowIso = new Date().toISOString();
      const existing = attendanceRecords.find(
        (r) => r.sessionId === sessionId && r.studentId === studentId
      );

      if (existing) {
        modifyAttendanceRecord({
          recordId: existing.id,
          newStatus: status,
          lecturerName,
          reason: notes || 'Lecturer direct roll call adjustment',
        });
        return;
      }

      const targetSess = attendanceSessions.find((s) => s.id === sessionId);

      const newRecord: AttendanceRecord = {
        id: `rec_manual_${Date.now()}`,
        institutionId: institution.id,
        sessionId,
        courseId: targetSess?.courseId || '',
        studentId,
        checkInTime: nowIso,
        method: 'manual_lecturer',
        markedByUserId: 'usr_lec_samuel',
        status,
        notes: notes || `Direct manual entry by ${lecturerName}`,
        isApproved: true,
        modifiedByLecturer: lecturerName,
        modifiedReason: notes || 'Direct manual entry during roll call',
        modifiedAt: nowIso,
      };

      setAttendanceRecords((prev) => {
        const next = [...prev, newRecord];
        const sessionRecords = next.filter((r) => r.sessionId === sessionId);
        const presentCount = sessionRecords.filter((r) => r.status === 'present').length;
        const lateCount = sessionRecords.filter((r) => r.status === 'late').length;
        const absentCount = sessionRecords.filter((r) => r.status === 'absent').length;
        const excusedCount = sessionRecords.filter((r) => r.status === 'excused').length;

        setAttendanceSessions((sessPrev) =>
          sessPrev.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  presentCount,
                  lateCount,
                  absentCount,
                  excusedCount,
                }
              : sess
          )
        );

        return next;
      });

      setAuditLogs((prev) => [
        {
          id: `audit_${Date.now()}`,
          institutionId: institution.id,
          actorUserId: 'usr_lec_samuel',
          actorName: lecturerName,
          actorRole: 'lecturer',
          action: 'MANUAL_ATTENDANCE_ENTRY',
          entityType: 'attendance_record',
          entityId: newRecord.id,
          details: `Manual attendance record created for student ${studentId} as '${status}' by ${lecturerName}`,
          timestamp: nowIso,
        },
        ...prev,
      ]);
    },
    [attendanceRecords, attendanceSessions, institution.id, modifyAttendanceRecord]
  );

  const resetToDemoData = useCallback(() => {
    safeStorage.clear();
    setInstitution(INITIAL_INSTITUTION);
    setFaculties(INITIAL_FACULTIES);
    setDepartments(INITIAL_DEPARTMENTS);
    setCourses(INITIAL_COURSES);
    setEnrollments(INITIAL_ENROLLMENTS);
    setTimetables(INITIAL_TIMETABLES);
    setAttendanceSessions(INITIAL_ATTENDANCE_SESSIONS);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setAppeals(INITIAL_APPEALS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStudentProfiles(INITIAL_STUDENT_PROFILES);
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        institution,
        faculties,
        departments,
        academicSessions,
        semesters,
        levels,
        courses,
        enrollments,
        timetables,
        attendanceSessions,
        attendanceRecords,
        appeals,
        notifications,
        auditLogs,
        studentProfiles,
        lecturerProfiles,
        allUsers: INITIAL_USERS,

        startNewSession,
        closeSession,
        cancelSession,
        rotateQrTokenForSession,
        checkInStudent,
        saveManualAttendance,
        submitAppeal,
        reviewAppeal,
        addCourse,
        updateCourse,
        deleteCourse,
        enrollStudent,
        bulkEnrollStudents,
        addFaculty,
        addDepartment,
        addTimetableSlot,
        deleteTimetableSlot,
        modifyAttendanceRecord,
        approveSessionAttendance,
        unlockSessionAttendance,
        recordManualAttendanceForStudent,
        updateInstitution,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
