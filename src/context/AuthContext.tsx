/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_INSTITUTION,
  INITIAL_LECTURER_PROFILES,
  INITIAL_STUDENT_PROFILES,
  INITIAL_USERS,
} from '../data/seedData';
import { Institution, LecturerProfile, StudentProfile, User, UserRole } from '../types';
import { safeStorage } from '../services/safeStorage';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  institution: Institution;
  studentProfile: StudentProfile | null;
  lecturerProfile: LecturerProfile | null;
  allUsers: User[];
  loginAs: (userId: string) => void;
  loginWithCredentials: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'attendly_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers] = useState<User[]>(() => {
    try {
      const saved = safeStorage.getItem('attendly_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((u: User) => u.email?.includes('apexuniv'))) {
          safeStorage.setItem('attendly_users', JSON.stringify(INITIAL_USERS));
          return INITIAL_USERS;
        }
        return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [institution] = useState<Institution>(() => {
    try {
      const saved = safeStorage.getItem('attendly_institution');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name?.includes('Apex') || !parsed?.name?.includes('Lagos')) {
          safeStorage.setItem('attendly_institution', JSON.stringify(INITIAL_INSTITUTION));
          return INITIAL_INSTITUTION;
        }
        return parsed;
      }
      return INITIAL_INSTITUTION;
    } catch {
      return INITIAL_INSTITUTION;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = safeStorage.getItem(AUTH_STORAGE_KEY);
      return saved || 'usr_lec_samuel';
    } catch {
      return 'usr_lec_samuel';
    }
  });

  useEffect(() => {
    safeStorage.setItem(AUTH_STORAGE_KEY, currentUserId);
  }, [currentUserId]);

  const currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0];
  const currentRole = currentUser?.role || 'lecturer';

  const studentProfile =
    currentRole === 'student'
      ? INITIAL_STUDENT_PROFILES.find((p) => p.userId === currentUser.id) || null
      : null;

  const lecturerProfile =
    currentRole === 'lecturer'
      ? INITIAL_LECTURER_PROFILES.find((p) => p.userId === currentUser.id) || null
      : null;

  const loginAs = (userId: string) => {
    const found = allUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(found.id);
    }
  };

  const loginWithCredentials = (email: string): boolean => {
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUserId(found.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Return to public or first user
    setCurrentUserId('usr_lec_samuel');
  };

  const switchRole = (targetRole: UserRole) => {
    const targetUser = allUsers.find((u) => u.role === targetRole);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        institution,
        studentProfile,
        lecturerProfile,
        allUsers,
        loginAs,
        loginWithCredentials,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
