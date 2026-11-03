/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'lecturer' | 'student';

export interface Institution {
  id: string;
  name: string;
  code: string;
  motto: string;
  logoUrl?: string;
  contactEmail: string;
  timezone: string;
  defaultAttendanceThreshold: number; // e.g. 75 (%)
  latePenaltyWeight: number; // e.g. 0.5 (counts as 50% attended) or 1.0
  countExcusedAsAttended: boolean;
  qrTokenExpirySeconds: number; // default 30s
  allowStudentAppeals: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  institutionId: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  institutionId: string;
  matricNumber: string; // e.g. 22040401001
  matriculationNumber?: string; // alias
  facultyId: string;
  departmentId: string;
  levelId: string;
  admissionYear: number;
  academicStatus: 'good_standing' | 'probation' | 'graduated';
}

export interface LecturerProfile {
  id: string;
  userId: string;
  institutionId: string;
  staffId: string; // e.g. LEC/2019/904
  facultyId: string;
  departmentId: string;
  designation: string; // e.g. "Senior Lecturer", "Associate Professor"
  officeLocation?: string;
}

export interface Faculty {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  deanName: string;
  active: boolean;
}

export interface Department {
  id: string;
  institutionId: string;
  facultyId: string;
  code: string;
  name: string;
  headOfDepartment: string;
  active: boolean;
}

export interface AcademicSession {
  id: string;
  institutionId: string;
  name: string; // e.g. "2026/2027"
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface Semester {
  id: string;
  institutionId: string;
  sessionId: string;
  name: string; // "First Semester" | "Second Semester"
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface AcademicLevel {
  id: string;
  institutionId: string;
  name: string; // "100 Level", "200 Level", etc.
  code: string; // "100", "200", etc.
}

export interface Course {
  id: string;
  institutionId: string;
  code: string; // e.g. "CSC 411"
  title: string;
  description: string;
  creditUnits: number;
  facultyId: string;
  departmentId: string;
  levelId: string;
  semesterId: string;
  sessionId: string;
  assignedLecturerIds: string[]; // Lecturer user IDs
}

export interface CourseEnrollment {
  id: string;
  institutionId: string;
  courseId: string;
  studentId: string; // Student profile ID
  semesterId: string;
  enrolledAt: string;
  status: 'enrolled' | 'dropped';
}

export type AttendanceMethod = 'qr' | 'manual';
export type AttendanceSessionStatus = 'scheduled' | 'active' | 'closed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export interface AttendanceSession {
  id: string;
  institutionId: string;
  courseId: string;
  lecturerId: string; // User ID
  sessionId: string;
  semesterId: string;
  lectureDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  venue: string;
  topic: string;
  attendanceMethod: AttendanceMethod;
  sessionStatus: AttendanceSessionStatus;
  approvalStatus?: AttendanceApprovalStatus; // Lecturer approval state
  approvedByLecturer?: string; // Lecturer full name
  approvedAt?: string; // Approval timestamp
  approvalNotes?: string;
  qrSecretToken: string; // Rotating secret
  qrTokenPasscode: string; // 6-digit numeric fallback passcode
  qrTokenGeneratedAt: number; // timestamp ms
  qrTokenExpiresAt: number; // timestamp ms
  enrolledCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  createdAt: string;
  closedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  institutionId: string;
  sessionId: string; // AttendanceSession ID
  courseId: string;
  studentId: string; // Student profile ID
  status: AttendanceStatus;
  checkInTime: string; // ISO string
  method: 'qr_scan' | 'manual_lecturer' | 'appeal_correction';
  markedByUserId: string;
  notes?: string;
  deviceMetadata?: string;
  isApproved?: boolean;
  modifiedByLecturer?: string;
  modifiedReason?: string;
  modifiedAt?: string;
}

export interface TimetableSlot {
  id: string;
  institutionId: string;
  courseId: string;
  lecturerId: string;
  departmentId: string;
  levelId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  venue: string;
  semesterId: string;
  sessionId: string;
}

export interface AttendanceAppeal {
  id: string;
  institutionId: string;
  studentId: string; // Student profile ID
  courseId: string;
  attendanceSessionId: string;
  lectureDate: string;
  reason: string;
  supportingDocName?: string;
  status: 'pending' | 'approved' | 'rejected';
  lecturerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  institutionId: string;
  userId: string; // Target user ID or 'all'
  roleTarget?: UserRole | 'all';
  title: string;
  message: string;
  type: 'session_opened' | 'checkin_success' | 'warning' | 'appeal_status' | 'timetable_change' | 'info';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  institutionId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'attendance_session' | 'attendance_record' | 'course' | 'appeal' | 'policy' | 'user';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface StudentAttendanceSummary {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  totalConductedSessions: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  effectiveAttendedCount: number;
  percentage: number;
  statusStanding: 'good_standing' | 'warning' | 'critical';
  isEligibleForExams: boolean;
  sessionsNeededToRecover: number;
}
