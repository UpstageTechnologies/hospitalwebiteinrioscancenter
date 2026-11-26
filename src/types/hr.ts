export interface AttendanceRecord {
  id: string;
  hospitalId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation?: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'late';
  shiftType?: 'Morning (07:00-15:00)' | 'Evening (15:00-23:00)' | 'Night (23:00-07:00)' | 'General (09:00-18:00)';
  workHours?: number;
  syncWithBiometric?: boolean;
  attendanceMethod?: 'face_recognition' | 'manual' | 'biometric';
  verificationResult?: string;
  deviceKioskId?: string;
}

export interface LeaveRequest {
  id: string;
  hospitalId: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Casual' | 'Sick' | 'Earned' | 'Maternity/Paternity';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  appliedAt: string;
}

export interface PayrollRecord {
  id: string;
  hospitalId: string;
  payrollMonth: string; // YYYY-MM
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  joiningDate?: string;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  totalWorkingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  unpaidDeductions: number;
  taxDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  paymentStatus: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
  paymentReference?: string;
}
