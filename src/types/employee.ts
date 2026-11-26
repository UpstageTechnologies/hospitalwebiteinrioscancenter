import type { RoleId } from './roles';

export interface EmployeeSalary {
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
}

export interface EmployeeApprovalDetails {
  submittedBy: {
    id: string;
    name: string;
    role: string;
  };
  submittedAt: string;
  reviewedBy?: {
    id: string;
    name: string;
    role: string;
  };
  reviewedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface Employee {
  id: string;
  hospitalId: string;
  employeeCode: string; // e.g. EMP-101
  employeeLoginId?: string; // e.g. RIO@2026DO001 or UPH@2026DO001
  authUid?: string;
  syntheticEmail?: string;
  name: string;
  email?: string;
  phone: string; // Mobile Number
  mobile?: string;
  address?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  departmentId: string;
  departmentName: string;
  designation: string;
  joiningDate: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Probation';
  primaryRole: RoleId;
  additionalRoles: RoleId[];
  requestedAdditionalRoles?: RoleId[];
  rejectedAdditionalRoles?: { role: RoleId; reason?: string }[];
  qualification?: string;
  licenseNumber?: string;
  specialization?: string;
  consultationFee?: number;
  status: 'active' | 'pending_approval' | 'rejected' | 'inactive' | 'suspended';
  availabilityStatus?: 'available' | 'busy' | 'offline';
  activeTaskId?: string;
  lastAvailabilityUpdate?: string;
  attendanceStatus?: 'present' | 'absent' | 'on_leave' | 'half_day' | 'late';
  salaryDetails?: EmployeeSalary;
  avatarUrl?: string;
  profilePhoto?: string;
  approvalDetails?: EmployeeApprovalDetails;
  faceEnrolled?: boolean;
  faceEnrolledAt?: string;
  faceTemplate?: {
    descriptor: number[];
    enrolledAt: string;
    enrolledBy?: string;
    qualityScore?: number;
    samplePhotoUrl?: string;
  };
}
