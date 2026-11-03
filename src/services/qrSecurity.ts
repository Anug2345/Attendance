/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple robust hash function for cryptographic token simulation
function simpleHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(12, '0');
}

export interface QRPayload {
  v: number; // version 1
  s: string; // sessionId
  c: string; // courseId
  i: string; // institutionId
  t: number; // issued timestamp ms
  tok: string; // secure hash
  code: string; // 6-digit companion code
}

/**
 * Generate a dynamic token and 6-digit passcode for a session window
 */
export function generateDynamicQrToken(
  sessionId: string,
  courseId: string,
  institutionId: string,
  validitySeconds: number = 30
): { token: string; passcode: string; payloadString: string; expiresAt: number; issuedAt: number } {
  const now = Date.now();
  const timeWindow = Math.floor(now / (validitySeconds * 1000));
  const rawKey = `${sessionId}:${courseId}:${timeWindow}:attendly-inst-salt`;
  const token = simpleHash(rawKey);

  // Derive a friendly 6-digit code for fallback entry
  const numPart = Math.abs(parseInt(token.slice(0, 8), 16) % 900000) + 100000;
  const passcode = numPart.toString();

  const payload: QRPayload = {
    v: 1,
    s: sessionId,
    c: courseId,
    i: institutionId,
    t: now,
    tok: token,
    code: passcode,
  };

  const payloadString = JSON.stringify(payload);
  const expiresAt = now + validitySeconds * 1000;

  return {
    token,
    passcode,
    payloadString,
    expiresAt,
    issuedAt: now,
  };
}

/**
 * Validates a scanned QR payload or 6-digit code against the active session
 */
export function validateQrSubmission(
  rawInput: string,
  expectedSessionId: string,
  activeSessionToken: string,
  activePasscode: string,
  expiresAt: number,
  graceSeconds: number = 20
): { valid: boolean; reason?: string; parsedPayload?: QRPayload } {
  const now = Date.now();

  // Check if input is a 6-digit passcode
  const cleaned = rawInput.trim();
  if (/^\d{6}$/.test(cleaned)) {
    if (cleaned !== activePasscode) {
      return { valid: false, reason: 'Invalid 6-digit attendance code.' };
    }
    if (now > expiresAt + graceSeconds * 1000) {
      return { valid: false, reason: 'The attendance passcode has expired. Please use the current code on screen.' };
    }
    return { valid: true };
  }

  // Parse QR JSON payload
  try {
    const payload: QRPayload = JSON.parse(cleaned);
    if (!payload.s || !payload.c || !payload.tok) {
      return { valid: false, reason: 'Malformed QR code format.' };
    }

    if (payload.s !== expectedSessionId) {
      return { valid: false, reason: 'This QR code is for a different lecture session.' };
    }

    // Check expiration with grace period
    if (now > expiresAt + graceSeconds * 1000) {
      return { valid: false, reason: 'QR code has expired. Please scan the updated code on the lecturer screen.' };
    }

    // Check token match
    if (payload.tok !== activeSessionToken && payload.code !== activePasscode) {
      return { valid: false, reason: 'QR code has expired. Please scan the newly generated code.' };
    }

    return { valid: true, parsedPayload: payload };
  } catch {
    return { valid: false, reason: 'Invalid Attendly QR code format.' };
  }
}
