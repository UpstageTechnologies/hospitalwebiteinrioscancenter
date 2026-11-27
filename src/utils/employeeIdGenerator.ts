import type { RoleId } from '../types/roles';

/**
 * Explicit, unique two-letter role codes for all 17 supported hospital roles.
 * Matches required examples:
 * - Admin: AD (RIO@2026AD001)
 * - HR Manager: HR (RIO@2026HR001)
 * - Doctor: DO (RIO@2026DO001)
 * - Nurse: NU (RIO@2026NU001)
 * - Receptionist: RE (RIO@2026RE001)
 * - Pharmacist: PH (RIO@2026PH001)
 * - Lab Technician: LA (RIO@2026LA001)
 * - Ward In-charge: WA (RIO@2026WA001)
 * - Billing Staff: BI (RIO@2026BI001)
 */
export const ROLE_TWO_LETTER_CODES: Record<RoleId, string> = {
  owner: 'OW',
  admin: 'AD',
  hr_manager: 'HR',
  doctor: 'DO',
  nurse: 'NU',
  receptionist: 'RE',
  pharmacist: 'PH',
  lab_technician: 'LA',
  ward_incharge: 'WA',
  billing_staff: 'BI',
  radiologist: 'RA',
  store_manager: 'ST',
  accountant: 'AC',
  ambulance_driver: 'AM',
  delivery_person: 'DP',
  housekeeping: 'HO',
  security: 'SE',
  maintenance: 'MA'
};

/**
 * Extracts first 3 meaningful letters from hospital name.
 * e.g. "RIO Hospital" -> "RIO", "Upstage Multi-Speciality Hospital" -> "UPS"
 */
export function getHospitalPrefix(hospitalName?: string): string {
  if (!hospitalName || !hospitalName.trim()) return 'UPH';
  const cleaned = hospitalName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 3);
  }
  return cleaned.padEnd(3, 'H');
}

/**
 * Generates an Employee Login ID following the required specification:
 * HOSPITAL_FIRST_3_LETTERS@CURRENT_YEAR + ROLE_FIRST_2_LETTERS + SEQUENCE (3-digit zero padded)
 * Example: RIO@2026DO001, UPS@2026AD001
 */
export function formatEmployeeLoginId(
  hospitalName: string,
  role: RoleId,
  sequence: number,
  year?: number
): string {
  const prefix = getHospitalPrefix(hospitalName);
  const currentYear = year || new Date().getFullYear();
  const roleCode = ROLE_TWO_LETTER_CODES[role] || 'ST';
  const seqStr = String(sequence).padStart(3, '0');
  return `${prefix}@${currentYear}${roleCode}${seqStr}`;
}

/**
 * Generates a deterministic, valid internal synthetic authentication email
 * from the employee's Login ID.
 * Example: "RIO@2026DO001" -> "rio.2026do001@staff.upstagehospital.org"
 */
export function getSyntheticEmailForLoginId(loginId: string): string {
  const normalized = loginId.trim().toLowerCase().replace('@', '.').replace(/[^a-z0-9.]/g, '');
  return `${normalized}@staff.upstagehospital.org`;
}

/**
 * Normalizes input Login ID (e.g. "rio@2026do001 " -> "RIO@2026DO001")
 */
export function normalizeLoginId(rawId: string): string {
  return rawId.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Validates if string follows the Employee Login ID format:
 * e.g. "RIO@2026DO001", "UPS@2026AD005"
 */
export function isValidLoginIdFormat(id: string): boolean {
  const normalized = normalizeLoginId(id);
  const regex = /^[A-Z0-9]{3}@[0-9]{4}[A-Z]{2}[0-9]{3,}$/;
  return regex.test(normalized);
}

/**
 * Password strength evaluation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number; // 0 to 4
  message: string;
} {
  if (!password || password.length < 6) {
    return {
      valid: false,
      score: 1,
      message: 'Password must be at least 6 characters long.'
    };
  }

  let score = 1;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return {
    valid: true,
    score: Math.min(score, 4),
    message: score >= 3 ? 'Strong password' : 'Moderate password'
  };
}
