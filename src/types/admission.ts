export type BedStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';

export type WardType = 'General Ward' | 'Semi-Private' | 'Private Deluxe' | 'ICU' | 'NICU' | 'Emergency / Triage' | 'Maternity';

export interface Bed {
  id: string;
  hospitalId: string;
  bedNumber: string; // e.g. GW-01, ICU-04
  wardId: string;
  wardName: string;
  wardType: WardType;
  floor: string;
  dailyRate: number;
  status: BedStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  currentPatientUhid?: string;
  admissionId?: string;
  lastCleanedAt?: string;
  category?: string;
}

export interface Ward {
  id: string;
  hospitalId: string;
  name: string;
  type: WardType;
  floor: string;
  inchargeStaffId?: string;
  inchargeStaffName?: string;
  totalBeds: number;
  availableBeds: number;
}

export interface AdmissionRequest {
  id: string;
  hospitalId: string;
  consultationId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  isVip: boolean;
  priority?: 'Normal' | 'VIP' | 'Emergency';
  notes: string;
  reason?: string;
  status: 'pending' | 'allocated' | 'rejected';
  requestedAt: string;
  allocatedBedId?: string;
  allocatedBedNumber?: string;
  allocatedWardName?: string;
  allocatedAt?: string;
}

export interface Admission {
  id: string;
  hospitalId: string;
  admissionNumber: string; // e.g. IP-2026-089
  patientId: string;
  patientName: string;
  patientUhid: string;
  admittingDoctorId: string;
  admittingDoctorName: string;
  wardId: string;
  wardName: string;
  bedId: string;
  bedNumber: string;
  admissionDate: string;
  admissionReason: string;
  admittingDiagnosis: string;
  assignedNurseName?: string;
  advanceDepositPaid: number;
  status: 'active' | 'transferred' | 'discharge_planned' | 'discharged';
  dischargeDate?: string;
  dischargeSummary?: {
    conditionAtDischarge: string;
    finalDiagnosis: string;
    medicationsAdvised: string;
    followUpInstructions: string;
    dischargedByDoctorName: string;
  };
}
