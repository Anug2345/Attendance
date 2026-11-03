/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord, AttendanceSession, Institution, StudentAttendanceSummary } from '../types';

/**
 * Calculates a student's attendance metrics for a specific course based on institutional policies
 */
export function calculateStudentCourseAttendance(
  courseId: string,
  courseCode: string,
  courseTitle: string,
  studentId: string,
  sessions: AttendanceSession[],
  records: AttendanceRecord[],
  institution: Institution,
  plannedTotalSessions: number = 14
): StudentAttendanceSummary {
  // Only consider active, closed, or scheduled non-cancelled sessions for this course
  const validSessions = sessions.filter(
    (s) => s.courseId === courseId && s.sessionStatus !== 'cancelled' && (s.sessionStatus === 'closed' || s.sessionStatus === 'active')
  );

  const studentRecords = records.filter(
    (r) => r.courseId === courseId && r.studentId === studentId && validSessions.some((s) => s.id === r.sessionId)
  );

  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;

  validSessions.forEach((session) => {
    const rec = studentRecords.find((r) => r.sessionId === session.id);
    if (!rec || rec.status === 'absent') {
      absentCount++;
    } else if (rec.status === 'present') {
      presentCount++;
    } else if (rec.status === 'late') {
      lateCount++;
    } else if (rec.status === 'excused') {
      excusedCount++;
    }
  });

  const totalConducted = validSessions.length;

  let effectiveAttended = 0;
  let effectiveTotal = totalConducted;

  if (institution.countExcusedAsAttended) {
    // Excused counts as attended
    effectiveAttended = presentCount + lateCount * institution.latePenaltyWeight + excusedCount;
  } else {
    // Excused is excluded from denominator
    effectiveAttended = presentCount + lateCount * institution.latePenaltyWeight;
    effectiveTotal = Math.max(0, totalConducted - excusedCount);
  }

  const rawPercentage = effectiveTotal > 0 ? (effectiveAttended / effectiveTotal) * 100 : 100;
  const percentage = Math.round(rawPercentage * 10) / 10;

  const threshold = institution.defaultAttendanceThreshold || 75;
  const warningBound = threshold - 5; // e.g. 70%

  let statusStanding: 'good_standing' | 'warning' | 'critical' = 'good_standing';
  if (totalConducted > 0) {
    if (percentage >= threshold) {
      statusStanding = 'good_standing';
    } else if (percentage >= warningBound) {
      statusStanding = 'warning';
    } else {
      statusStanding = 'critical';
    }
  }

  const isEligibleForExams = totalConducted === 0 || percentage >= threshold;

  // Recovery calculation:
  // How many consecutive future classes must be attended with 100% presence
  // such that (effectiveAttended + X) / (totalConducted + X) >= threshold / 100
  let sessionsNeededToRecover = 0;
  if (percentage < threshold && totalConducted > 0) {
    const targetRatio = threshold / 100;
    // (effectiveAttended + X) >= targetRatio * (totalConducted + X)
    // X * (1 - targetRatio) >= targetRatio * totalConducted - effectiveAttended
    const numerator = targetRatio * totalConducted - effectiveAttended;
    const denominator = 1 - targetRatio;
    if (denominator > 0 && numerator > 0) {
      sessionsNeededToRecover = Math.ceil(numerator / denominator);
    }
  }

  return {
    courseId,
    courseCode,
    courseTitle,
    totalConductedSessions: totalConducted,
    presentCount,
    lateCount,
    excusedCount,
    absentCount,
    effectiveAttendedCount: Math.round(effectiveAttended * 10) / 10,
    percentage,
    statusStanding,
    isEligibleForExams,
    sessionsNeededToRecover,
  };
}

/**
 * Calculates overall attendance summary across all registered courses for a student
 */
export function calculateOverallStudentAttendance(summaries: StudentAttendanceSummary[]): {
  overallPercentage: number;
  totalAttended: number;
  totalMissed: number;
  coursesAtRiskCount: number;
  allEligible: boolean;
} {
  if (summaries.length === 0) {
    return {
      overallPercentage: 100,
      totalAttended: 0,
      totalMissed: 0,
      coursesAtRiskCount: 0,
      allEligible: true,
    };
  }

  let totalEffectiveAttended = 0;
  let totalSessions = 0;
  let totalMissed = 0;
  let coursesAtRiskCount = 0;
  let allEligible = true;

  summaries.forEach((s) => {
    totalEffectiveAttended += s.effectiveAttendedCount;
    totalSessions += s.totalConductedSessions;
    totalMissed += s.absentCount;
    if (s.statusStanding === 'critical' || s.statusStanding === 'warning') {
      coursesAtRiskCount++;
    }
    if (!s.isEligibleForExams) {
      allEligible = false;
    }
  });

  const overallPercentage = totalSessions > 0 ? Math.round((totalEffectiveAttended / totalSessions) * 1000) / 10 : 100;

  return {
    overallPercentage,
    totalAttended: Math.round(totalEffectiveAttended),
    totalMissed,
    coursesAtRiskCount,
    allEligible,
  };
}
