/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearch } from './components/common/GlobalSearch';
import { RoleGuard } from './components/common/RoleGuard';
import { PortalSwitcherModal } from './components/common/PortalSwitcherModal';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentQrScanner } from './components/student/StudentQrScanner';
import { StudentCourseDetail } from './components/student/StudentCourseDetail';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentTimetable } from './components/student/StudentTimetable';
import { StudentAppeals } from './components/student/StudentAppeals';

// Lecturer Components
import { LecturerDashboard } from './components/lecturer/LecturerDashboard';
import { LecturerCoursesManager } from './components/lecturer/LecturerCoursesManager';
import { LecturerTimetableManager } from './components/lecturer/LecturerTimetableManager';
import { StartSessionModal } from './components/lecturer/StartSessionModal';
import { LiveQrSession } from './components/lecturer/LiveQrSession';
import { ManualRegister } from './components/lecturer/ManualRegister';
import { LecturerAppeals } from './components/lecturer/LecturerAppeals';
import { LecturerReports } from './components/lecturer/LecturerReports';
import { LecturerAttendanceAdmin } from './components/lecturer/LecturerAttendanceAdmin';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AcademicStructure } from './components/admin/AcademicStructure';
import { CoursesManager } from './components/admin/CoursesManager';
import { UserDirectory } from './components/admin/UserDirectory';
import { InstitutionSessions } from './components/admin/InstitutionSessions';
import { InstitutionPolicy } from './components/admin/InstitutionPolicy';
import { AuditLogViewer } from './components/admin/AuditLogViewer';

