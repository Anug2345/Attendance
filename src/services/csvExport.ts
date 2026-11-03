/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Downloads a generated CSV string with institutional headers
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates Course Attendance Register CSV
 */
export function generateCourseRegisterCSV(
  institutionName: string,
  courseCode: string,
  courseTitle: string,
  sessionName: string,
  semesterName: string,
  lecturerName: string,
  studentRows: Array<{
    matricNumber: string;
    fullName: string;
    department: string;
    level: string;
    totalSessions: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    percentage: number;
    eligibility: string;
  }>
): string {
  const lines: string[] = [];

  // Institutional Header
  lines.push(`"${institutionName.toUpperCase()}"`);
  lines.push(`"OFFICIAL COURSE ATTENDANCE REGISTER"`);
  lines.push(`"Course: ${courseCode} - ${courseTitle}"`);
  lines.push(`"Academic Session: ${sessionName} | Semester: ${semesterName}"`);
  lines.push(`"Course Lecturer: ${lecturerName}"`);
  lines.push(`"Generated On: ${new Date().toLocaleString()}"`);
  lines.push(``);

  // Table Header
  lines.push(
    [
      'S/N',
      'Matriculation Number',
      'Student Full Name',
      'Department',
      'Academic Level',
      'Total Lectures',
      'Present',
      'Late',
      'Absent',
      'Excused',
      'Attendance %',
      'Exam Status',
    ]
      .map((h) => `"${h}"`)
      .join(',')
  );

  // Data rows
  studentRows.forEach((row, index) => {
    lines.push(
      [
        index + 1,
        row.matricNumber,
        row.fullName,
        row.department,
        row.level,
        row.totalSessions,
        row.present,
        row.late,
        row.absent,
        row.excused,
        `${row.percentage}%`,
        row.eligibility,
      ]
        .map((cell) => `"${cell}"`)
        .join(',')
    );
  });

  return lines.join('\n');
}

/**
 * Generates Student Personal Attendance Transcript CSV
 */
export function generateStudentTranscriptCSV(
  institutionName: string,
  studentName: string,
  matricNumber: string,
  departmentName: string,
  levelName: string,
  courseRows: Array<{
    code: string;
    title: string;
    lecturer: string;
    totalSessions: number;
    attended: number;
    late: number;
    missed: number;
    percentage: number;
    status: string;
  }>
): string {
  const lines: string[] = [];

  lines.push(`"${institutionName.toUpperCase()}"`);
  lines.push(`"STUDENT OFFICIAL ATTENDANCE TRANSCRIPT"`);
  lines.push(`"Student: ${studentName} (${matricNumber})"`);
  lines.push(`"Department: ${departmentName} | Level: ${levelName}"`);
  lines.push(`"Issued Date: ${new Date().toLocaleDateString()}"`);
  lines.push(``);

  lines.push(
    ['Course Code', 'Course Title', 'Lecturer', 'Total Classes', 'Present', 'Late', 'Missed', 'Percentage', 'Eligibility Standing']
      .map((h) => `"${h}"`)
      .join(',')
  );

  courseRows.forEach((row) => {
    lines.push(
      [
        row.code,
        row.title,
        row.lecturer,
        row.totalSessions,
        row.attended,
        row.late,
        row.missed,
        `${row.percentage}%`,
        row.status,
      ]
        .map((c) => `"${c}"`)
        .join(',')
    );
  });

  return lines.join('\n');
}
