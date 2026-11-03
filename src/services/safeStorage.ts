/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resilient storage helper that works safely inside sandboxed iframes,
 * private browsing modes, and environments where localStorage may be restricted or undefined.
 */
const inMemoryFallback = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied or disabled in iframe sandbox
    }
    return inMemoryFallback.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Access denied
    }
    inMemoryFallback.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Access denied
    }
    inMemoryFallback.delete(key);
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Access denied
    }
    inMemoryFallback.clear();
  },
};