function AppContent() {
  const { currentRole } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState<boolean>(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [selectedCourseDetailId, setSelectedCourseDetailId] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Switch tab handler
  const handleNavigateToTab = (tab: string, param?: string) => {
    if (tab === 'start-session') {
      setIsStartModalOpen(true);
      return;
    }
    if (param && (tab === 'live-session' || tab === 'manual-register')) {
      setActiveSessionId(param);
    }
    setCurrentTab(tab);
    setSelectedCourseDetailId(null);
  };

  const handleSessionStarted = (sessionId: string, method: 'qr' | 'manual') => {
    setActiveSessionId(sessionId);
    if (method === 'qr') {
      setCurrentTab('live-session');
    } else {
      setCurrentTab('manual-register');
    }
  };

  const handleSearchResult = (type: 'course' | 'student' | 'session', id: string) => {
    if (type === 'course') {
      if (currentRole === 'student') {
        setSelectedCourseDetailId(id);
        setCurrentTab('course-detail');
      } else if (currentRole === 'lecturer') {
        setCurrentTab('my-courses');
      } else {
        setCurrentTab('courses');
      }
    } else if (type === 'session') {
      setActiveSessionId(id);
      if (currentRole === 'lecturer') {
        setCurrentTab('live-session');
      } else if (currentRole === 'student') {
        setCurrentTab('scanner');
      } else {
        setCurrentTab('all-sessions');
      }
    } else if (type === 'student') {
      if (currentRole === 'admin') {
        setCurrentTab('users');
      } else if (currentRole === 'lecturer') {
        setCurrentTab('lecturer-admin');
      }
    }
  };

  const renderRoleViews = () => {
    // 1. STUDENT WORKSPACE (Strictly isolated from faculty controls)
    if (currentRole === 'student') {
      // Check if trying to access restricted lecturer/admin tabs
      const lecturerOnlyTabs = [
        'lecturer-admin',
        'live-session',
        'manual-register',
        'courses',
        'users',
        'faculties-depts',
        'timetables',
        'policies',
        'audit',
        'all-sessions',
      ];

      if (lecturerOnlyTabs.includes(currentTab)) {
        return (
          <RoleGuard
            allowedRoles={['lecturer', 'admin']}
            currentRole={currentRole}
            onNavigateToDefault={() => setCurrentTab('dashboard')}
            onOpenPortalSwitcher={() => setIsPortalModalOpen(true)}
          >
            <div />
          </RoleGuard>
        );
      }

      if (selectedCourseDetailId) {
        return (
          <StudentCourseDetail
            courseId={selectedCourseDetailId}
            onBack={() => setSelectedCourseDetailId(null)}
            onOpenAppeals={() => {
              setSelectedCourseDetailId(null);
              setCurrentTab('appeals');
            }}
          />
        );
      }

      switch (currentTab) {
        case 'dashboard':
        case 'my-courses':
          return (
            <StudentDashboard
              onNavigateToTab={handleNavigateToTab}
              onSelectCourse={(cId) => setSelectedCourseDetailId(cId)}
            />
          );
        case 'scanner':
          return <StudentQrScanner onViewHistory={() => setCurrentTab('history')} />;
        case 'history':
          return <StudentHistory />;
        case 'timetable':
          return <StudentTimetable />;
        case 'appeals':
          return <StudentAppeals />;
        default:
          return (
            <StudentDashboard
              onNavigateToTab={handleNavigateToTab}
              onSelectCourse={(cId) => setSelectedCourseDetailId(cId)}
            />
          );
      }
    }

    // 2. LECTURER WORKSPACE (Course management, Timetable scheduling, Attendance Ledger, Register)
    if (currentRole === 'lecturer') {
      // Check if trying to access student-only check-in scanner
      if (currentTab === 'scanner') {
        return (
          <RoleGuard
            allowedRoles={['student']}
            currentRole={currentRole}
            onNavigateToDefault={() => setCurrentTab('dashboard')}
            onOpenPortalSwitcher={() => setIsPortalModalOpen(true)}
          >
            <div />
          </RoleGuard>
        );
      }

      switch (currentTab) {
        case 'dashboard':
          return (
            <LecturerDashboard
              onNavigateToTab={handleNavigateToTab}
              onOpenStartModal={() => setIsStartModalOpen(true)}
            />
          );
        case 'my-courses':
          return (
            <LecturerCoursesManager
              onStartSession={(courseId) => {
                setIsStartModalOpen(true);
              }}
              onOpenTimetable={() => setCurrentTab('timetable')}
              onOpenLedger={() => setCurrentTab('lecturer-admin')}
            />
          );
        case 'timetable':
          return (
            <LecturerTimetableManager
              onStartSessionForSlot={() => {
                setIsStartModalOpen(true);
              }}
            />
          );
        case 'lecturer-admin':
          return <LecturerAttendanceAdmin />;
        case 'live-session':
          return (
            <LiveQrSession
              sessionId={activeSessionId}
              onCloseSession={() => setCurrentTab('dashboard')}
              onSwitchToManual={(sId) => {
                setActiveSessionId(sId);
                setCurrentTab('manual-register');
              }}
            />
          );
        case 'manual-register':
          return (
            <ManualRegister
              initialSessionId={activeSessionId}
              onSaved={() => setCurrentTab('dashboard')}
            />
          );
        case 'appeals':
          return <LecturerAppeals />;
        case 'reports':
          return <LecturerReports />;
        default:
          return (
            <LecturerDashboard
              onNavigateToTab={handleNavigateToTab}
              onOpenStartModal={() => setIsStartModalOpen(true)}
            />
          );
      }
    }

    // 3. ADMIN WORKSPACE
    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard onNavigateToTab={handleNavigateToTab} />;
      case 'lecturer-admin':
        return <LecturerAttendanceAdmin />;
      case 'all-sessions':
        return (
          <InstitutionSessions
            onInspectSession={(sId) => {
              setActiveSessionId(sId);
            }}
          />
        );
      case 'courses':
        return <CoursesManager />;
      case 'users':
        return <UserDirectory />;
      case 'faculties-depts':
        return <AcademicStructure initialTab="faculties" />;
      case 'timetables':
        return <AcademicStructure initialTab="timetables" />;
      case 'reports':
        return <LecturerReports />;
      case 'policies':
        return <InstitutionPolicy />;
      case 'audit':
        return <AuditLogViewer />;
      default:
        return <AdminDashboard onNavigateToTab={handleNavigateToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#17252F] flex flex-col font-sans">
      {/* Institutional Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateToTab={handleNavigateToTab}
        onOpenPortalSwitcher={() => setIsPortalModalOpen(true)}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Role-Specific Sidebar */}
        <Sidebar
          currentTab={selectedCourseDetailId ? 'my-courses' : currentTab}
          onSelectTab={handleNavigateToTab}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderRoleViews()}
        </main>
      </div>

      {/* Universal Search Modal (Cmd+K) */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onSessionStarted={handleSessionStarted}
      />

      {/* Institutional Portal Switcher & Access Gate */}
      <PortalSwitcherModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        onSwitchedRole={() => {
          setCurrentTab('dashboard');
          setSelectedCourseDetailId(null);
        }}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Attendly uncaught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-2xl border border-[#E8EDF0] shadow-lg max-w-md w-full space-y-4">
            <div className="w-12 h-12 bg-[#006D77]/10 text-[#006D77] rounded-xl mx-auto flex items-center justify-center font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-[#17252F]">System State Restored</h2>
            <p className="text-xs text-[#718096]">
              Attendly recovered from an unexpected rendering condition.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006D77] rounded-xl hover:bg-[#00555D] transition-colors"
            >
              Resume Attendance Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AttendanceProvider>
          <AppContent />
        </AttendanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
